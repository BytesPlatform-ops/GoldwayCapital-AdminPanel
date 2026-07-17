const STAGE_STYLES: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-amber-100 text-amber-800",
  APPOINTMENT_SET: "bg-purple-100 text-purple-800",
  CLOSED: "bg-green-100 text-green-800",
};
export const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  APPOINTMENT_SET: "Appointment Set",
  CLOSED: "Closed",
};
export const SOURCE_LABELS: Record<string, string> = {
  MEDICARE: "Medicare",
  FINAL_EXPENSE: "Final Expense",
  REVERSE_MTG: "Reverse Mortgage",
  PROBATE: "Probate / Senior RE",
  RECRUITING: "Recruiting",
};

export function StageBadge({ stage }: { stage: string }) {
  return <span className={`badge ${STAGE_STYLES[stage] ?? "bg-gray-100 text-gray-700"}`}>{STAGE_LABELS[stage] ?? stage}</span>;
}

const SYNC_STYLES: Record<string, string> = {
  SYNCED: "bg-green-100 text-green-800",
  SYNCED_MOCK: "bg-slate-100 text-slate-700",
  PENDING: "bg-amber-100 text-amber-800",
  NOT_SYNCED: "bg-gray-100 text-gray-600",
  FAILED: "bg-red-100 text-red-800",
};
export function SyncBadge({ status }: { status: string }) {
  const label = status === "SYNCED_MOCK" ? "mock (local)" : status.toLowerCase();
  return <span className={`badge ${SYNC_STYLES[status] ?? "bg-gray-100 text-gray-700"}`}>{label}</span>;
}

export function StatCard({ label, value, tone = "navy", hint }: { label: string; value: number | string; tone?: "navy" | "gold" | "red" | "green"; hint?: string }) {
  const tones = {
    navy: { text: "text-navy-700", bar: "from-navy-600 to-navy-800", glow: "bg-navy-100" },
    gold: { text: "text-gold-600", bar: "from-gold-500 to-gold-700", glow: "bg-gold-100" },
    red: { text: "text-red-600", bar: "from-red-400 to-red-600", glow: "bg-red-100" },
    green: { text: "text-green-600", bar: "from-green-500 to-green-600", glow: "bg-green-100" },
  }[tone];
  return (
    <div className="group relative overflow-hidden rounded-xl border border-navy-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-navy-100">
      <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${tones.bar}`} />
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${tones.glow} opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-80`} />
      <div className="relative pl-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</div>
        <div className={`mt-2 text-3xl font-bold tabular-nums ${tones.text}`}>{value}</div>
        {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
      </div>
    </div>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
