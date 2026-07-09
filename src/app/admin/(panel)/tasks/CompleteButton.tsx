"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { apiMutate } from "@/lib/actions";

export function CompleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button className="btn-ghost text-xs" disabled={pending}
      onClick={() => start(async () => { await apiMutate(`/tasks/${id}/complete`, "POST"); router.refresh(); })}>
      {pending ? "…" : "Mark done"}
    </button>
  );
}
