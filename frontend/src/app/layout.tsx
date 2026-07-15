import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Goldway Capital — Admin Panel", template: "%s · Goldway Admin" },
  description: "Internal admin panel for Goldway Capital — leads, pipeline, tasks, content, and compliance.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
