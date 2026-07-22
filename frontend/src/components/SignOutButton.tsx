"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { logoutAction } from "@/lib/actions";

function ConfirmSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

/** Sign-out button that asks for confirmation before ending the session. */
export default function SignOutButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn-ghost text-sm" onClick={() => setOpen(true)}>Sign out</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-navy-100 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-navy-800">Sign out?</h2>
            <p className="mt-1 text-sm text-gray-600">You'll be returned to the login screen and need to sign in again.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <form action={logoutAction}>
                <ConfirmSubmit />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
