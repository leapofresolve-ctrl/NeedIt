"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

// Renders the bell + unread badge, and keeps the count fresh without a page
// refresh: polls every 15s and refetches whenever the tab regains focus.
export function NotificationBellClient({
  initialCount,
}: {
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);

  // Reflect server-rendered count on navigation / revalidation.
  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    let active = true;
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/notifications/count", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active) setCount(data.count ?? 0);
      } catch {
        // ignore transient network errors
      }
    };

    const interval = setInterval(fetchCount, 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", fetchCount);

    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", fetchCount);
    };
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
