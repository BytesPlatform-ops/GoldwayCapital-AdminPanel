import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import { apiGet, ApiError } from "@/lib/api";
import { SOURCE_LABELS, StageBadge } from "@/components/admin-ui";
import { ConfirmButton } from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

interface ApptDetail {
  id: string;
  serviceType: string;
  scheduledAt: string;
  status: string;
  location?: string | null;
  notes?: string | null;
  ghlAppointmentId?: string | null;
  createdAt: string;
  lead: {
    id: string; firstName: string; lastName: string; email?: string | null; phone?: string | null;
    city?: string | null; state?: string | null; zipCode?: string | null;
    soaStatus: string; pipelineStage: string; leadSource: string; ghlContactId?: string | null;
  };
}

const STATUS_TONE: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  NO_SHOW: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const isMedicare = (s: string) => s.toLowerCase().includes("medicare");

export default async function AppointmentDetailPage({ params }: { params: { id: string } }) {
  let appt: ApptDetail;
  try {
    appt = await apiGet<ApptDetail>(`/appointments/${params.id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const lead = appt.lead;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/appointments" className="text-sm text-navy-600 hover:underline">← Appointments</Link>
          <h1 className="mt-1 text-2xl font-bold text-navy-800">{appt.serviceType}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className={`badge ${STATUS_TONE[appt.status] ?? "bg-gray-100 text-gray-700"}`}>{appt.status.replace(/_/g, " ")}</span>
            <span className="text-sm text-gray-500">{formatDateTime(appt.scheduledAt)}</span>
          </div>
        </div>
        <ConfirmButton
          path={`/appointments/${appt.id}`}
          redirectTo="/admin/appointments"
          title="Delete this appointment?"
          message="This appointment will be permanently removed from the panel. This cannot be undone."
          className="btn-ghost text-sm text-red-600 hover:bg-red-50"
        >
          Delete appointment
        </ConfirmButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <h2 className="mb-3 text-lg font-bold text-navy-800">Appointment</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Service" value={appt.serviceType} />
              <Row label="When" value={formatDateTime(appt.scheduledAt)} />
              <Row label="Status" value={appt.status.replace(/_/g, " ")} />
              <Row label="Location" value={appt.location} />
              <Row label="Booked in panel" value={formatDateTime(appt.createdAt)} />
              <Row label="GHL appointment id" value={appt.ghlAppointmentId} />
            </dl>
          </div>

          {appt.notes && (
            <div className="card">
              <h2 className="mb-3 text-lg font-bold text-navy-800">Notes</h2>
              <p className="whitespace-pre-wrap text-sm text-ink">{appt.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-800">Lead</h2>
              <Link href={`/admin/leads/${lead.id}`} className="text-sm text-navy-600 hover:underline">View lead →</Link>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <span className="badge bg-gold-100 text-gold-700">{SOURCE_LABELS[lead.leadSource] ?? lead.leadSource}</span>
              <StageBadge stage={lead.pipelineStage} />
            </div>
            <dl className="space-y-2 text-sm">
              <Row label="Name" value={`${lead.firstName} ${lead.lastName}`} />
              <Row label="Email" value={lead.email} />
              <Row label="Phone" value={lead.phone} />
              <Row label="City / State" value={[lead.city, lead.state].filter(Boolean).join(", ")} />
              <Row label="ZIP" value={lead.zipCode} />
              {isMedicare(appt.serviceType) && <Row label="SOA status" value={lead.soaStatus.replace(/_/g, " ")} />}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty rows are hidden to keep the panel uncluttered; core fields always carry a value.
function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
