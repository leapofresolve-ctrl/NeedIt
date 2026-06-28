import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "./ui/button";
import { LogoutButton } from "./logout-button";
import { UserMenu } from "./user-menu";

export async function AuthButton() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant={"default"}>
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  // Show the pseudonymous username (not the email) as an avatar menu.
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.username) {
    // Not onboarded yet — keep a simple logout fallback.
    return <LogoutButton />;
  }

  return <UserMenu username={profile.username} />;
}
