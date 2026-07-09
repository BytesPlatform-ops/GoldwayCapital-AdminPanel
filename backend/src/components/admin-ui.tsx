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
  const toneClass = { navy: "text-navy-700", gold: "text-gold-600", red: "text-red-600", green: "text-green-600" }[tone];
  return (
    <div className="card">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${toneClass}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
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
