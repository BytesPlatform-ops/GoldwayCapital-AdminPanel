// Shown instantly on every panel navigation while the destination page fetches
// its data on the server. Turns a "frozen on click" wait into an immediate
// skeleton. Applies to every route under (panel) that lacks its own loading.tsx.
export default function PanelLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      {/* Section header */}
      <div className="mb-6">
        <div className="h-6 w-48 rounded bg-navy-100" />
        <div className="mt-2 h-3 w-72 rounded bg-navy-50" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-navy-100 bg-white p-5 shadow-sm">
            <div className="h-3 w-24 rounded bg-navy-50" />
            <div className="mt-3 h-7 w-16 rounded bg-navy-100" />
          </div>
        ))}
      </div>

      {/* Table / list block */}
      <div className="mt-8 overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
        <div className="border-b border-navy-100 bg-navy-50 px-4 py-3">
          <div className="h-3 w-32 rounded bg-navy-100" />
        </div>
        <div className="divide-y divide-navy-50">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="h-3 flex-1 rounded bg-navy-50" />
              <div className="h-3 w-24 rounded bg-navy-50" />
              <div className="h-3 w-16 rounded bg-navy-50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
