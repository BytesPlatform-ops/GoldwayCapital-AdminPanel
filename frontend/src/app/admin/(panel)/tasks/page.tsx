import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";
import { AutoFilter } from "@/components/AutoFilter";
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

      <AutoFilter
        className="card mb-6 flex items-end gap-3"
        fields={[
          {
            type: "select",
            name: "status",
            label: "Filter by status",
            defaultValue: "open",
            options: [
              { value: "open", label: "Open" },
              { value: "completed", label: "Completed" },
              { value: "all", label: "All" },
            ],
          },
        ]}
      />

      {tasks.length === 0 ? (
        <div className="card text-center text-gray-500">No {noun}s.</div>
      ) : (
        <TasksTable tasks={tasks} showStatus={showStatus} showCompleted={showCompleted} />
      )}
    </div>
  );
}
