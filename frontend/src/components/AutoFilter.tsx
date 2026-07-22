"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type FilterField =
  | { type: "search"; name: string; label: string; placeholder?: string }
  | { type: "select"; name: string; label: string; options: { value: string; label: string }[]; defaultValue?: string };

/**
 * Search-as-you-type filter bar. Replaces the old `<form method="get">` + Filter
 * button: text inputs debounce (300ms) and selects apply immediately, updating the
 * URL query via a soft navigation so the server page re-fetches. The inputs are
 * client-controlled, so focus/caret survive each re-render (no full reload).
 */
export function AutoFilter({ fields, reset, className }: { fields: FilterField[]; reset?: boolean; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const seed: Record<string, string> = {};
  for (const f of fields) seed[f.name] = searchParams.get(f.name) ?? (f.type === "select" ? f.defaultValue ?? "" : "");
  const [values, setValues] = useState(seed);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const apply = (next: Record<string, string>) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
    const q = qs.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const onChange = (name: string, value: string, debounce: boolean) => {
    const next = { ...values, [name]: value };
    setValues(next);
    if (timer.current) clearTimeout(timer.current);
    if (debounce) timer.current = setTimeout(() => apply(next), 300);
    else apply(next);
  };

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    const cleared: Record<string, string> = {};
    for (const f of fields) cleared[f.name] = f.type === "select" ? f.defaultValue ?? "" : "";
    setValues(cleared);
    apply(cleared);
  };

  return (
    <div className={className ?? "card mb-6 flex flex-wrap items-end gap-4"}>
      {fields.map((f) => (
        <div key={f.name} className={f.type === "search" ? "min-w-[220px] flex-1" : undefined}>
          <label className="label" htmlFor={f.name}>{f.label}</label>
          {f.type === "search" ? (
            <input id={f.name} name={f.name} value={values[f.name]} onChange={(e) => onChange(f.name, e.target.value, true)} className="input" placeholder={f.placeholder} />
          ) : (
            <select id={f.name} name={f.name} value={values[f.name]} onChange={(e) => onChange(f.name, e.target.value, false)} className="input">
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
        </div>
      ))}
      {reset && <button type="button" onClick={clear} className="btn-ghost">Reset</button>}
    </div>
  );
}
