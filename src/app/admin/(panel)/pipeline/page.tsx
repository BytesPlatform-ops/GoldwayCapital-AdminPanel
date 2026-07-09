import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";
import { PipelineBoard, type BoardLead } from "./PipelineBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const board = await apiGet<BoardLead[]>("/pipeline");
  return (
    <div>
      <SectionHeader title="Pipeline Board" subtitle="New → Contacted → Appointment Set → Closed. Moves sync to GHL." />
      <PipelineBoard initial={board} />
    </div>
  );
}
