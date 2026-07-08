"use client";

import { useState, useTransition } from "react";
import { apiMutate } from "@/lib/actions";

const STATUSES = ["NEW", "REVIEWED", "CONTACTED", "FOLLOW_UP", "NOT_FIT"];

export function RecruitingStatus({ id, current }: { id: string; current: string }) {
  const [value, setValue] = useState(current);
  const [pending, start] = useTransition();
  return (
    <select className="input max-w-[170px] py-1.5 text-sm" value={value} disabled={pending}
      onChange={(e) => { const v = e.target.value; setValue(v); start(async () => { await apiMutate(`/leads/${id}`, "PATCH", { recruitingStatus: v }); }); }}>
      {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
    </select>
  );
}
