import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy Policy" };
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold text-navy-800">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-gray-700">
        <p>Goldway Capital respects your privacy. We collect only the contact and scheduling information you provide through our forms so we can respond to your inquiry.</p>
        <p><strong>We do not collect or store medical, health, prescription, coverage, or enrollment information</strong> through this website. Any such information is handled exclusively within the approved carrier/FMO portal, separate from this site.</p>
        <p>We do not sell your personal information. We use it to contact you about the services you requested and to schedule consultations.</p>
        <p>To request access to or deletion of your information, contact us at leads@goldwaycapital.com.</p>
        <p className="text-sm text-gray-500">This is a template. Replace with your reviewed privacy policy before launch.</p>
      </div>
    </div>
  );
}
