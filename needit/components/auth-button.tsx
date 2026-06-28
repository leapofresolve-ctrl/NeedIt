import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "./ui/button";
import { LogoutButton } from "./logout-button";

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

  // Show the pseudonymous username (not the email) and link it to the profile.
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  return (
    <div className="flex items-center gap-4">
      {profile?.username && (
        <Link
          href={`/u/${profile.username}`}
          className="text-sm font-medium hover:underline"
        >
          @{profile.username}
        </Link>
      )}
      <LogoutButton />
    </div>
  );
}
