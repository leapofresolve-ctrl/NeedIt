"use client";

import { useEffect, useState } from "react";

// Brand countdown: mono tabular; --board-secondary >24h; amber <24h;
// blinking amber + "closing " prefix <12h (the board's ONLY motion).
// Ticks client-side each minute. Formats "2d 04h" / "8h 30m", zero-padded.

function fmt(msLeft: number): { label: string; hours: number } {
  const totalHours = msLeft / 3_600_000;
  const d = Math.floor(totalHours / 24);
  const h = Math.floor(totalHours % 24);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  const label =
    d > 0
      ? `${d}d ${String(h).padStart(2, "0")}h`
      : `${h}h ${String(m).padStart(2, "0")}m`;
  return { label, hours: totalHours };
}

export function Countdown({
  expiresAt,
  onDark = true,
}: {
  expiresAt: string | null;
  onDark?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) {
    return (
      <span className={`num text-xs ${onDark ? "text-board-faint" : "text-faint"}`}>
        expired
      </span>
    );
  }
  const { label, hours } = fmt(ms);
  const urgent = hours < 12;
  const soon = hours < 24;

  return (
    <span
      className={`num text-xs ${
        urgent
          ? "text-warn blink-urgent"
          : soon
            ? "text-warn"
            : onDark
              ? "text-board-secondary"
              : "text-muted-foreground"
      }`}
      suppressHydrationWarning
    >
      {urgent ? `closing ${label}` : label}
    </span>
  );
}
