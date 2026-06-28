"use client";

import { useState } from "react";
import { counterOffer } from "@/app/request/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CounterForm({
  offerId,
  requestId,
}: {
  offerId: string;
  requestId: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Counter
      </Button>
    );
  }

  return (
    <form action={counterOffer} className="flex items-center gap-2">
      <input type="hidden" name="offer_id" value={offerId} />
      <input type="hidden" name="request_id" value={requestId} />
      <span className="text-sm text-muted-foreground">$</span>
      <Input
        name="price"
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        placeholder="Your price"
        required
        autoFocus
        className="h-9 w-28"
      />
      <Button type="submit" size="sm">
        Send
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setOpen(false)}
      >
        Cancel
      </Button>
    </form>
  );
}
