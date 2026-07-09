import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/PublicChrome";

export const metadata: Metadata = {
  title: { default: "Goldway Capital — Senior Solutions", template: "%s · Goldway Capital" },
  description:
    "Goldway Capital is a Senior Solutions company helping adults 55+ navigate Medicare, reverse mortgage, and senior real estate & probate decisions.",
  openGraph: { title: "Goldway Capital — Senior Solutions", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col bg-cream">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
