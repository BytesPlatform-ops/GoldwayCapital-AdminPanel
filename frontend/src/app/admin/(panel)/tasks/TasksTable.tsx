"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/format";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CompleteButton } from "./CompleteButton";

export interface Task {
  id: string;
  title: string;
  status?: string;
  description?: string | null;
  dueAt?: string;
  completedAt?: string | null;
  lead?: { id: string; firstName: string; lastName: string } | null;
  assignedTo?: { name: string } | null;
}

const isOpenTask = (t: Task) => t.status !== "DONE" && t.status !== "CANCELLED";

export function TasksTable({ tasks, showStatus, showCompleted }: { tasks: Task[]; showStatus: boolean; showCompleted: boolean }) {
  const [selected, setSelected] = useState<Task | null>(null);
  const now = new Date();

  return (
    <>
      <div className="data-table hidden md:block">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Lead</th>
              <th>Assigned</th>
              {showStatus && <th>Status</th>}
              <th>Due</th>
              {showCompleted && <th>Completed</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const isOpen = isOpenTask(t);
              const overdue = isOpen && t.dueAt && new Date(t.dueAt) < now;
              return (
                <tr key={t.id} onClick={() => setSelected(t)} className="cursor-pointer hover:bg-navy-50">
                  <td className="px-4 py-3 font-medium text-navy-700">{t.title}</td>
                  <td className="px-4 py-3">{t.lead ? <Link href={`/admin/leads/${t.lead.id}`} onClick={(e) => e.stopPropagation()} className="text-navy-600 hover:underline">{t.lead.firstName} {t.lead.lastName}</Link> : "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{t.assignedTo?.name ?? "—"}</td>
                  {showStatus && <td className="px-4 py-3"><span className={isOpen ? "font-semibold text-navy-600" : "font-semibold text-green-600"}>{isOpen ? "Open" : "Done"}</span></td>}
                  <td className="px-4 py-3">{t.dueAt ? <span className={overdue ? "font-semibold text-red-600" : "text-gray-600"}>{formatDate(t.dueAt)}{overdue ? " (overdue)" : ""}</span> : "—"}</td>
                  {showCompleted && <td className="px-4 py-3 text-gray-600">{t.completedAt ? formatDateTime(t.completedAt) : "—"}</td>}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      {isOpen && <CompleteButton id={t.id} />}
                      <ConfirmButton path={`/tasks/${t.id}`} title="Delete task?" message="This follow-up task will be permanently removed." />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {tasks.map((t) => {
          const isOpen = isOpenTask(t);
          const overdue = isOpen && t.dueAt && new Date(t.dueAt) < now;
          return (
            <div key={t.id} onClick={() => setSelected(t)} className="card cursor-pointer p-4">
              <div className="font-medium text-navy-700">{t.title}</div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>Lead: {t.lead ? <Link href={`/admin/leads/${t.lead.id}`} onClick={(e) => e.stopPropagation()} className="text-navy-600 hover:underline">{t.lead.firstName} {t.lead.lastName}</Link> : "—"}</span>
                <span>Assigned: {t.assignedTo?.name ?? "—"}</span>
                {showStatus && <span className={isOpen ? "text-navy-600" : "text-green-600"}>Status: {isOpen ? "Open" : "Done"}</span>}
                {t.dueAt && <span className={overdue ? "font-semibold text-red-600" : ""}>Due: {formatDate(t.dueAt)}{overdue ? " (overdue)" : ""}</span>}
                {showCompleted && t.completedAt && <span>Completed: {formatDateTime(t.completedAt)}</span>}
              </div>
              <div className="mt-3 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                {isOpen && <CompleteButton id={t.id} />}
                <ConfirmButton path={`/tasks/${t.id}`} title="Delete task?" message="This follow-up task will be permanently removed." />
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-navy-100 p-5">
              <h2 className="text-lg font-semibold text-navy-700">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="btn-ghost text-sm" aria-label="Close">Close</button>
            </div>
            <div className="space-y-3 p-5">
              <DetailRow label="Status" value={isOpenTask(selected) ? "Open" : "Done"} />
              <DetailRow label="Lead">
                {selected.lead ? <Link href={`/admin/leads/${selected.lead.id}`} className="text-navy-600 hover:underline">{selected.lead.firstName} {selected.lead.lastName}</Link> : "—"}
              </DetailRow>
              <DetailRow label="Assigned" value={selected.assignedTo?.name ?? "—"} />
              <DetailRow label="Due" value={selected.dueAt ? formatDateTime(selected.dueAt) : "—"} />
              {selected.completedAt && <DetailRow label="Completed" value={formatDateTime(selected.completedAt)} />}
              <div className="pt-2">
                <div className="label">Details</div>
                <div className="mt-1 whitespace-pre-line text-sm text-gray-700">
                  {selected.description?.trim() ? selected.description : <span className="text-gray-400">No additional details.</span>}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function DetailRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="font-semibold text-navy-700">{label}</span>
      <span className="text-right text-gray-700">{children ?? value}</span>
    </div>
  );
}
