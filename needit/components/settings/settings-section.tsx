"use client";

import { useActionState } from "react";

import type { SettingsState } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";

const initialState: SettingsState = {};

/**
 * One saveable settings panel: heading, blurb, fields, save button, status.
 *
 * Each section saves independently. That's deliberate — one giant form with a
 * single Save at the bottom means a mistake anywhere blocks everything, and on
 * a page this long you can no longer see the button you're meant to press.
 */
export function SettingsSection({
  id,
  title,
  description,
  action,
  saveLabel = "Save",
  children,
  tone = "default",
}: {
  id: string;
  title: string;
  description?: string;
  action: (
    prev: SettingsState,
    formData: FormData,
  ) => Promise<SettingsState>;
  saveLabel?: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section
      id={id}
      className={`scroll-mt-24 border bg-card ${
        tone === "danger" ? "border-destructive/40" : ""
      }`}
    >
      <form action={formAction} className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold tracking-[-0.02em]">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex flex-col gap-4">{children}</div>

        <div
          aria-live="polite"
          className="flex flex-wrap items-center gap-3 border-t pt-4"
        >
          <Button
            type="submit"
            disabled={pending}
            variant={tone === "danger" ? "destructive" : "default"}
          >
            {pending ? "Saving…" : saveLabel}
          </Button>
          {state.saved && !state.notice && (
            <span className="text-sm font-medium text-primary-deep">
              Saved ✓
            </span>
          )}
          {state.notice && (
            <span className="text-sm font-medium text-primary-deep">
              {state.notice}
            </span>
          )}
          {state.error && (
            <span className="text-sm font-medium text-destructive">
              {state.error}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

/* --------------------------- shared field atoms --------------------------- */

export const inputClass =
  "min-h-11 w-full rounded-sm border border-input bg-background px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

/** A checkbox row with a 44px target and the label doing the explaining. */
export function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-5 w-5 shrink-0 accent-[hsl(var(--cta))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {hint && (
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </span>
    </label>
  );
}
