"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { apiMutate } from "@/lib/actions";

export function RetryButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button className="btn-ghost text-xs" disabled={pending}
      onClick={() => start(async () => { await apiMutate(`/social/retry/${id}`, "POST"); router.refresh(); })}>
      {pending ? "…" : "Retry"}
    </button>
  );
}
