import type { Metadata } from "next";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

export const metadata: Metadata = {
  title: "Resource Center",
  description: "Senior-focused educational articles on Medicare, reverse mortgage, and senior real estate.",
};
export const revalidate = 120;

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  publishedAt?: string;
}

async function getArticles(): Promise<Article[]> {
  try {
    const res = await fetch(`${API_BASE}/public/resource-center`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    return (await res.json()) as Article[];
  } catch {
    return [];
  }
}

export default async function ResourceCenterPage() {
  const articles = await getArticles();
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-3xl font-bold text-navy-800">Resource Center</h1>
      <p className="mt-3 max-w-2xl text-lg text-gray-700">
        A growing library of educational articles to help you navigate Medicare, reverse mortgage, and senior real
        estate decisions.
      </p>

      {articles.length === 0 ? (
        <div className="card mt-10 text-center text-gray-500">
          New articles are on the way. Please check back soon.
        </div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link key={a.id} href={`/resource-center/${a.slug}`} className="card transition hover:border-gold-500 hover:shadow-md">
              {a.category && <span className="badge bg-gold-100 text-gold-700">{a.category}</span>}
              <h2 className="mt-2 text-lg font-bold text-navy-700">{a.title}</h2>
              {a.excerpt && <p className="mt-2 text-sm text-gray-600">{a.excerpt}</p>}
              <span className="mt-3 inline-block text-sm font-semibold text-gold-600">Read article →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
