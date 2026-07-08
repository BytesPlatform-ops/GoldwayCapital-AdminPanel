"use client";

import { useState, useTransition } from "react";
import { apiMutate } from "@/lib/actions";

const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "LINKEDIN"];

interface Report { passed: boolean; medicareSensitive: boolean; hits: { phrase: string; severity: string; message: string }[] }
interface Existing {
  id: string; title: string; slug?: string; excerpt?: string; body: string; category?: string;
  featuredImage?: string; seoTitle?: string; seoDescription?: string; socialCaption?: string; status: string;
}

export function Composer({ existing }: { existing?: Existing }) {
  const [pending, start] = useTransition();
  const [id, setId] = useState<string | undefined>(existing?.id);
  const [status, setStatus] = useState(existing?.status ?? "DRAFT");
  const [form, setForm] = useState({
    title: existing?.title ?? "", slug: existing?.slug ?? "", excerpt: existing?.excerpt ?? "",
    body: existing?.body ?? "", category: existing?.category ?? "", featuredImage: existing?.featuredImage ?? "",
    seoTitle: existing?.seoTitle ?? "", seoDescription: existing?.seoDescription ?? "", socialCaption: existing?.socialCaption ?? "",
  });
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [msg, setMsg] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function scan() {
    const text = [form.title, form.excerpt, form.body, form.socialCaption].join("\n");
    start(async () => { const r = await apiMutate("/compliance/check-content", "POST", { text }); if (r.ok) setReport(r.data); });
  }

  function save() {
    start(async () => {
      const r = id ? await apiMutate(`/content/${id}`, "PATCH", form) : await apiMutate("/content", "POST", form);
      if (r.ok) { setId(r.data.post.id); setReport(r.data.report); setMsg("Saved."); } else setMsg(r.data.message ?? "Save failed");
    });
  }
  function submit() { if (!id) return setMsg("Save first."); start(async () => { await apiMutate(`/content/${id}/submit-review`, "POST"); setStatus("NEEDS_REVIEW"); setMsg("Submitted for review."); }); }
  function approve() { if (!id) return; start(async () => { const r = await apiMutate(`/content/${id}/approve`, "POST"); setMsg(r.ok ? "Approved." : r.data.message); if (r.ok) setStatus("APPROVED"); }); }
  function publish() { if (!id) return; start(async () => { const r = await apiMutate(`/content/${id}/publish`, "POST", { platforms }); setMsg(r.ok ? "Published: " + JSON.stringify(r.data.socialResults) : r.data.message); if (r.ok) setStatus("PUBLISHED"); }); }

  const blocking = report && !report.passed;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="card space-y-4">
          <Field label="Title"><input className="input" value={form.title} onChange={set("title")} onBlur={scan} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug (optional)"><input className="input" value={form.slug} onChange={set("slug")} placeholder="auto from title" /></Field>
            <Field label="Category"><input className="input" value={form.category} onChange={set("category")} /></Field>
          </div>
          <Field label="Excerpt"><textarea className="input min-h-[60px]" value={form.excerpt} onChange={set("excerpt")} onBlur={scan} /></Field>
          <Field label="Body (HTML allowed)"><textarea className="input min-h-[220px]" value={form.body} onChange={set("body")} onBlur={scan} /></Field>
          <Field label="Featured image URL"><input className="input" value={form.featuredImage} onChange={set("featuredImage")} /></Field>
        </div>
        <div className="card space-y-4">
          <h3 className="font-bold text-navy-800">SEO &amp; Social</h3>
          <Field label="SEO title"><input className="input" value={form.seoTitle} onChange={set("seoTitle")} /></Field>
          <Field label="SEO description"><textarea className="input min-h-[60px]" value={form.seoDescription} onChange={set("seoDescription")} /></Field>
          <Field label="Social caption"><textarea className="input min-h-[60px]" value={form.socialCaption} onChange={set("socialCaption")} onBlur={scan} /></Field>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h3 className="mb-2 font-bold text-navy-800">Compliance</h3>
          <button className="btn-ghost mb-3 w-full text-sm" onClick={scan} disabled={pending}>Run compliance check</button>
          {report ? (
            <div className="space-y-2 text-sm">
              <div className={`badge ${report.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{report.passed ? "No blocking issues" : "Blocking issues found"}</div>
              {report.medicareSensitive && <div className="warn-box text-xs">⚠ Medicare-related content — review required. No government-endorsement language permitted.</div>}
              {report.hits.length > 0 && <ul className="space-y-1">{report.hits.map((h, i) => <li key={i} className={`text-xs ${h.severity === "block" ? "text-red-700" : "text-amber-700"}`}><strong>“{h.phrase}”</strong> — {h.message}</li>)}</ul>}
            </div>
          ) : <p className="text-xs text-gray-400">Not scanned yet.</p>}
        </div>

        <div className="card">
          <h3 className="mb-2 font-bold text-navy-800">Publish to social</h3>
          <div className="space-y-2">
            {PLATFORMS.map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm capitalize">
                <input type="checkbox" checked={platforms.includes(p)} onChange={(e) => setPlatforms((prev) => e.target.checked ? [...prev, p] : prev.filter((x) => x !== p))} />
                {p.toLowerCase()}
              </label>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <button className="btn-primary w-full text-sm" onClick={save} disabled={pending}>Save</button>
            <button className="btn-ghost w-full text-sm" onClick={submit} disabled={pending || !id}>Submit for review</button>
            <button className="btn-ghost w-full text-sm" onClick={approve} disabled={pending || !id}>Approve</button>
            <button className="btn-gold w-full text-sm" onClick={publish} disabled={pending || !id || !!blocking}>Publish</button>
            {blocking && <p className="text-xs text-red-600">Resolve blocking compliance issues to publish.</p>}
          </div>
          <div className="mt-2 text-xs text-gray-500">Status: {status.replace(/_/g, " ")}</div>
          {msg && <div className="mt-2 rounded bg-navy-50 px-2 py-1 text-xs text-navy-700">{msg}</div>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
