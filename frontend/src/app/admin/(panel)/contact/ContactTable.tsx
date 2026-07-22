"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { ConfirmButton } from "@/components/ConfirmButton";

export interface ContactLead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  serviceInterest?: string | null;
  preferredContactMethod?: string | null;
  createdAt: string;
  assignedTo?: { name: string } | null;
  formSubmissions?: { sanitizedPayload?: { formAnswers?: Record<string, unknown>; hidden?: Record<string, unknown> } | null }[];
}

const answersOf = (l: ContactLead): Record<string, unknown> => l.formSubmissions?.[0]?.sanitizedPayload?.formAnswers ?? {};
// The contact form sends "best time" as the common `bestTimeToCall` (in hidden),
// not the vertical `bestTimeToContact` — read both so it always shows.
const hiddenOf = (l: ContactLead): Record<string, unknown> => l.formSubmissions?.[0]?.sanitizedPayload?.hidden ?? {};
const str = (v: unknown): string => (v === null || v === undefined ? "" : Array.isArray(v) ? v.join(", ") : String(v));

export function ContactTable({ leads }: { leads: ContactLead[] }) {
  const [selected, setSelected] = useState<ContactLead | null>(null);
  const answers = selected ? answersOf(selected) : {};
  const hidden = selected ? hiddenOf(selected) : {};
  const message = str(answers.message);
  const bestTime = str(answers.bestTimeToContact) || str(hidden.bestTimeToCall);

  return (
    <>
      <div className="data-table hidden md:block">
        <table>
          <thead>
            <tr><th>Name</th><th>Contact</th><th>Interest</th><th>City / State</th><th>Received</th></tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} onClick={() => setSelected(l)} className="cursor-pointer hover:bg-navy-50">
                <td className="px-4 py-3 font-semibold text-navy-700">{l.firstName} {l.lastName}</td>
                <td className="px-4 py-3 text-gray-600"><div>{l.email ?? "—"}</div><div className="text-xs text-gray-400">{l.phone}</div></td>
                <td className="px-4 py-3 text-gray-600">{l.serviceInterest ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{[l.city, l.state].filter(Boolean).join(", ") || "—"}</td>
                <td className="px-4 py-3 text-gray-400">{formatDateTime(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {leads.map((l) => (
          <div key={l.id} onClick={() => setSelected(l)} className="card cursor-pointer p-4">
            <div className="font-semibold text-navy-700">{l.firstName} {l.lastName}</div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>{l.email ?? "—"}</span>
              {l.phone && <span>{l.phone}</span>}
              {l.serviceInterest && <span>Interest: {l.serviceInterest}</span>}
              <span>Received: {formatDateTime(l.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-navy-100 p-5">
              <div>
                <h2 className="text-lg font-semibold text-navy-700">{selected.firstName} {selected.lastName}</h2>
                <p className="text-xs text-gray-400">Received {formatDateTime(selected.createdAt)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost text-sm" aria-label="Close">Close</button>
            </div>

            <div className="space-y-3 p-5">
              <DetailRow label="Email" value={str(selected.email) || "—"} />
              <DetailRow label="Phone" value={str(selected.phone) || "—"} />
              <DetailRow label="Location" value={[selected.city, selected.state, selected.zipCode].filter(Boolean).join(", ") || "—"} />
              <DetailRow label="Service interest" value={str(selected.serviceInterest) || str(answers.serviceInterest) || "—"} />
              <DetailRow label="Preferred contact" value={str(selected.preferredContactMethod) || str(answers.preferredContactMethod) || "—"} />
              <DetailRow label="Best time to contact" value={bestTime || "—"} />
              <DetailRow label="Assigned" value={selected.assignedTo?.name ?? "—"} />

              <div className="pt-2">
                <div className="label">Message</div>
                <div className="mt-1 whitespace-pre-line text-sm text-gray-700">
                  {message.trim() ? message : <span className="text-gray-400">No message provided.</span>}
                </div>
              </div>
            </div>

            <div className="mt-auto flex justify-between gap-2 border-t border-navy-100 p-5">
              <Link href={`/admin/leads/${selected.id}`} className="btn-ghost text-sm text-navy-600">Open full lead</Link>
              <ConfirmButton path={`/leads/${selected.id}`} title="Delete lead?" message="This contact lead will be permanently removed." />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="font-semibold text-navy-700">{label}</span>
      <span className="text-right text-gray-700">{value}</span>
    </div>
  );
}
