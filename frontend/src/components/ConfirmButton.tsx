"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { apiMutate } from "@/lib/actions";

interface ConfirmButtonProps {
  /** Admin API path to call, e.g. "/leads/123". */
  path: string;
  method?: string;
  /** Button label. */
  children?: React.ReactNode;
  /** Modal copy. */
  title?: string;
  message?: string;
  confirmLabel?: string;
  /** Where to go after success. If omitted, refreshes the current route. */
  redirectTo?: string;
  className?: string;
}

/**
 * A destructive action button that opens a confirmation modal before firing.
 * No native window.confirm (blocks the extension/browser); this is an in-page
 * dialog. On success it either redirects or refreshes server data.
 */
export function ConfirmButton({
  path,
  method = "DELETE",
  children = "Delete",
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  redirectTo,
  className = "btn-ghost text-xs text-red-600 hover:bg-red-50",
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  function confirm() {
    setError("");
    start(async () => {
      const r = await apiMutate(path, method);
      if (!r.ok) {
        setError(r.status === 403 ? "You do not have permission to delete this." : "Delete failed. Please try again.");
        return;
      }
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => !pending && setOpen(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-navy-100 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-navy-800">{title}</h3>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="btn-ghost text-sm" disabled={pending} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn text-sm bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                disabled={pending}
                onClick={confirm}
              >
                {pending ? "Deleting…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
