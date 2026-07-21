import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/format";
import { notFound } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api";
import { StageBadge, SyncBadge, SOURCE_LABELS } from "@/components/admin-ui";
import { StageChanger, NoteForm, CallLogForm, SoaControl, FollowUpControl, ResyncButton } from "./LeadControls";
import { ConfirmButton } from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

interface LeadDetail {
  id: string; firstName: string; lastName: string; email?: string; phone?: string; city?: string; state?: string; zipCode?: string;
  serviceInterest?: string; leadSource: string; pipelineStage: string; ghlSyncStatus: string; ghlContactId?: string;
  consentGiven: boolean; consentTimestamp?: string; preferredContactMethod?: string; preferredContactTime?: string;
  sourcePageUrl?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string;
  soaStatus: string; assignedTo?: { name: string } | null; nextFollowUpAt?: string; lastContactedAt?: string;
  notes: { id: string; body: string; complianceFlagged: boolean; createdAt: string; author: { name: string } }[];
  callLogs: { id: string; outcome: string; notes?: string; followUpNeeded: boolean; complianceFlagged: boolean; occurredAt: string; author: { name: string } }[];
  emailLogs: { id: string; subject: string; direction: string; status: string; createdAt: string }[];
  appointments: { id: string; serviceType: string; scheduledAt: string; status: string }[];
  formSubmissions?: {
    id: string; formName: string; leadSource: string; blockedFields: string[]; createdAt: string;
    sanitizedPayload?: { formAnswers?: Record<string, unknown> };
  }[];
}

// Human labels for the whitelisted vertical form-answer keys (see backend lib/lead-forms.ts).
// Unknown keys fall back to a de-camelCased label, so new fields still render.
const ANSWER_LABELS: Record<string, string> = {
  county: "County", turning65: "Turning 65", currentlyEnrolledMedicare: "Currently enrolled in Medicare",
  medicareHelpWith: "Needs help with", medicareBiggestQuestion: "Biggest question",
  ageRange: "Age range", finalExpenseCoverage: "Has final expense coverage", finalExpenseMostImportant: "Most important",
  age62OrOlder: "Age 62 or older", primaryResidence: "Primary residence", estimatedHomeValue: "Estimated home value",
  estimatedMortgageBalance: "Estimated mortgage balance", reverseMortgageMainGoal: "Main goal", reverseMortgageBiggestConcern: "Biggest concern",
  realEstateSituation: "Real estate situation", executorOrHeir: "Executor or heir", realEstateTimeline: "Timeline", realEstateDetails: "Details",
  stateOfResidence: "State of residence", insuranceLicense: "Holds insurance license", licensedLines: "Licensed lines",
  ahipCertified: "AHIP certified", recruitingBackground: "Background",
  serviceInterest: "Service interest", preferredContactMethod: "Preferred contact method",
  bestTimeToContact: "Best time to contact", message: "Message",
};

function labelFor(key: string): string {
  return ANSWER_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}

