import Link from "next/link";
import { formatDate } from "@/lib/format";
import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700", NEEDS_REVIEW: "bg-amber-100 text-amber-800",
  APPROVED: "bg-blue-100 text-blue-800", PUBLISHED: "bg-green-100 text-green-800", REJECTED: "bg-red-100 text-red-800",
};

interface Post { id: string; title: string; status: string; medicareSensitive: boolean; compliancePassed: boolean; updatedAt: string; socialPosts: { platform: string; status: string }[] }

export default async function ContentPage() {
  const posts = await apiGet<Post[]>("/content");
  return (
    <div>
      <SectionHeader title="Content" subtitle="Resource Center articles — write once, publish to the site + social." action={<Link href="/admin/content/new" className="btn-gold text-sm">+ New article</Link>} />
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-navy-100 bg-navy-50 text-left text-xs uppercase text-navy-700">
            <tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Compliance</th><th className="px-4 py-3">Social</th><th className="px-4 py-3">Updated</th></tr>
          </thead>
          <tbody className="divide-y divide-navy-50">
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3"><Link href={`/admin/content/${p.id}/edit`} className="font-semibold text-navy-700 hover:underline">{p.title}</Link>{p.medicareSensitive && <span className="ml-2 badge bg-amber-100 text-amber-800">Medicare</span>}</td>
                <td className="px-4 py-3"><span className={`badge ${STATUS_STYLES[p.status] ?? ""}`}>{p.status.replace(/_/g, " ")}</span></td>
                <td className="px-4 py-3">{p.compliancePassed ? <span className="text-green-600">✓ pass</span> : <span className="text-red-600">✗ issues</span>}</td>
                <td className="px-4 py-3 text-gray-500">{p.socialPosts.map((s) => `${s.platform}:${s.status}`).join(", ") || "—"}</td>
                <td className="px-4 py-3 text-gray-400">{formatDate(p.updatedAt)}</td>
              </tr>
            ))}
            {posts.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-400">No articles yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
