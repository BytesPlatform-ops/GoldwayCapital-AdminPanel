"use client";

import { useState } from "react";

interface Props {
  source: "medicare" | "final-expense" | "reverse-mortgage" | "probate" | "recruiting";
  submitLabel: string;
}

const HEALTH_WARNING =
  "Please do not include medical, prescription, health, coverage, or enrollment details in this form.";

export function LeadForm({ source, submitLabel }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const isMedicare = source === "medicare";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = { source };
    fd.forEach((v, k) => (payload[k] = v));
    payload.consentGiven = fd.get("consentGiven") === "on";
    // attribution
    const p = new URLSearchParams(window.location.search);
    payload.sourcePageUrl = window.location.href;
    payload.utmSource = p.get("utm_source") ?? undefined;
    payload.utmMedium = p.get("utm_medium") ?? undefined;
    payload.utmCampaign = p.get("utm_campaign") ?? undefined;

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("ok");
        setMessage("Thank you — a member of our team will contact you shortly.");
      } else {
        setStatus("error");
        setMessage(data.message ?? "Something went wrong. Please call us instead.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again or call us.");
    }
  }

  if (status === "ok") {
    return (
      <div className="card border-green-300 bg-green-50">
        <h3 className="text-lg font-bold text-green-800">Request received</h3>
        <p className="mt-1 text-green-700">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4" aria-label={`${source} form`}>
      {isMedicare && (
        <div className="warn-box" role="note">
          ⚠ {HEALTH_WARNING}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="firstName" label="First name" required />
        <Field name="lastName" label="Last name" required />
        <Field name="email" label="Email" type="email" />
        <Field name="phone" label="Phone" type="tel" />
        <Field name="city" label="City" />
        <Field name="state" label="State" />
        <Field name="zipCode" label="ZIP code" />
        <div>
          <label className="label" htmlFor="preferredContactMethod">Preferred contact</label>
          <select id="preferredContactMethod" name="preferredContactMethod" className="input">
            <option value="phone">Phone</option>
            <option value="email">Email</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="preferredContactTime">Best time</label>
          <select id="preferredContactTime" name="preferredContactTime" className="input">
            <option value="anytime">Anytime</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </div>
      </div>

      {/* Honeypot: hidden from humans; bots fill it. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input type="checkbox" name="consentGiven" className="mt-1" required />
        <span>I agree to be contacted by Goldway Capital about my inquiry. I understand I should not share medical, health, or coverage details here.</span>
      </label>

      {status === "error" && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}

      <button type="submit" className="btn-gold w-full text-lg" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}

function Field({ name, label, type = "text", required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <input id={name} name={name} type={type} required={required} className="input" />
    </div>
  );
}