function formatAnswer(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  return String(value ?? "");
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  let lead: LeadDetail;
  try {
    lead = await apiGet<LeadDetail>(`/leads/${params.id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const isMedicare = lead.leadSource === "MEDICARE";
  const formAnswers = lead.formSubmissions?.[0]?.sanitizedPayload?.formAnswers ?? {};
  const answerEntries = Object.entries(formAnswers).filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/leads" className="text-sm text-navy-600 hover:underline">← Lead Inbox</Link>
          <h1 className="mt-1 text-2xl font-bold text-navy-800">{lead.firstName} {lead.lastName}</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="badge bg-gold-100 text-gold-700">{SOURCE_LABELS[lead.leadSource] ?? lead.leadSource}</span>
            <StageBadge stage={lead.pipelineStage} />
            <SyncBadge status={lead.ghlSyncStatus} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ResyncButton id={lead.id} />
          <ConfirmButton
            path={`/leads/${lead.id}`}
            redirectTo="/admin/leads"
            title="Delete this lead?"
            message="The lead and its notes, calls, emails and appointments will be permanently deleted. This cannot be undone."
            className="btn-ghost text-sm text-red-600 hover:bg-red-50"
          >
            Delete lead
          </ConfirmButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card">
            <h2 className="mb-3 text-lg font-bold text-navy-800">Pipeline Stage</h2>
            <StageChanger id={lead.id} current={lead.pipelineStage} />
          </div>

          <div className="card">
            <h2 className="mb-3 text-lg font-bold text-navy-800">Form Answers</h2>
            {answerEntries.length > 0 ? (
              <dl className="space-y-2 text-sm">
                {answerEntries.map(([key, value]) => (
                  <Row key={key} label={labelFor(key)} value={formatAnswer(value)} />
                ))}
              </dl>
            ) : (
              <p className="text-sm text-gray-400">No form answers captured for this submission.</p>
            )}
          </div>

          {isMedicare && (
            <div className="card">
              <h2 className="mb-2 text-lg font-bold text-navy-800">Scope of Appointment (SOA)</h2>
              <p className="mb-3 text-sm text-gray-500">Status only — no SOA documents are stored in this system.</p>
              <SoaControl id={lead.id} current={lead.soaStatus} />
            </div>
          )}

          <div className="card">
            <h2 className="mb-3 text-lg font-bold text-navy-800">Internal Notes</h2>
            <NoteForm id={lead.id} />
            <ul className="mt-4 space-y-3">
              {lead.notes.map((n) => (
                <li key={n.id} className="rounded-lg border border-navy-50 bg-cream px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{n.author.name}</span>
                    <span className="flex items-center gap-2"><span>{formatDateTime(n.createdAt)}</span><ConfirmButton path={`/leads/${lead.id}/notes/${n.id}`} title="Delete note?" message="This note will be permanently removed." /></span>
                  </div>
                  <p className="mt-1 text-sm text-ink">{n.body}</p>
                  {n.complianceFlagged && <p className="mt-1 text-xs font-semibold text-amber-700">⚠ Flagged for compliance review.</p>}
                </li>
              ))}
              {lead.notes.length === 0 && <li className="text-sm text-gray-400">No notes yet.</li>}
            </ul>
          </div>

          <div className="card">
            <h2 className="mb-3 text-lg font-bold text-navy-800">Call Logs</h2>
            <CallLogForm id={lead.id} />
            <ul className="mt-4 space-y-3">
              {lead.callLogs.map((c) => (
                <li key={c.id} className="rounded-lg border border-navy-50 bg-cream px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="font-semibold text-navy-700">{c.outcome}{c.followUpNeeded ? " · follow-up needed" : ""}</span>
                    <span className="flex items-center gap-2"><span>{formatDateTime(c.occurredAt)} · {c.author.name}</span><ConfirmButton path={`/leads/${lead.id}/call-logs/${c.id}`} title="Delete call log?" message="This call log will be permanently removed." /></span>
                  </div>
                  {c.notes && <p className="mt-1 text-sm text-ink">{c.notes}</p>}
                  {c.complianceFlagged && <p className="mt-1 text-xs font-semibold text-amber-700">⚠ Flagged for compliance review.</p>}
                </li>
              ))}
              {lead.callLogs.length === 0 && <li className="text-sm text-gray-400">No calls logged.</li>}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-3 text-lg font-bold text-navy-800">Contact</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Email" value={lead.email} />
              <Row label="Phone" value={lead.phone} />
              <Row label="City / State" value={[lead.city, lead.state].filter(Boolean).join(", ")} />
              <Row label="ZIP" value={lead.zipCode} />
              <Row label="Preferred method" value={lead.preferredContactMethod} />
              <Row label="Preferred time" value={lead.preferredContactTime} />
              <Row label="Service interest" value={lead.serviceInterest} />
            </dl>
          </div>
          <div className="card">
            <h2 className="mb-3 text-lg font-bold text-navy-800">Consent &amp; Attribution</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Consent given" value={lead.consentGiven ? "Yes" : "No"} />
              <Row label="Consent at" value={lead.consentTimestamp ? formatDateTime(lead.consentTimestamp) : null} />
              <Row label="Source page" value={lead.sourcePageUrl} />
              <Row label="UTM source" value={lead.utmSource} />
              <Row label="UTM medium" value={lead.utmMedium} />
              <Row label="UTM campaign" value={lead.utmCampaign} />
            </dl>
          </div>
          <div className="card">
            <h2 className="mb-3 text-lg font-bold text-navy-800">Ownership &amp; Follow-up</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Assigned to" value={lead.assignedTo?.name} alwaysShow />
              <Row label="Last contacted" value={lead.lastContactedAt ? formatDate(lead.lastContactedAt) : null} />
            </dl>
            <div className="mt-3">
              <label className="label">Next follow-up date</label>
              <FollowUpControl id={lead.id} current={lead.nextFollowUpAt ? lead.nextFollowUpAt.slice(0, 10) : null} />
            </div>
          </div>
          {lead.appointments.length > 0 && (
            <div className="card">
              <h2 className="mb-3 text-lg font-bold text-navy-800">Appointments</h2>
              <ul className="space-y-2 text-sm">
                {lead.appointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between"><span className="capitalize">{a.serviceType}</span><span className="text-gray-500">{formatDateTime(a.scheduledAt)} · {a.status}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Empty rows are hidden to keep the panel uncluttered. Pass `alwaysShow` for
// fields worth keeping visible even when blank (e.g. Assigned to — used later).
function Row({ label, value, alwaysShow }: { label: string; value?: string | null; alwaysShow?: boolean }) {
  if (!value && !alwaysShow) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-ink">{value || <span className="text-gray-300">—</span>}</dd>
    </div>
  );
}
