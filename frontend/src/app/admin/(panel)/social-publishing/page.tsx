import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";
import { RetryButton } from "./RetryButton";

export const dynamic = "force-dynamic";

interface Post { id: string; title: string; status: string; socialPosts: { id: string; platform: string; status: string; error?: string }[] }

const S: Record<string, string> = { PUBLISHED: "text-green-600", SCHEDULED: "text-blue-600", PENDING: "text-amber-600", FAILED: "text-red-600" };

export default async function SocialPublishingPage() {
  const posts = (await apiGet<Post[]>("/content")).filter((p) => p.socialPosts.length > 0);
  return (
    <div>
      <SectionHeader title="Social Publishing" subtitle="Per-platform publish status. Failed posts can be retried. Runs in mock mode until credentials are added." />
      {posts.length === 0 ? (
        <div className="card text-center text-gray-500">No social posts yet. Publish an article from Content with platforms selected.</div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <div key={p.id} className="card">
              <h3 className="font-bold text-navy-800">{p.title}</h3>
              <div className="mt-3 flex flex-wrap gap-4">
                {p.socialPosts.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-lg border border-navy-50 px-3 py-2 text-sm">
                    <span className="font-semibold capitalize text-navy-700">{s.platform.toLowerCase()}</span>
                    <span className={S[s.status] ?? "text-gray-500"}>{s.status.toLowerCase()}</span>
                    {s.status === "FAILED" && <RetryButton id={s.id} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
