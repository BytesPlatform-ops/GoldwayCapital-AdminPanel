import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGhlAppointment, mapAppointmentStatus, isGhlAppointmentEvent, resolveStartInstant } from "./ghl-webhook-parser";

/**
 * Real captured GHL "Customer Booked Appointment" payload.
 * Source: WebhookEvent cmrpavyft000c2cgycbxf1o71 (location GOLDWAY CAPITAL LLC).
 * Do NOT "fix" the misspelled `appoinmentStatus` key — that is exactly what GHL sends.
 */
const REAL_GHL_BOOKING = {
  email: "bytesuite@bytesplatform.com",
  phone: "+92561614554",
  first_name: "Umair",
  last_name: "ali",
  full_name: "Umair ali",
  contact_id: "W8vaOoWhOLgy6Iw3eI7h",
  contact_type: "lead",
  contact_source: "Final Expense Consultation",
  country: "US",
  timezone: "Asia/Karachi",
  date_created: "2026-07-17T18:57:53.283Z",
  contact: {
    attributionSource: { url: "https://api.leadconnectorhq.com/widget/bookings/final-expense-consultation-12", medium: "calendar", mediumId: "Ee3BI5Dri7OtSvBhqoGK" },
    lastAttributionSource: { medium: "calendar" },
  },
  calendar: {
    id: "Ee3BI5Dri7OtSvBhqoGK",
    appointmentId: "2taTT1OsIfAoLuG2442x",
    calendarName: "Final Expense Consultation",
    title: "Umair Ali", // booker's name — must NOT become the serviceType
    status: "booked",
    appoinmentStatus: "confirmed", // (sic) GHL's spelling
    startTime: "2026-07-17T15:00:00",
    endTime: "2026-07-17T15:30:00",
    selectedTimezone: "America/New_York",
    address: "",
    notes: "...",
    date_created: "2026-07-17T18:57:53.413Z",
  },
  location: { id: "pYH9oSUgITaD3aRxefDF", name: "GOLDWAY CAPITAL LLC" },
  workflow: { id: "a15b39aa-a36c-45c2-9a81-fd1521cd2850", name: "Appointment Booked → Admin Panel" },
};

test("real GHL booking: every field resolves from the actual payload shape", () => {
  const p = parseGhlAppointment(REAL_GHL_BOOKING);
  assert.ok(p, "expected the real booking to parse as an appointment");
  assert.equal(p.contactId, "W8vaOoWhOLgy6Iw3eI7h"); // snake_case contact_id
  assert.equal(p.ghlAppointmentId, "2taTT1OsIfAoLuG2442x"); // calendar.appointmentId, not calendar.id
  assert.equal(p.calendarId, "Ee3BI5Dri7OtSvBhqoGK"); // calendar.id
  assert.equal(p.serviceName, "Final Expense Consultation"); // calendarName, not title
  assert.equal(p.status, "SCHEDULED"); // from "confirmed"/"booked"
  // 3:00 PM in America/New_York (EDT, UTC-4) on 2026-07-17 → 19:00 UTC.
  // This is the case that previously landed 4 hours off (stored as 15:00 UTC).
  assert.equal(p.scheduledAt?.toISOString(), "2026-07-17T19:00:00.000Z");
});

test("timezone: bare startTime + selectedTimezone resolves to the correct UTC instant", () => {
  // 3:00 PM ET (EDT, summer) → 19:00 UTC.
  assert.equal(
    resolveStartInstant("2026-07-17T15:00:00", "America/New_York")?.toISOString(),
    "2026-07-17T19:00:00.000Z"
  );
  // 9:00 AM PT (PDT) → 16:00 UTC.
  assert.equal(
    resolveStartInstant("2026-07-17T09:00:00", "America/Los_Angeles")?.toISOString(),
    "2026-07-17T16:00:00.000Z"
  );
  // Winter date: 10:00 AM ET (EST, UTC-5) → 15:00 UTC (DST handled per-date).
  assert.equal(
    resolveStartInstant("2026-01-15T10:00:00", "America/New_York")?.toISOString(),
    "2026-01-15T15:00:00.000Z"
  );
});

