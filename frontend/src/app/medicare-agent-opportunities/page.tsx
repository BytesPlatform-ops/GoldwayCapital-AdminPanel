import type { Metadata } from "next";
import { LeadForm } from "@/components/LeadForm";
import { RECRUITING_PAGE } from "@/lib/site";

export const metadata: Metadata = { title: RECRUITING_PAGE.title, description: RECRUITING_PAGE.intro };

export default function RecruitingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold text-navy-800">{RECRUITING_PAGE.title}</h1>
          <p className="mt-4 text-lg text-gray-700">{RECRUITING_PAGE.intro}</p>
          <ul className="mt-6 space-y-3 text-gray-700">
            <li className="flex gap-3"><span className="text-gold-600">✓</span> Help seniors make confident decisions</li>
            <li className="flex gap-3"><span className="text-gold-600">✓</span> Training pipeline and mentorship</li>
            <li className="flex gap-3"><span className="text-gold-600">✓</span> Be part of a company with real process and support</li>
          </ul>
          <p className="mt-6 text-sm text-gray-500">
            Licensing verification, carrier appointments, and agreements are handled separately after your initial inquiry.
          </p>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-bold text-navy-800">Join Our Team</h2>
          <LeadForm source="recruiting" submitLabel="Submit Your Interest" />
        </div>
      </div>
    </div>
  );
}
