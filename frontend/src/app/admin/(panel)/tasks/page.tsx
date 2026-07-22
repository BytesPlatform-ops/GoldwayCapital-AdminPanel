import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/format";
import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CompleteButton } from "./CompleteButton";

export const dynamic = "force-dynamic";

interface Task {
  id: string;
  title: string;
  status?: string;
  dueAt?: string;
  completedAt?: string | null;
  lead?: { id: string; firstName: string; lastName: string } | null;
  assignedTo?: { name: string } | null;
}

const VIEWS = { open: "Open", completed: "Completed", all: "All" } as const;
type View = keyof typeof VIEWS;

export default async function TasksPage({ searchParams }: { searchParams: { status?: string } }) {
  const status: View = searchParams.status === "completed" || searchParams.status === "all" ? searchParams.status : "open";
  const tasks = await apiGet<Task[]>(`/tasks?status=${status}`);
  const now = new Date();
  const showCompleted = status !== "open"; // completed-time column
  const showStatus = status === "all";
  const noun = status === "open" ? "open task" : status === "completed" ? "completed task" : "task";

  return (
    <div>
      <SectionHeader title="Follow-up Tasks" subtitle={`${tasks.length} ${noun}${tasks.length === 1 ? "" : "s"}`} />

      <form method="get" className="card mb-6 flex items-end gap-3">
        <div>
          <label className="label">Filter by status</label>
          <select name="status" defaultValue={status} className="input">
            <option value="open">Open</option>
            <option value="completed">Completed</option>
            <option value="all">All</option>
          </select>
        </div>
        <button className="btn-primary" type="submit">Filter</button>
      </form>

      {tasks.length === 0 ? (
        <div className="card text-center text-gray-500">No {noun}s.</div>
      ) : (
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
                  const isOpen = t.status !== "DONE" && t.status !== "CANCELLED";
                  const overdue = isOpen && t.dueAt && new Date(t.dueAt) < now;
                  return (
                    <tr key={t.id}>
                      <td className="px-4 py-3 font-medium text-navy-700">{t.title}</td>
                      <td className="px-4 py-3">{t.lead ? <Link href={`/admin/leads/${t.lead.id}`} className="text-navy-600 hover:underline">{t.lead.firstName} {t.lead.lastName}</Link> : "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{t.assignedTo?.name ?? "—"}</td>
                      {showStatus && <td className="px-4 py-3"><span className={isOpen ? "font-semibold text-navy-600" : "font-semibold text-green-600"}>{isOpen ? "Open" : "Done"}</span></td>}
                      <td className="px-4 py-3">{t.dueAt ? <span className={overdue ? "font-semibold text-red-600" : "text-gray-600"}>{formatDate(t.dueAt)}{overdue ? " (overdue)" : ""}</span> : "—"}</td>
                      {showCompleted && <td className="px-4 py-3 text-gray-600">{t.completedAt ? formatDateTime(t.completedAt) : "—"}</td>}
                      <td className="px-4 py-3">
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
              const isOpen = t.status !== "DONE" && t.status !== "CANCELLED";
              const overdue = isOpen && t.dueAt && new Date(t.dueAt) < now;
              return (
                <div key={t.id} className="card p-4">
                  <div className="font-medium text-navy-700">{t.title}</div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>Lead: {t.lead ? <Link href={`/admin/leads/${t.lead.id}`} className="text-navy-600 hover:underline">{t.lead.firstName} {t.lead.lastName}</Link> : "—"}</span>
                    <span>Assigned: {t.assignedTo?.name ?? "—"}</span>
                    {showStatus && <span className={isOpen ? "text-navy-600" : "text-green-600"}>Status: {isOpen ? "Open" : "Done"}</span>}
                    {t.dueAt && <span className={overdue ? "font-semibold text-red-600" : ""}>Due: {formatDate(t.dueAt)}{overdue ? " (overdue)" : ""}</span>}
                    {showCompleted && t.completedAt && <span>Completed: {formatDateTime(t.completedAt)}</span>}
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    {isOpen && <CompleteButton id={t.id} />}
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
