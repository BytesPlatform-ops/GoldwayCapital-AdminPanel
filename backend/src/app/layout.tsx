import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Goldway Capital — Senior Solutions", template: "%s · Goldway Capital" },
  description:
    "Goldway Capital is a Senior Solutions company helping adults 55+ navigate Medicare, reverse mortgage, and senior real estate & probate decisions.",
  openGraph: { title: "Goldway Capital — Senior Solutions", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
