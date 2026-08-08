import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { PostNeedForm } from "@/components/post/post-need-form";
import { FirstRunHint } from "@/components/onboarding/first-run-hint";

export default async function PostPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.username) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <SiteHeader />
      <div className="w-full max-w-lg flex flex-col gap-4 p-5">
        <FirstRunHint id="post">
          <strong className="font-semibold">
            This is how buying works on Exprifi.
          </strong>{" "}
          You don&apos;t search for cards — you say what you want and your max,
          and sellers come to you.
        </FirstRunHint>
        <PostNeedForm />
      </div>
    </main>
  );
}
