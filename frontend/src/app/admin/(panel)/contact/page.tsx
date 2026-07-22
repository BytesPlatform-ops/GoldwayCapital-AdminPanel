import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";
import { ContactTable, type ContactLead } from "./ContactTable";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const leads = await apiGet<ContactLead[]>("/contact");
  return (
    <div>
      <SectionHeader title="Contact Inquiries" subtitle={`${leads.length} contact lead${leads.length === 1 ? "" : "s"} — general enquiries with no pipeline. Click a row for details.`} />
      {leads.length === 0 ? (
        <div className="card text-center text-gray-500">No contact inquiries yet.</div>
      ) : (
        <ContactTable leads={leads} />
      )}
    </div>
  );
}
