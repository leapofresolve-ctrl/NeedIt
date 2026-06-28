import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { EditNeedForm } from "@/components/post/edit-need-form";

export default async function EditNeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/auth/login");

  const { data: request } = await supabase
    .from("requests")
    .select(
      "id, buyer_id, title, description, type, sport, budget_cents, condition_pref, image_url, visibility",
    )
    .eq("id", id)
    .maybeSingle();

  // Not found, not yours, or already public → no edit screen.
  if (!request) notFound();
  if (request.buyer_id !== userId) notFound();
  if (request.visibility !== "private") redirect(`/request/${id}`);

  return (
    <main className="min-h-screen flex flex-col items-center">
      <SiteHeader />
      <div className="w-full max-w-2xl flex flex-col gap-6 p-5">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back
        </Link>
        <EditNeedForm
          need={{
            id: request.id,
            title: request.title,
            description: request.description,
            type: request.type === "bulk" ? "bulk" : "single",
            sport: request.sport,
            budget_cents: request.budget_cents,
            condition_pref: request.condition_pref,
            image_url: request.image_url,
          }}
        />
      </div>
    </main>
  );
}
