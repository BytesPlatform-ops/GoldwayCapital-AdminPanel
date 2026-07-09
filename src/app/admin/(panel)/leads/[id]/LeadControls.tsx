"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { apiMutate } from "@/lib/actions";
import { STAGE_LABELS } from "@/components/admin-ui";

const STAGES = ["NEW", "CONTACTED", "APPOINTMENT_SET", "CLOSED"];
const SOA = ["NOT_REQUIRED", "REQUIRED", "PENDING", "COMPLETED_EXTERNALLY"];
const NOTE_WARNING = "Do not enter medical, health, coverage, prescription, or enrollment details here.";
const SOA_WARNING = "SOA documentation and enrollment details must remain in the approved FMO/carrier portal.";

function useRefresh() {
  const router = useRouter();
  return () => router.refresh();
}

export function StageChanger({ id, current }: { id: string; current: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const refresh = useRefresh();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STAGES.map((s) => (
        <button key={s} disabled={pending || s === current}
          onClick={() => start(async () => {
            const r = await apiMutate(`/leads/${id}/stage`, "PATCH", { stage: s });
            setMsg(r.ok ? (r.data.ghlSynced ? "Updated + synced to GHL" : "Updated (GHL sync pending)") : "Failed");
            refresh();
          })}
          className={`btn text-sm ${s === current ? "bg-navy-700 text-white" : "border border-navy-100 bg-white text-navy-700 hover:bg-navy-50"}`}>
          {STAGE_LABELS[s]}
        </button>
      ))}
      {msg && <span className="text-xs text-gray-500">{msg}</span>}
    </div>
  );
}

export function NoteForm({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  const refresh = useRefresh();
  return (
    <div>
      <div className="warn-box mb-3">⚠ {NOTE_WARNING}</div>
      <textarea className="input min-h-[90px]" placeholder="Internal note (contact/scheduling only)…" value={body} onChange={(e) => setBody(e.target.value)} />
      <button className="btn-primary mt-2 text-sm" disabled={pending || !body.trim()}
        onClick={() => start(async () => { await apiMutate(`/leads/${id}/notes`, "POST", { body }); setBody(""); refresh(); })}>
        {pending ? "Saving…" : "Add note"}
      </button>
    </div>
  );
}

export function CallLogForm({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [outcome, setOutcome] = useState("SPOKE");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState(false);
  const refresh = useRefresh();
  return (
    <div>
      <div className="warn-box mb-3">⚠ {NOTE_WARNING}</div>
      <div className="flex flex-wrap gap-3">
        <select className="input max-w-[220px]" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
          <option value="NO_ANSWER">No answer</option>
          <option value="LEFT_VOICEMAIL">Left voicemail</option>
          <option value="SPOKE">Spoke with lead</option>
          <option value="SCHEDULED">Scheduled appointment</option>
          <option value="NOT_INTERESTED">Not interested</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={followUp} onChange={(e) => setFollowUp(e.target.checked)} /> Follow-up needed
        </label>
      </div>
      <textarea className="input mt-2 min-h-[70px]" placeholder="Call notes (no health/coverage details)…" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button className="btn-primary mt-2 text-sm" disabled={pending}
        onClick={() => start(async () => { await apiMutate(`/leads/${id}/call-logs`, "POST", { outcome, notes, followUpNeeded: followUp }); setNotes(""); refresh(); })}>
        {pending ? "Logging…" : "Log call"}
      </button>
    </div>
  );
}

export function SoaControl({ id, current }: { id: string; current: string }) {
  const [pending, start] = useTransition();
  const [value, setValue] = useState(current);
  const refresh = useRefresh();
  return (
    <div>
      <div className="warn-box mb-2 text-xs">{SOA_WARNING}</div>
      <select className="input max-w-[260px]" value={value} disabled={pending}
        onChange={(e) => { const v = e.target.value; setValue(v); start(async () => { await apiMutate(`/leads/${id}`, "PATCH", { soaStatus: v }); refresh(); }); }}>
        {SOA.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
      </select>
    </div>
  );
}

export function FollowUpControl({ id, current }: { id: string; current: string | null }) {
  const [pending, start] = useTransition();
  const [value, setValue] = useState(current ?? "");
  const refresh = useRefresh();
  return (
    <div className="flex items-center gap-2">
      <input type="date" className="input max-w-[200px]" value={value} onChange={(e) => setValue(e.target.value)} />
      <button className="btn-ghost text-sm" disabled={pending}
        onClick={() => start(async () => { await apiMutate(`/leads/${id}`, "PATCH", { nextFollowUpAt: value ? new Date(value).toISOString() : null }); refresh(); })}>
        {pending ? "…" : "Set"}
      </button>
    </div>
  );
}

export function ResyncButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const refresh = useRefresh();
  return (
    <button className="btn-ghost text-sm" disabled={pending}
      onClick={() => start(async () => { const r = await apiMutate(`/ghl/sync-lead/${id}`, "POST"); setMsg(r.ok ? "Re-synced" : "Failed"); refresh(); })}>
      {pending ? "Syncing…" : msg || "Re-sync to GHL"}
    </button>
  );
}