test("timezone: an already-absolute startTime (with Z / offset) is trusted as-is", () => {
  assert.equal(resolveStartInstant("2026-07-17T19:00:00Z", "America/New_York")?.toISOString(), "2026-07-17T19:00:00.000Z");
  assert.equal(resolveStartInstant("2026-07-17T15:00:00-04:00", "America/New_York")?.toISOString(), "2026-07-17T19:00:00.000Z");
});

test("timezone: no zone falls back to interpreting the wall clock as UTC (deterministic)", () => {
  assert.equal(resolveStartInstant("2026-07-17T15:00:00", null)?.toISOString(), "2026-07-17T15:00:00.000Z");
  assert.equal(resolveStartInstant("", "America/New_York"), null);
});

test("real GHL booking: calendar.title (booker name) is never used as the service", () => {
  const p = parseGhlAppointment(REAL_GHL_BOOKING);
  assert.notEqual(p?.serviceName, "Umair Ali");
});

test("real GHL booking: calendar.id is never mistaken for the appointment id", () => {
  const p = parseGhlAppointment(REAL_GHL_BOOKING);
  assert.notEqual(p?.ghlAppointmentId, "Ee3BI5Dri7OtSvBhqoGK");
});

test("legacy/mock appointment shape still parses (backward compatible)", () => {
  const legacy = {
    contactId: "legacy_contact_1", // camelCase
    appointment: {
      id: "appt_legacy_1", // appointment id lives at appointment.id here
      calendarId: "cal_legacy_1",
      calendarName: "Medicare Consultation",
      startTime: "2026-08-01T14:00:00",
      status: "showed",
      address: "123 Main St",
    },
  };
  const p = parseGhlAppointment(legacy);
  assert.ok(p);
  assert.equal(p.contactId, "legacy_contact_1");
  assert.equal(p.ghlAppointmentId, "appt_legacy_1");
  assert.equal(p.calendarId, "cal_legacy_1");
  assert.equal(p.serviceName, "Medicare Consultation");
  assert.equal(p.status, "COMPLETED"); // "showed" → COMPLETED (existing mapping intact)
  assert.equal(p.location, "123 Main St");
});

test("status mapping: new booking states map to SCHEDULED without dropping existing states", () => {
  assert.equal(mapAppointmentStatus("confirmed"), "SCHEDULED");
  assert.equal(mapAppointmentStatus("booked"), "SCHEDULED");
  assert.equal(mapAppointmentStatus("showed"), "COMPLETED");
  assert.equal(mapAppointmentStatus("completed"), "COMPLETED");
  assert.equal(mapAppointmentStatus("noshow"), "NO_SHOW");
  assert.equal(mapAppointmentStatus("no-show"), "NO_SHOW");
  assert.equal(mapAppointmentStatus("cancelled"), "CANCELLED");
  assert.equal(mapAppointmentStatus("canceled"), "CANCELLED");
});

test("appointment detection covers real, legacy, and non-appointment payloads", () => {
  assert.equal(isGhlAppointmentEvent(REAL_GHL_BOOKING), true);
  assert.equal(isGhlAppointmentEvent({ appointment: { id: "x" } }), true);
  assert.equal(isGhlAppointmentEvent({ type: "AppointmentCreate", startTime: "2026-01-01T00:00:00", calendarId: "c" }), true);
  assert.equal(isGhlAppointmentEvent({ email: "a@b.com", contact_id: "x" }), false);
});

test("a non-appointment payload parses to null", () => {
  assert.equal(parseGhlAppointment({ email: "a@b.com", contact_id: "x" }), null);
  assert.equal(parseGhlAppointment(null), null);
});
