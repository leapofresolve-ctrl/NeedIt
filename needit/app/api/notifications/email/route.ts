import { createClient } from "@supabase/supabase-js";

import { SITE_URL } from "@/lib/site";
import { DIGEST_INTERVAL_DAYS, DIGEST_CADENCE_COPY } from "@/lib/alerts";

export const runtime = "nodejs";

// Called by a Supabase Database Webhook when a row is inserted into `notifications`.
// Looks up the recipient's email + preference and sends a transactional email via Resend.
// Inert (returns 200, sends nothing) until the env vars below are configured.
//
// SITE_URL comes from lib/site — do NOT re-derive it here. This file used to
// carry its own copy defaulting to `https://need-it.vercel.app`, which is the
// exact drift lib/site exists to prevent: that host stopped resolving after the
// domain cutover, so if NEXT_PUBLIC_SITE_URL were ever unset, every link in
// every notification email would point at a 404. See the Aug 1 build-log entry
// — the same dead host, hard-coded in the Supabase webhook, silently killed
// notification email for three days.

function buildEmail(type: string, title: string) {
  switch (type) {
    case "new_offer":
      return {
        subject: "New offer on your Exprifi need",
        line: `You’ve got a new offer on “${title}”.`,
      };
    case "counter":
      return {
        subject: "A counter is waiting on you — Exprifi",
        line: `Someone countered on “${title}”. It’s your move.`,
      };
    case "accepted":
      return {
        subject: "Your Exprifi offer was accepted 🎉",
        line: `Your offer on “${title}” was accepted.`,
      };
    case "declined":
      return {
        subject: "Update on your Exprifi offer",
        line: `Your offer on “${title}” was declined.`,
      };
    // demand_match is deliberately the ONE type that says nothing specific.
    // Naming the card here would be doing the seller's matching for them, and
    // that is the M2 product (see lib/alerts.ts). Free tier gets a nudge to
    // come and look; it does not get the answer delivered.
    case "demand_match":
      return {
        subject: "New demand on Exprifi",
        line: "There’s new demand on the board matching your alerts. Come take a look.",
      };
    default:
      return {
        subject: "Exprifi update",
        line: `There’s an update on “${title}”.`,
      };
  }
}

export async function POST(req: Request) {
  // 1. Verify the shared secret from the webhook.
  const secret = process.env.NOTIFY_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const from = process.env.EMAIL_FROM ?? "Exprifi <onboarding@resend.dev>";

  // Not configured yet → no-op so the webhook doesn't error.
  if (!resendKey || !serviceKey || !supabaseUrl) {
    return Response.json({ skipped: "email not configured" });
  }

  try {
    const payload = await req.json();
    const record = payload?.record ?? payload;
    const userId: string | undefined = record?.user_id;
    const type: string = record?.type ?? "update";
    const requestId: string | undefined = record?.request_id ?? undefined;
    if (!userId) return Response.json({ skipped: "no recipient" });

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const isDemandMatch = type === "demand_match";

    // Respect the user's email preferences — the global switch, plus the
    // per-type one for demand alerts (this route used to ignore the granular
    // flags, so a seller who turned demand alerts off in Settings still got
    // them).
    //
    // ⚠️ The `error` is destructured and treated as a HARD STOP, not as an
    // empty result. On Aug 1 the app deployed ~15 minutes ahead of migration
    // 0017, so this select named a column that didn't exist yet. PostgREST
    // fails the whole query in that case, `profile` came back null, and every
    // `profile && …` guard below silently stopped protecting anyone: demand
    // emails were suppressed AND opted-out members would have been emailed.
    // A preference we cannot read is not a preference we may ignore — when the
    // lookup breaks we send nothing and say so loudly.
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("email_notifications, notify_demand_match, last_demand_digest_at")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error(
        "notification email: preference lookup failed — sending nothing",
        profileError,
      );
      return Response.json({ error: "preference lookup failed" }, { status: 200 });
    }

    if (profile?.email_notifications === false) {
      return Response.json({ skipped: "user opted out" });
    }
    if (isDemandMatch && profile?.notify_demand_match === false) {
      return Response.json({ skipped: "demand alerts off" });
    }

    // ── Free-tier cadence ────────────────────────────────────────────────
    // At most one demand-alert email every few days. The in-app bell already
    // fired instantly and is unaffected — it's on-site, so it doesn't spend
    // the "free = you come look" boundary. See lib/alerts.ts.
    //
    // Claimed with a conditional UPDATE rather than read-then-write: several
    // needs can be published in the same second, and each one POSTs here
    // independently. Whichever request wins the update sends; the rest see
    // zero rows affected and skip.
    if (isDemandMatch) {
      const cutoff = new Date(
        Date.now() - DIGEST_INTERVAL_DAYS * 86_400_000,
      ).toISOString();
      const { data: claimed, error: claimError } = await admin
        .from("profiles")
        .update({ last_demand_digest_at: new Date().toISOString() })
        .eq("id", userId)
        .or(`last_demand_digest_at.is.null,last_demand_digest_at.lt.${cutoff}`)
        .select("id");

      // Same reasoning as the preference lookup: a broken UPDATE and a
      // legitimately-claimed window both produce zero rows, and reporting the
      // former as "within digest window" is how a dead throttle would look
      // perfectly healthy in the logs.
      if (claimError) {
        console.error(
          "notification email: digest-window claim failed — sending nothing",
          claimError,
        );
        return Response.json({ error: "digest claim failed" }, { status: 200 });
      }
      if (!claimed || claimed.length === 0) {
        return Response.json({ skipped: "within digest window" });
      }
    }

    // Recipient email (admin-only) — never exposed elsewhere.
    const { data: userData } = await admin.auth.admin.getUserById(userId);
    const email = userData?.user?.email;
    if (!email) return Response.json({ skipped: "no email" });

    // Request title for context (no counterparty identity — leak defense).
    // Skipped entirely for demand_match: that email is deliberately vague, so
    // there is no reason to read the title, let alone risk it reaching a log.
    let title = "your need";
    if (requestId && !isDemandMatch) {
      const { data: reqRow } = await admin
        .from("requests")
        .select("title")
        .eq("id", requestId)
        .maybeSingle();
      if (reqRow?.title) title = reqRow.title;
    }

    // demand_match points at the board, not the need. Deep-linking to the
    // specific request would hand over the match we just declined to name.
    const link = isDemandMatch
      ? SITE_URL
      : requestId
        ? `${SITE_URL}/request/${requestId}`
        : `${SITE_URL}/notifications`;
    const { subject, line } = buildEmail(type, title);

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 480px;">
        <h2 style="margin:0 0 8px;">Exprifi</h2>
        <p style="font-size:15px;">${line}</p>
        <p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">${isDemandMatch ? "See the board" : "View on Exprifi"}</a></p>
        ${
          isDemandMatch
            ? `<p style="font-size:12px;color:#666;">We send these ${DIGEST_CADENCE_COPY}, so you may find more than one match waiting.</p>`
            : ""
        }
        <p style="font-size:12px;color:#666;">You can turn these emails off in Settings.</p>
      </div>`;
    // TODO (post-M2, needs billing — Block E): add an upsell line to the
    // demand_match email pointing at instant, unlimited, inventory-matched
    // alerts. Deliberately not written yet — there is nothing to sell and no
    // checkout to send anyone to.

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: email, subject, html }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend send failed", res.status, detail);
      return Response.json({ error: "send failed" }, { status: 200 });
    }

    return Response.json({ sent: true });
  } catch (err) {
    console.error("notification email error", err);
    return Response.json({ error: "exception" }, { status: 200 });
  }
}
