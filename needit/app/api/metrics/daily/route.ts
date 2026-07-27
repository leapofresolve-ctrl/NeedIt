import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { metricsTokenOk } from "@/lib/metrics-auth";

// Token-protected daily-metrics JSON for the Morning Metrics Brief agent.
// GET with header:  Authorization: Bearer <METRICS_API_TOKEN>
// Returns the same M1 liquidity numbers as the /metrics dashboard.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!metricsTokenOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("metrics_snapshot");
  if (error) {
    return NextResponse.json(
      { error: "metrics query failed", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    metrics: data,
  });
}
