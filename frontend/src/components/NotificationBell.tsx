"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getNotifications } from "@/lib/actions";
import type { NotificationItem } from "@/lib/notifications";

const SEEN_KEY = "goldway:notifsSeenAt";
const POLL_MS = 45000;

const TYPE_DOT: Record<string, string> = {
  lead: "bg-blue-500",
  appointment: "bg-green-500",
  alert: "bg-red-500",
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Restore the last-seen mark once mounted (client-only).
  useEffect(() => {
    const v = window.localStorage.getItem(SEEN_KEY);
    setSeenAt(v ? Number(v) : 0);
  }, []);

  // Poll the activity feed.
  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await getNotifications();
      if (active) setItems(data);
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = items.filter((i) => new Date(i.createdAt).getTime() > seenAt).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    // Opening the panel marks everything currently shown as seen → clears the dot.
    if (next) {
      const now = Date.now();
      window.localStorage.setItem(SEEN_KEY, String(now));
      setSeenAt(now);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} new` : "Notifications"}
        className="relative rounded-lg border border-navy-100 p-2 text-navy-700 hover:bg-navy-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-navy-100 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-navy-50 px-4 py-2.5">
            <span className="text-sm font-semibold text-navy-800">Notifications</span>
            {items.length > 0 && <span className="text-xs text-gray-400">{items.length}</span>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">No recent activity.</p>
            ) : (
              items.map((i) => (
                <Link
                  key={i.id}
                  href={i.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 border-b border-navy-50 px-4 py-3 last:border-0 hover:bg-navy-50/50"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[i.type] ?? "bg-gray-400"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-navy-800">{i.title}</span>
                      <span className="shrink-0 text-xs text-gray-400">{timeAgo(i.createdAt)}</span>
                    </span>
                    <span className="block truncate text-xs text-gray-500">{i.detail}</span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
