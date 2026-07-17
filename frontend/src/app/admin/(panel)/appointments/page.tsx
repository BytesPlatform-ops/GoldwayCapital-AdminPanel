import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { apiGet } from "@/lib/api";
import { SectionHeader } from "@/components/admin-ui";
import { ConfirmButton } from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

interface Appt { id: string; serviceType: string; scheduledAt: string; status: string; lead: { id: string; firstName: string; lastName: string; soaStatus: string } }

export default async function AppointmentsPage({ searchParams }: { searchParams: { service?: string } }) {
  const appts = await apiGet<Appt[]>(`/appointments${searchParams.service ? `?service=${searchParams.service}` : ""}`);
  return (
    <div>
      <SectionHeader title="Appointments" subtitle="Upcoming consultations. Medicare appointments show SOA status." />
      <form method="get" className="card mb-6 flex items-end gap-3">
        <div>
          <label className="label">Filter by service</label>
          <select name="service" defaultValue={searchParams.service ?? ""} className="input">
            <option value="">All services</option>
            <option value="medicare">Medicare</option>
            <option value="reverse-mortgage">Reverse Mortgage</option>
            <option value="probate">Probate / Senior Real Estate</option>
            <option value="senior-solutions">Senior Solutions</option>
          </select>
        </div>
        <button className="btn-primary" type="submit">Filter</button>
      </form>
      {appts.length === 0 ? (
        <div className="card text-center text-gray-500">No upcoming appointments.</div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-navy-100 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-navy-100 bg-navy-50 text-left text-xs uppercase text-navy-700">
                <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Lead</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">SOA</th><th className="px-4 py-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {appts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-navy-700">{formatDateTime(a.scheduledAt)}</td>
                    <td className="px-4 py-3"><Link href={`/admin/leads/${a.lead.id}`} className="text-navy-600 hover:underline">{a.lead.firstName} {a.lead.lastName}</Link></td>
                    <td className="px-4 py-3 capitalize text-gray-600">{a.serviceType.replace("-", " ")}</td>
                    <td className="px-4 py-3 text-gray-600">{a.status}</td>
                    <td className="px-4 py-3">{a.serviceType === "medicare" ? <span className="badge bg-amber-100 text-amber-800">{a.lead.soaStatus.replace(/_/g, " ")}</span> : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-right"><ConfirmButton path={`/appointments/${a.id}`} title="Delete appointment?" message="This appointment will be permanently removed from the panel." /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {appts.map((a) => (
              <div key={a.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-navy-700">{formatDateTime(a.scheduledAt)}</div>
                  <span className="text-xs text-gray-500">{a.status}</span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div><Link href={`/admin/leads/${a.lead.id}`} className="text-navy-600 hover:underline">{a.lead.firstName} {a.lead.lastName}</Link></div>
                  <div className="capitalize text-gray-500">{a.serviceType.replace("-", " ")}</div>
                  {a.serviceType === "medicare" && <span className="badge bg-amber-100 text-amber-800">SOA: {a.lead.soaStatus.replace(/_/g, " ")}</span>}
                </div>
                <div className="mt-3 flex justify-end"><ConfirmButton path={`/appointments/${a.id}`} title="Delete appointment?" message="This appointment will be permanently removed from the panel." /></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
