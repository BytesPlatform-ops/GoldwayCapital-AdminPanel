"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { apiMutate } from "@/lib/actions";
import { STAGE_LABELS, SOURCE_LABELS } from "@/components/admin-ui";

const STAGES = ["NEW", "CONTACTED", "APPOINTMENT_SET", "CLOSED"];
const ACCENT: Record<string, string> = { NEW: "border-t-blue-400", CONTACTED: "border-t-amber-400", APPOINTMENT_SET: "border-t-purple-400", CLOSED: "border-t-green-400" };
const HEAD_TINT: Record<string, string> = { NEW: "bg-blue-50", CONTACTED: "bg-amber-50", APPOINTMENT_SET: "bg-purple-50", CLOSED: "bg-green-50" };
const COUNT_TINT: Record<string, string> = { NEW: "bg-blue-100 text-blue-800", CONTACTED: "bg-amber-100 text-amber-800", APPOINTMENT_SET: "bg-purple-100 text-purple-800", CLOSED: "bg-green-100 text-green-800" };

// Per-source accent for cards (left bar + chip). Falls back to navy for unknown sources.
const SOURCE_ACCENT: Record<string, { bar: string; chip: string }> = {
  MEDICARE: { bar: "bg-blue-400", chip: "bg-blue-50 text-blue-700" },
  FINAL_EXPENSE: { bar: "bg-gold-500", chip: "bg-gold-50 text-gold-700" },
  REVERSE_MTG: { bar: "bg-emerald-400", chip: "bg-emerald-50 text-emerald-700" },
  PROBATE: { bar: "bg-purple-400", chip: "bg-purple-50 text-purple-700" },
  RECRUITING: { bar: "bg-rose-400", chip: "bg-rose-50 text-rose-700" },
};
const DEFAULT_ACCENT = { bar: "bg-navy-600", chip: "bg-navy-50 text-navy-700" };
const VISIBLE = 6; // cards shown before "Show all"

export interface BoardLead { id: string; firstName: string; lastName: string; leadSource: string; pipelineStage: string }

export function PipelineBoard({ initial }: { initial: BoardLead[] }) {
  const [leads, setLeads] = useState(initial);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function move(lead: BoardLead, dir: -1 | 1) {
    const idx = STAGES.indexOf(lead.pipelineStage);
    const next = STAGES[idx + dir];
    if (!next) return;
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, pipelineStage: next } : l)));
    start(async () => {
      const r = await apiMutate("/pipelines/leads/" + lead.id + "/move", "PATCH", { stage: next });
      if (!r.ok) {
        setError("Failed to update stage.");
        setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, pipelineStage: lead.pipelineStage } : l)));
      } else if (!r.data.ghlSynced) {
        setError("Stage saved locally — GHL sync failed and will retry.");
      } else setError("");
    });
  }

  return (
    <div>
      {error && <div className="warn-box mb-4">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage) => {
          const items = leads.filter((l) => l.pipelineStage === stage);
          const isOpen = expanded[stage];
          const shown = isOpen ? items : items.slice(0, VISIBLE);
          return (
            <div key={stage} className={`overflow-hidden rounded-2xl border border-navy-100 border-t-4 bg-white shadow-sm shadow-navy-100/50 ${ACCENT[stage]}`}>
              <div className={`flex items-center justify-between px-4 py-3 ${HEAD_TINT[stage]}`}>
                <h3 className="font-bold tracking-tight text-navy-800">{STAGE_LABELS[stage]}</h3>
                <span className={`badge ${COUNT_TINT[stage] ?? "bg-navy-50 text-navy-700"}`}>{items.length}</span>
              </div>
              <div className="space-y-3 px-3 py-4">
                {shown.map((l) => {
                  const idx = STAGES.indexOf(l.pipelineStage);
                  const acc = SOURCE_ACCENT[l.leadSource] ?? DEFAULT_ACCENT;
                  return (
                    <div key={l.id} className="group relative overflow-hidden rounded-lg border border-navy-100 bg-white p-3 pl-4 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md hover:shadow-navy-100">
                      <span className={`absolute inset-y-0 left-0 w-1 ${acc.bar}`} />
                      <Link href={`/admin/leads/${l.id}`} className="font-semibold text-navy-800 hover:underline">{l.firstName} {l.lastName}</Link>
                      <div className="mt-1.5">
                        <span className={`badge ${acc.chip}`}>{SOURCE_LABELS[l.leadSource] ?? l.leadSource}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <button disabled={pending || idx === 0} onClick={() => move(l, -1)} className="rounded-md px-2 py-1 text-xs font-semibold text-gray-400 transition hover:bg-navy-50 hover:text-navy-700 disabled:opacity-0">← Back</button>
                        <button disabled={pending || idx === STAGES.length - 1} onClick={() => move(l, 1)} className="rounded-md bg-navy-700 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-30">Advance →</button>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-gray-400">No leads</p>}
                {items.length > VISIBLE && (
                  <button
                    onClick={() => setExpanded((e) => ({ ...e, [stage]: !e[stage] }))}
                    className="w-full rounded-lg border border-dashed border-navy-100 py-2 text-xs font-semibold text-navy-600 transition hover:border-navy-600 hover:bg-navy-50"
                  >
                    {isOpen ? "Show less" : `Show all ${items.length} →`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
