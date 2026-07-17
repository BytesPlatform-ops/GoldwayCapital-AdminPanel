-- Track the originating GHL calendar appointment id so webhook-synced bookings
-- can be upserted (created once, updated on reschedule/cancel) rather than duplicated.
ALTER TABLE "Appointment" ADD COLUMN "ghlAppointmentId" TEXT;
CREATE UNIQUE INDEX "Appointment_ghlAppointmentId_key" ON "Appointment"("ghlAppointmentId");
