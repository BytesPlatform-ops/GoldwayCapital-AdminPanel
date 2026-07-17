import Link from "next/link";
import { formatDate } from "@/lib/format";
import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CompleteButton } from "./CompleteButton";

export const dynamic = "force-dynamic";

interface Task { id: string; title: string; dueAt?: string; lead?: { id: string; firstName: string; lastName: string } | null; assignedTo?: { name: string } | null }

export default async function TasksPage() {
  const tasks = await apiGet<Task[]>("/tasks");
  const now = new Date();
  return (
    <div>
      <SectionHeader title="Follow-up Tasks" subtitle={`${tasks.length} open task${tasks.length === 1 ? "" : "s"}`} />
      {tasks.length === 0 ? (
        <div className="card text-center text-gray-500">No open tasks.</div>
      ) : (
        <>
          <div className="data-table hidden md:block">
            <table>
              <thead>
                <tr><th>Task</th><th>Lead</th><th>Assigned</th><th>Due</th><th></th></tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const overdue = t.dueAt && new Date(t.dueAt) < now;
                  return (
                    <tr key={t.id}>
                      <td className="px-4 py-3 font-medium text-navy-700">{t.title}</td>
                      <td className="px-4 py-3">{t.lead ? <Link href={`/admin/leads/${t.lead.id}`} className="text-navy-600 hover:underline">{t.lead.firstName} {t.lead.lastName}</Link> : "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{t.assignedTo?.name ?? "—"}</td>
                      <td className="px-4 py-3">{t.dueAt ? <span className={overdue ? "font-semibold text-red-600" : "text-gray-600"}>{formatDate(t.dueAt)}{overdue ? " (overdue)" : ""}</span> : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <CompleteButton id={t.id} />
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
              const overdue = t.dueAt && new Date(t.dueAt) < now;
              return (
                <div key={t.id} className="card p-4">
                  <div className="font-medium text-navy-700">{t.title}</div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>Lead: {t.lead ? <Link href={`/admin/leads/${t.lead.id}`} className="text-navy-600 hover:underline">{t.lead.firstName} {t.lead.lastName}</Link> : "—"}</span>
                    <span>Assigned: {t.assignedTo?.name ?? "—"}</span>
                    {t.dueAt && <span className={overdue ? "font-semibold text-red-600" : ""}>Due: {formatDate(t.dueAt)}{overdue ? " (overdue)" : ""}</span>}
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <CompleteButton id={t.id} />
                    <ConfirmButton path={`/tasks/${t.id}`} title="Delete task?" message="This follow-up task will be permanently removed." />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
