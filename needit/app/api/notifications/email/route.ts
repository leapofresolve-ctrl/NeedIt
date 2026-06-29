import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Called by a Supabase Database Webhook when a row is inserted into `notifications`.
// Looks up the recipient's email + preference and sends a transactional email via Resend.
// Inert (returns 200, sends nothing) until the env vars below are configured.

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://need-it.vercel.app";

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

    // Respect the user's email preference.
    const { data: profile } = await admin
      .from("profiles")
      .select("email_notifications")
      .eq("id", userId)
      .maybeSingle();
    if (profile && profile.email_notifications === false) {
      return Response.json({ skipped: "user opted out" });
    }

    // Recipient email (admin-only) — never exposed elsewhere.
    const { data: userData } = await admin.auth.admin.getUserById(userId);
    const email = userData?.user?.email;
    if (!email) return Response.json({ skipped: "no email" });

    // Request title for context (no counterparty identity — leak defense).
    let title = "your need";
    if (requestId) {
      const { data: reqRow } = await admin
        .from("requests")
        .select("title")
        .eq("id", requestId)
        .maybeSingle();
      if (reqRow?.title) title = reqRow.title;
    }

    const link = requestId
      ? `${SITE_URL}/request/${requestId}`
      : `${SITE_URL}/notifications`;
    const { subject, line } = buildEmail(type, title);

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 480px;">
        <h2 style="margin:0 0 8px;">Exprifi</h2>
        <p style="font-size:15px;">${line}</p>
        <p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">View on Exprifi</a></p>
        <p style="font-size:12px;color:#666;">You can turn these emails off in Settings.</p>
      </div>`;

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
