import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { API_BASE } from "@/lib/api";

interface Article {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt?: string;
  category?: string;
  seoTitle?: string;
  seoDescription?: string;
  featuredImage?: string;
  publishedAt?: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${API_BASE}/public/resource-center/${slug}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    return (await res.json()) as Article;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = await getArticle(params.slug);
  if (!a) return { title: "Article not found" };
  return {
    title: a.seoTitle ?? a.title,
    description: a.seoDescription ?? a.excerpt,
    openGraph: { title: a.seoTitle ?? a.title, description: a.seoDescription ?? a.excerpt, type: "article", images: a.featuredImage ? [a.featuredImage] : [] },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  // Schema.org Article JSON-LD for SEO.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    datePublished: article.publishedAt,
    publisher: { "@type": "Organization", name: "Goldway Capital" },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/resource-center" className="text-sm font-semibold text-gold-600 hover:underline">← Resource Center</Link>
      {article.category && <span className="badge mt-3 block w-fit bg-gold-100 text-gold-700">{article.category}</span>}
      <h1 className="mt-3 text-4xl font-bold leading-tight text-navy-800">{article.title}</h1>
      {article.excerpt && <p className="mt-4 text-lg text-gray-600">{article.excerpt}</p>}
      <div className="prose mt-8 max-w-none text-lg leading-relaxed text-gray-800" dangerouslySetInnerHTML={{ __html: article.body }} />
    </article>
  );
}
