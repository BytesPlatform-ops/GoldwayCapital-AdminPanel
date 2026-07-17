/** Shape of a header notification item (mirrors the backend feed). */
export interface NotificationItem {
  id: string;
  type: "lead" | "appointment" | "alert";
  title: string;
  detail: string;
  href: string;
  createdAt: string; // ISO
}
