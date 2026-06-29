"use client";

import { useEffect } from "react";
import { markAllRead } from "@/app/notifications/actions";

// Marks the viewer's notifications read once, when the page is opened.
export function MarkReadOnView({ hasUnread }: { hasUnread: boolean }) {
  useEffect(() => {
    if (hasUnread) markAllRead();
  }, [hasUnread]);
  return null;
}
