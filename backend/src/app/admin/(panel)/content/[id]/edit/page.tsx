import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";
import { Composer } from "@/components/Composer";

export const dynamic = "force-dynamic";

export default async function EditContentPage({ params }: { params: { id: string } }) {
  const post = await apiGet<any>(`/content/${params.id}`);
  return (
    <div>
      <SectionHeader title="Edit Article" subtitle={`Status: ${String(post.status).replace(/_/g, " ")}`} />
      <Composer existing={post} />
    </div>
  );
}
