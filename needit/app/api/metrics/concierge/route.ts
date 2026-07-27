import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { metricsTokenOk } from "@/lib/metrics-auth";

// Token-protected worklist for the Concierge Scout agent: open, public needs
// with zero offers that expire soon, most-urgent first.
// GET /api/metrics/concierge?hours=48   (default 48, clamped 1..168)
// Header:  Authorization: Bearer <METRICS_API_TOKEN>
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!metricsTokenOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const raw = Number.parseInt(url.searchParams.get("hours") ?? "48", 10);
  const hours = Number.isFinite(raw) ? Math.min(168, Math.max(1, raw)) : 48;

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("concierge_targets", {
    hours_ahead: hours,
  });
  if (error) {
    return NextResponse.json(
      { error: "concierge query failed", detail: error.message },
      { status: 500 },
    );
  }

  const targets = Array.isArray(data) ? data : [];
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    window_hours: hours,
    count: targets.length,
    targets,
  });
}
