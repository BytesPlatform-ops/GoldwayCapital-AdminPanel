import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";
import { TasksTable, type Task } from "./TasksTable";

export const dynamic = "force-dynamic";

const VIEWS = { open: "Open", completed: "Completed", all: "All" } as const;
type View = keyof typeof VIEWS;

export default async function TasksPage({ searchParams }: { searchParams: { status?: string } }) {
  const status: View = searchParams.status === "completed" || searchParams.status === "all" ? searchParams.status : "open";
  const tasks = await apiGet<Task[]>(`/tasks?status=${status}`);
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
        <TasksTable tasks={tasks} showStatus={showStatus} showCompleted={showCompleted} />
      )}
    </div>
  );
}
