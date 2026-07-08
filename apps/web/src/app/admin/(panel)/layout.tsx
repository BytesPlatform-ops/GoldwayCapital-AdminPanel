import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";

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
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "❑" },
  { href: "/admin/integration-logs", label: "Integration Logs", icon: "⇄" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="hidden w-64 shrink-0 flex-col bg-navy-700 text-white md:flex">
        <div className="border-b border-navy-600 px-6 py-5">
          <div className="text-lg font-bold tracking-widest text-gold-500">GOLDWAY</div>
          <div className="text-[11px] tracking-wide text-navy-100">SENIOR SOLUTIONS</div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-100 transition hover:bg-navy-600 hover:text-white">
              <span className="w-5 text-center text-gold-500">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-navy-100 bg-white px-6 py-3">
          <div className="font-bold tracking-widest text-navy-700 md:hidden">GOLDWAY</div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-navy-800">{me.name}</div>
              <div className="text-xs text-gray-500">{me.role}</div>
            </div>
            <form action={logoutAction}>
              <button className="btn-ghost text-sm" type="submit">Sign out</button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
