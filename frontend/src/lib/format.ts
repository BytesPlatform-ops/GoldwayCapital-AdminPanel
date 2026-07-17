/**
 * Deterministic date formatting. Using the machine's default locale/timezone in a
 * Server Component and then re-rendering on the client produces different strings
 * (e.g. "7/17/2026, 10:53 PM" vs "17/07/2026, 22:53"), which triggers React
 * hydration errors. We pin the locale and timezone so server and client always
 * agree. Goldway operates in US Eastern, so that is the display timezone.
 */
const LOCALE = "en-US";
const TIME_ZONE = "America/New_York";

/** e.g. "Jul 17, 2026" */
export function formatDate(input: string | number | Date | null | undefined): string {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/** e.g. "Jul 17, 2026, 10:53 PM" */
export function formatDateTime(input: string | number | Date | null | undefined): string {
  if (!input) return "—";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
