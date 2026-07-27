"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Buyer funds a matched deal. POSTs to /api/stripe/checkout and sends the buyer
 * to Stripe Checkout. Disabled (with an explanation) until the seller has
 * finished Stripe onboarding, because funds can't be released to them otherwise.
 */
export function FundDealButton({
  dealId,
  sellerReady,
}: {
  dealId: string;
  sellerReady: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fund() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError(
          data?.error === "seller_payouts_not_ready"
            ? "The seller hasn't finished setting up payouts yet."
            : (data?.error ?? "Couldn't start checkout. Try again."),
        );
        setLoading(false);
      }
    } catch {
      setError("Couldn't reach the server. Is the dev server running?");
      setLoading(false);
    }
  }

  if (!sellerReady) {
    return (
      <p className="text-sm text-muted-foreground mt-3">
        Waiting on the seller to set up payouts before you can pay securely.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {/* 3b accent discipline: this is THE one green button in the app.
          Everywhere else green is a data colour (money, live counts, positive
          state) and CTAs are ink. Here green marks the success moment, so it
          finally carries meaning. Don't add a second one. */}
      <Button variant="success" onClick={fund} disabled={loading}>
        {loading ? "Opening secure checkout…" : "Fund this deal"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Your payment is held safely and only released to the seller after you
        confirm the card arrived.
      </p>
    </div>
  );
}
