"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  type: string;
  request_id: string | null;
  read: boolean;
  created_at: string;
  title: string;
};

function describe(type: string) {
  switch (type) {
    case "new_offer":
      return "New offer";
    case "counter":
      return "Counter waiting on you";
    case "accepted":
      return "Offer accepted 🎉";
    case "declined":
      return "Offer declined";
    default:
      return "Update";
  }
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// Bell + unread badge. Polls every 15s and on tab-focus so the badge updates
// without a refresh. Hovering shows a small preview; clicking opens the full page.
export function NotificationBellClient({
  initialCount,
}: {
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const res = await fetch("/api/notifications/count", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          setCount(data.count ?? 0);
          setItems(data.items ?? []);
        }
      } catch {
        // ignore transient network errors
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", fetchData);

    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", fetchData);
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
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

      {open && (
        // top-full + pt-2 keeps a continuous hover area (no flicker gap).
        <div className="absolute right-0 top-full pt-2 w-80 z-50">
          <div className="border rounded-lg bg-popover text-popover-foreground shadow-md overflow-hidden">
            <div className="px-3 py-2 border-b text-sm font-semibold">
              Notifications
            </div>
            {items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                Nothing yet.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {items.map((n) => {
                  const inner = (
                    <div
                      className={`px-3 py-2 flex items-start justify-between gap-2 ${
                        n.read ? "" : "bg-accent"
                      } hover:bg-accent transition-colors`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-tight">
                          {describe(n.type)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {n.title}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.request_id ? (
                        <Link href={`/request/${n.request_id}`}>{inner}</Link>
                      ) : (
                        inner
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <Link
              href="/notifications"
              className="block px-3 py-2 border-t text-sm text-center hover:bg-accent transition-colors"
            >
              See all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
