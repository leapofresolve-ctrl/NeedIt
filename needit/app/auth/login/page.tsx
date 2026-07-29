import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  // Auth screens have nothing to index, and a login page in search results is
  // noise at best and a phishing-lookalike target at worst.
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const target = Array.isArray(next) ? next[0] : next;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm next={target} />
      </div>
    </div>
  );
}
