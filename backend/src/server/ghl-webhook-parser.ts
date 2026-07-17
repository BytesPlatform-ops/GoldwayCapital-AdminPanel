/**
 * Pure parsing for GHL calendar-booking webhooks. No I/O, no imports — so it is
 * unit-testable in isolation and safe to reuse anywhere.
 *
 * GHL's real "Customer Booked Appointment" workflow payload nests the appointment
 * under `calendar` and carries the contact id as snake_case `contact_id`. An older
 * mock/test shape used a `payload.appointment` object with a camelCase `contactId`.
 * Both shapes must parse, so every field is read tolerantly across them.
 *
 * Source of truth for the real shape: captured WebhookEvent cmrpavyft000c2cgycbxf1o71.
 * Gotchas encoded below (all real):
 *  - GHL misspells the status key as `appoinmentStatus` (missing the 2nd "t").
 *  - `calendar.id` is the CALENDAR id; the appointment id is `calendar.appointmentId`.
 *  - `calendar.title` is the booker's name, NOT the service — the service is `calendarName`.
 *  - A fresh booking arrives as `appoinmentStatus: "confirmed"` / `status: "booked"`.
 */

export type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";

export interface ParsedGhlAppointment {
  contactId: string | null;
  ghlAppointmentId: string | null;
  calendarId: string | null;
  scheduledAt: Date | null;
  status: AppointmentStatus;
  /** From `calendar.calendarName` only — never `calendar.title` (the booker's name). */
  serviceName: string | null;
  location: string | null;
}

/** Map a GHL appointment-status string onto our AppointmentStatus enum. */
export function mapAppointmentStatus(raw: unknown): AppointmentStatus {
  switch (String(raw ?? "").toLowerCase()) {
    case "cancelled":
    case "canceled":
      return "CANCELLED";
    case "showed":
    case "completed":
      return "COMPLETED";
    case "noshow":
    case "no_show":
    case "no-show":
      return "NO_SHOW";
    // A fresh GHL booking — keep these explicit even though the default also lands
    // on SCHEDULED, so a future default change can't silently break new bookings.
    case "confirmed":
    case "booked":
    case "scheduled":
    case "new":
      return "SCHEDULED";
    default:
      return "SCHEDULED";
  }
}

/** True when the payload describes a calendar appointment/booking, in any shape. */
export function isGhlAppointmentEvent(payload: any): boolean {
  const t = String(payload?.type ?? payload?.event ?? "").toLowerCase();
  if (t.includes("appointment")) return true;
  if (payload?.appointment) return true; // legacy/mock shape
  const cal = payload?.calendar;
  if (cal && ((cal.startTime && cal.id) || cal.appointmentId)) return true; // real GHL shape
  if (payload?.startTime && payload?.calendarId) return true; // flat shape
  return false;
}

const clean = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

/** Milliseconds to add to a UTC instant to get wall-clock time in `timeZone`, or null if invalid. */
function tzOffsetMs(timeZone: string, at: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(at);
    const m: Record<string, string> = {};
    for (const p of parts) if (p.type !== "literal") m[p.type] = p.value;
    const asUTC = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour % 24, +m.minute, +m.second);
    return asUTC - at.getTime();
  } catch {
    return null; // unrecognized IANA zone
  }
}

/**
 * Resolve a GHL `startTime` into a correct UTC instant.
 *
 * GHL sends the appointment time as a timezone-LESS wall clock (e.g.
 * "2026-07-17T15:00:00") alongside a separate `selectedTimezone`
 * (e.g. "America/New_York"). `new Date()` would read the bare string in the
 * server's zone (UTC on Netlify), landing the booking hours off. We instead
 * interpret the wall clock IN `selectedTimezone` and return the true instant.
 *
 * If the string already carries an offset/Z it is absolute and used as-is. If no
 * zone is known, the wall clock is treated as UTC (deterministic fallback).
 */
export function resolveStartInstant(raw: unknown, selectedTimezone?: string | null): Date | null {
  const s = clean(raw);
  if (!s) return null;
  // Already absolute (has trailing Z or a ±HH:MM / ±HHMM offset) → trust it.
  if (/(?:z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }
  const [, y, mo, d, hh, mm, ss] = m;
  const naiveAsUtc = Date.UTC(+y, +mo - 1, +d, +hh, +mm, ss ? +ss : 0);
  const zone = clean(selectedTimezone);
  if (!zone) return new Date(naiveAsUtc);
  const offset = tzOffsetMs(zone, new Date(naiveAsUtc));
  if (offset === null) return new Date(naiveAsUtc);
  return new Date(naiveAsUtc - offset);
}

/**
 * Normalize a GHL webhook payload into a flat appointment record, or null when the
 * payload is not an appointment/booking. Tolerates the real (`calendar`), legacy
 * (`appointment`), and flat shapes.
 */
export function parseGhlAppointment(payload: any): ParsedGhlAppointment | null {
  if (!payload || typeof payload !== "object") return null;
  const cal = payload.calendar ?? null; // real GHL "Customer Booked Appointment"
  const legacy = payload.appointment ?? null; // legacy/mock shape
  if (!cal && !legacy && !isGhlAppointmentEvent(payload)) return null;
  const appt = cal ?? legacy ?? payload; // the object carrying the appointment fields

  const contactId = clean(payload.contact_id ?? payload.contactId ?? payload.contact?.id ?? appt?.contactId);

  // `calendar.id` is the calendar id — never the appointment id. Real GHL puts the
  // appointment id at `calendar.appointmentId`; the legacy shape used `appointment.id`.
  const ghlAppointmentId = clean(
    cal?.appointmentId ??
      legacy?.id ??
      legacy?.appointmentId ??
      (appt === payload ? payload.appointmentId ?? payload.id : null) ??
      appt?.eventId
  );

  const calendarId = clean(cal?.id ?? legacy?.calendarId ?? payload.calendarId);

  const startRaw = appt?.startTime ?? appt?.selectedSlot ?? appt?.appointmentTime ?? null;
  const selectedTimezone = appt?.selectedTimezone ?? payload.selectedTimezone ?? null;
  const scheduledAt = resolveStartInstant(startRaw, selectedTimezone);

  const rawStatus = appt?.appoinmentStatus ?? appt?.appointmentStatus ?? appt?.status;

  return {
    contactId,
    ghlAppointmentId,
    calendarId,
    scheduledAt,
    status: mapAppointmentStatus(rawStatus),
    serviceName: clean(appt?.calendarName),
    location: clean(appt?.address ?? appt?.location ?? appt?.meetingLocation),
  };
}
