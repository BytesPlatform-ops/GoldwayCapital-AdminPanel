"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/lib/actions";
import NotificationBell from "@/components/NotificationBell";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/admin/leads", label: "Lead Inbox", icon: "✉" },
  { href: "/admin/pipeline", label: "Pipeline Board", icon: "▤" },
  { href: "/admin/tasks", label: "Follow-up Tasks", icon: "✓" },
  { href: "/admin/appointments", label: "Appointments", icon: "◷" },
  { href: "/admin/recruiting", label: "Recruiting", icon: "★" },
  { href: "/admin/content", label: "Content", icon: "✎" },
  { href: "/admin/social-publishing", label: "Social Publishing", icon: "➤" },
  { href: "/admin/compliance", label: "Compliance", icon: "⚖" },
  { href: "/admin/integrations", label: "Integrations", icon: "⚡" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "❑" },
  { href: "/admin/integration-logs", label: "Integration Logs", icon: "⇄" },
];

function Brand() {
  return (
    <div className="border-b border-navy-600 px-6 py-5">
      <div className="text-lg font-bold tracking-widest text-gold-500">GOLDWAY</div>
      <div className="text-[11px] tracking-wide text-navy-100">SENIOR SOLUTIONS</div>
    </div>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {NAV.map((n) => {
        const active = pathname === n.href || pathname.startsWith(n.href + "/");
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-navy-600 text-white shadow-sm" : "text-navy-100 hover:bg-navy-600 hover:text-white"
            }`}
          >
            <span className={`w-5 text-center ${active ? "text-gold-400" : "text-gold-500"}`}>{n.icon}</span>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function PanelChrome({ me, children }: { me: { name: string; role: string }; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy-700 text-white md:flex">
        <Brand />
        <NavLinks pathname={pathname} />
      </aside>

      {/* Mobile drawer + backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 max-w-[80%] flex-col bg-navy-700 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-navy-600 pr-3">
              <div className="flex-1"><Brand /></div>
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="rounded-lg p-2 text-navy-100 hover:bg-navy-600 hover:text-white">✕</button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-navy-100 bg-white px-4 py-3 sm:px-6">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-navy-100 p-2 text-navy-700 hover:bg-navy-50 md:hidden"
          >
            <span className="block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
            <span className="mt-1 block h-0.5 w-5 bg-current" />
          </button>
          <div className="font-bold tracking-widest text-navy-700 md:hidden">GOLDWAY</div>
          <div className="ml-auto flex items-center gap-4">
            <NotificationBell />
            <div className="text-right">
              <div className="text-sm font-semibold text-navy-800">{me.name}</div>
              <div className="text-xs text-gray-500">{me.role}</div>
            </div>
            <form action={logoutAction}>
              <button className="btn-ghost text-sm" type="submit">Sign out</button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
