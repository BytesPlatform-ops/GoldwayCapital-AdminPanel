"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { apiMutate } from "@/lib/actions";
import { STAGE_LABELS, SOURCE_LABELS } from "@/components/admin-ui";

const STAGES = ["NEW", "CONTACTED", "APPOINTMENT_SET", "CLOSED"];
const ACCENT: Record<string, string> = { NEW: "border-t-blue-400", CONTACTED: "border-t-amber-400", APPOINTMENT_SET: "border-t-purple-400", CLOSED: "border-t-green-400" };

export interface BoardLead { id: string; firstName: string; lastName: string; leadSource: string; pipelineStage: string }

export function PipelineBoard({ initial }: { initial: BoardLead[] }) {
  const [leads, setLeads] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function move(lead: BoardLead, dir: -1 | 1) {
    const idx = STAGES.indexOf(lead.pipelineStage);
    const next = STAGES[idx + dir];
    if (!next) return;
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, pipelineStage: next } : l)));
    start(async () => {
      const r = await apiMutate("/pipeline/leads/" + lead.id + "/move", "PATCH", { stage: next });
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
          return (
            <div key={stage} className={`rounded-xl border border-navy-100 border-t-4 bg-white ${ACCENT[stage]}`}>
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="font-bold text-navy-800">{STAGE_LABELS[stage]}</h3>
                <span className="badge bg-navy-50 text-navy-700">{items.length}</span>
              </div>
              <div className="space-y-3 px-3 pb-4">
                {items.map((l) => {
                  const idx = STAGES.indexOf(l.pipelineStage);
                  return (
                    <div key={l.id} className="rounded-lg border border-navy-50 bg-cream p-3 shadow-sm">
                      <Link href={`/admin/leads/${l.id}`} className="font-semibold text-navy-700 hover:underline">{l.firstName} {l.lastName}</Link>
                      <div className="mt-0.5 text-xs text-gray-500">{SOURCE_LABELS[l.leadSource] ?? l.leadSource}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <button disabled={pending || idx === 0} onClick={() => move(l, -1)} className="rounded px-2 py-1 text-xs font-semibold text-navy-600 hover:bg-navy-50 disabled:opacity-30">← Back</button>
                        <button disabled={pending || idx === STAGES.length - 1} onClick={() => move(l, 1)} className="rounded px-2 py-1 text-xs font-semibold text-navy-600 hover:bg-navy-50 disabled:opacity-30">Advance →</button>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <p className="px-1 py-4 text-center text-xs text-gray-400">No leads</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
