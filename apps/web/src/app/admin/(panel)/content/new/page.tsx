import { SectionHeader } from "@/components/admin-ui";
import { Composer } from "@/components/Composer";

export const metadata = { title: "New Article" };

export default function NewContentPage() {
  return (
    <div>
      <SectionHeader title="New Article" subtitle="Draft → Needs Review → Approved → Published. Compliance-gated." />
      <Composer />
    </div>
  );
}
