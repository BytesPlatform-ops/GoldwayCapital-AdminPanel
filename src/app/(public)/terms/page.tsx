import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms" };
export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold text-navy-800">Terms of Use</h1>
      <div className="mt-6 space-y-4 text-gray-700">
        <p>The information on this website is provided for general educational purposes and does not constitute insurance, financial, legal, or real estate advice.</p>
        <p>Goldway Capital is not connected with or endorsed by the U.S. government or the federal Medicare program.</p>
        <p>Service availability depends on applicable licensing. Certain services are referred to trusted partners as described on the relevant pages.</p>
        <p className="text-sm text-gray-500">This is a template. Replace with your reviewed terms before launch.</p>
      </div>
    </div>
  );
}
