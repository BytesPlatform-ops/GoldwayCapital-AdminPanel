import Link from "next/link";
import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";
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
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-navy-100 bg-navy-50 text-left text-xs uppercase text-navy-700">
              <tr><th className="px-4 py-3">Task</th><th className="px-4 py-3">Lead</th><th className="px-4 py-3">Assigned</th><th className="px-4 py-3">Due</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {tasks.map((t) => {
                const overdue = t.dueAt && new Date(t.dueAt) < now;
                return (
                  <tr key={t.id}>
                    <td className="px-4 py-3 font-medium text-navy-700">{t.title}</td>
                    <td className="px-4 py-3">{t.lead ? <Link href={`/admin/leads/${t.lead.id}`} className="text-navy-600 hover:underline">{t.lead.firstName} {t.lead.lastName}</Link> : "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{t.assignedTo?.name ?? "—"}</td>
                    <td className="px-4 py-3">{t.dueAt ? <span className={overdue ? "font-semibold text-red-600" : "text-gray-600"}>{new Date(t.dueAt).toLocaleDateString()}{overdue ? " (overdue)" : ""}</span> : "—"}</td>
                    <td className="px-4 py-3 text-right"><CompleteButton id={t.id} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
