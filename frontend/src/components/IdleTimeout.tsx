"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { inactivityLogout } from "@/lib/actions";

// Idle window before auto sign-out. Override with NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES.
const parsedMin = Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES);
const IDLE_MS = (Number.isFinite(parsedMin) && parsedMin > 0 ? parsedMin : 15) * 60_000;
const WARN_MS = 60_000; // show the "still there?" prompt this long before sign-out
const ACTIVITY_KEY = "goldway:lastActivity"; // cross-tab activity broadcast
const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

/**
 * Signs the admin out after a period of inactivity. Activity in any tab resets
 * the timer (via a localStorage ping); a 60s warning modal lets the user stay in.
 * The actual sign-out clears the httpOnly cookie through a server action.
 */
export default function IdleTimeout() {
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const warnTimer = useRef<ReturnType<typeof setTimeout>>();
  const logoutTimer = useRef<ReturnType<typeof setTimeout>>();
  const loggingOut = useRef(false);

  const doLogout = useCallback(() => {
    if (loggingOut.current) return;
    loggingOut.current = true;
    inactivityLogout();
  }, []);

  const schedule = useCallback(() => {
    clearTimeout(warnTimer.current);
    clearTimeout(logoutTimer.current);
    warnTimer.current = setTimeout(() => {
      setSecondsLeft(Math.round(WARN_MS / 1000));
      setWarning(true);
    }, Math.max(0, IDLE_MS - WARN_MS));
    logoutTimer.current = setTimeout(doLogout, IDLE_MS);
  }, [doLogout]);

  const reset = useCallback(() => {
    setWarning(false);
    schedule();
  }, [schedule]);

  useEffect(() => {
    schedule();
    let last = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - last < 1000) return; // throttle bursts (mousemove/scroll)
      last = now;
      reset();
      try {
        window.localStorage.setItem(ACTIVITY_KEY, String(now));
      } catch {
        /* private mode / storage disabled — timer still works in this tab */
      }
    };
    // Another tab reporting activity resets this tab too.
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVITY_KEY) reset();
    };
    EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    window.addEventListener("storage", onStorage);
    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      window.removeEventListener("storage", onStorage);
      clearTimeout(warnTimer.current);
      clearTimeout(logoutTimer.current);
    };
  }, [schedule, reset]);

  useEffect(() => {
    if (!warning) return;
    const t = setInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [warning]);

  if (!warning) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="alertdialog" aria-modal="true" aria-label="Inactivity warning">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-navy-800">Still there?</h2>
        <p className="mt-2 text-sm text-gray-600">
          You&apos;ll be signed out in <span className="font-semibold text-navy-800">{secondsLeft}s</span> due to inactivity.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={doLogout} className="btn-ghost text-sm">Sign out now</button>
          <button type="button" onClick={reset} className="btn-primary text-sm">Stay signed in</button>
        </div>
      </div>
    </div>
  );
}
