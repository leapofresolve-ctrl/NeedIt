"use client";

import { useActionState } from "react";
import { createOffer, type OfferState } from "@/app/request/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fieldClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const initialState: OfferState = {};

export function OfferForm({ requestId }: { requestId: string }) {
  const action = createOffer.bind(null, requestId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Offer sent ✅</CardTitle>
          <CardDescription>
            Your offer was sent to the buyer. They&apos;ll see it privately and
            can accept or pass.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Make an Offer</CardTitle>
        <CardDescription>
          Send the buyer a structured offer — price, condition, a photo, and a
          note. No public chat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="price">Your price (USD)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="e.g. 45"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="condition">Condition</Label>
            <Input
              id="condition"
              name="condition"
              placeholder="e.g. Raw NM, PSA 9"
              maxLength={60}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="photo">Photo of the card (optional)</Label>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <textarea
              id="note"
              name="note"
              rows={3}
              placeholder="Anything the buyer should know…"
              className={fieldClass}
            />
          </div>

          {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send Offer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
