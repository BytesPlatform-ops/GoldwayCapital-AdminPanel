import type { Metadata } from "next";
import { LeadForm } from "@/components/LeadForm";
import { BRAND } from "@/lib/site";

export const metadata: Metadata = { title: "Contact", description: "Schedule a consultation with Goldway Capital." };

export default function ContactPage({ searchParams }: { searchParams: { interest?: string } }) {
  const isMedicare = searchParams.interest === "medicare";
  const source = isMedicare ? "medicare" : "probate";
  const label = isMedicare ? "Schedule a Medicare Consultation" : "Schedule a Senior Solutions Consultation";

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold text-navy-800">Contact Goldway Capital</h1>
          <p className="mt-4 text-lg text-gray-700">
            We're here to help you navigate your options with patience and clarity. Reach out and a member of our team
            will follow up to schedule your consultation.
          </p>
          <dl className="mt-8 space-y-3 text-gray-700">
            <div><dt className="text-sm font-semibold text-navy-700">Phone</dt><dd>{BRAND.phone}</dd></div>
            <div><dt className="text-sm font-semibold text-navy-700">Email</dt><dd>{BRAND.email}</dd></div>
          </dl>
          <p className="mt-8 rounded-lg border border-navy-100 bg-white p-4 text-xs text-gray-500">
            We are not connected with or endorsed by the U.S. government or the federal Medicare program.
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-bold text-navy-800">{label}</h2>
          <LeadForm source={source} submitLabel={label} />
        </div>
      </div>
    </div>
  );
}
