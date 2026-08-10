"use client";

/**
 * ChipGroup — the accessible tappable-choice primitive.
 *
 * Every chip picker on /post is an instance of this. It exists because the
 * obvious way to build chips (divs with onClick and a background colour) is
 * invisible to a keyboard and silent to a screen reader, and that regression
 * is impossible to see by looking at the screen.
 *
 * The structure is boring on purpose:
 *
 *   <fieldset>            groups the options and gives them a name
 *     <legend>            the group name, announced by assistive tech
 *     <label>             the whole chip is the label — 44px tap target
 *       <input hidden>    a REAL radio or checkbox, visually hidden, not
 *                         display:none, so it stays focusable and operable
 *
 * That means Tab, Arrow keys, Space, focus rings, form serialization and
 * screen-reader announcement all come from the browser rather than from
 * hand-rolled ARIA that has to be maintained. The `peer` classes paint the
 * selected and focused states off the input's own :checked / :focus-visible.
 *
 * Styling is 3a-locked: --radius is 2px (sharp), selected = primary border +
 * tint, transitions are 150ms on border/background only and never a transform.
 */

import * as React from "react";

export type ChipOption = {
  value: string;
  label: string;
  /** Optional second line inside the chip. Used by the visibility choice. */
  hint?: string;
};

type CommonProps = {
  /** The group name, rendered as a visible <legend>. Required — this is the
   *  string a screen-reader user hears before the options. */
  legend: string;
  /** Small grey note after the legend. Not a substitute for the legend. */
  note?: string;
  name: string;
  options: readonly ChipOption[];
  className?: string;
};

/** Exported so the board's Advanced-search panel renders the SAME chip as
 *  /post rather than a lookalike. That panel can't use the components below —
 *  they're controlled, and it is an uncontrolled auto-submitting <form> — but
 *  it must not fork the styling. One string, both surfaces. */
export const chipBase =
  "inline-flex min-h-11 cursor-pointer select-none items-center justify-center gap-1.5 rounded-sm border border-input bg-card px-3.5 text-sm text-foreground transition-[background-color,border-color] duration-150 hover:border-foreground peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:font-medium peer-checked:text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-45";

/** Visually hidden but still focusable and still in the tab order. Never
 *  `hidden` or `display:none` — those remove it from the accessibility tree. */
const srInput = "peer sr-only";

function Legend({ legend, note }: { legend: string; note?: string }) {
  return (
    <legend className="mb-2 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
      {legend}
      {note && (
        <span className="ml-1.5 normal-case tracking-normal font-normal">
          {note}
        </span>
      )}
    </legend>
  );
}

/**
 * Single choice. Renders radios, so the browser gives arrow-key navigation
 * within the group for free.
 *
 * `allowEmpty` adds nothing to the DOM — it just documents that an unselected
 * group is a legal state (no sport chosen = any sport).
 */
export function ChipRadioGroup({
  legend,
  note,
  name,
  options,
  value,
  onValueChange,
  className,
}: CommonProps & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <fieldset className={className}>
      <Legend legend={legend} note={note} />
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <div key={opt.value} className="relative">
            <input
              type="radio"
              id={`${name}-${opt.value || "any"}`}
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onValueChange(opt.value)}
              className={srInput}
            />
            <label htmlFor={`${name}-${opt.value || "any"}`} className={chipBase}>
              {opt.label}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Segmented variant of the radio group — same semantics, joined presentation.
 * Used where the options are a small mutually-exclusive set that reads better
 * as one control (kind, condition, duration).
 */
export function ChipSegmentedGroup({
  legend,
  note,
  name,
  options,
  value,
  onValueChange,
  className,
}: CommonProps & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <fieldset className={className}>
      <Legend legend={legend} note={note} />
      <div className="flex overflow-hidden rounded-sm border border-input">
        {options.map((opt, i) => (
          <div key={opt.value} className="relative flex-1">
            <input
              type="radio"
              id={`${name}-${opt.value || "any"}`}
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onValueChange(opt.value)}
              className={srInput}
            />
            <label
              htmlFor={`${name}-${opt.value || "any"}`}
              className={`flex min-h-11 w-full cursor-pointer select-none items-center justify-center px-2 text-center text-sm text-foreground transition-[background-color,color] duration-150 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-inset peer-checked:bg-primary peer-checked:font-medium peer-checked:text-primary-foreground ${
                i > 0 ? "border-l border-input" : ""
              }`}
            >
              {opt.label}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Multi-select with a hard cap.
 *
 * When the cap is reached the remaining chips are genuinely `disabled` rather
 * than merely styled — so a keyboard user is told "this is unavailable" by the
 * browser instead of pressing Space and having nothing happen. Already-selected
 * chips stay enabled so you can always swap one out.
 */
export function ChipCheckboxGroup({
  legend,
  note,
  name,
  options,
  values,
  onValuesChange,
  max,
  className,
}: CommonProps & {
  values: string[];
  onValuesChange: (values: string[]) => void;
  max?: number;
}) {
  const atCap = max != null && values.length >= max;

  const toggle = (value: string) => {
    if (values.includes(value)) {
      onValuesChange(values.filter((v) => v !== value));
    } else if (!atCap) {
      onValuesChange([...values, value]);
    }
  };

  return (
    <fieldset className={className}>
      <Legend legend={legend} note={note} />
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const checked = values.includes(opt.value);
          return (
            <div key={opt.value} className="relative">
              <input
                type="checkbox"
                id={`${name}-${opt.value}`}
                name={name}
                value={opt.value}
                checked={checked}
                disabled={!checked && atCap}
                onChange={() => toggle(opt.value)}
                className={srInput}
              />
              <label htmlFor={`${name}-${opt.value}`} className={chipBase}>
                {opt.label}
              </label>
            </div>
          );
        })}
      </div>
      {/* Announced on change so a screen-reader user learns the cap the same
          way a sighted user does — by watching the counter, not by discovering
          that a chip stopped responding. */}
      {max != null && (
        <p
          aria-live="polite"
          className="mt-2 text-xs text-muted-foreground"
        >
          {values.length} of {max} used
          {atCap && " — tap one off to swap"}
        </p>
      )}
    </fieldset>
  );
}
