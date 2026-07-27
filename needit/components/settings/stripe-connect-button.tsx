"use client";

import { useState } from "react";

/**
 * Kicks off seller Stripe Connect onboarding. POSTs to /api/stripe/connect and
 * sends the browser to the hosted onboarding URL Stripe returns.
 */
export function StripeConnectButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError(data?.error ?? "Something went wrong. Try again.");
        setLoading(false);
      }
    } catch {
      setError("Couldn't reach the server. Is the dev server running?");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={start}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md bg-cta text-cta-foreground hover:bg-cta-hover transition-colors px-4 py-2 min-h-11 text-sm font-medium disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {loading ? "Opening Stripe…" : "Set up payouts with Stripe"}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
