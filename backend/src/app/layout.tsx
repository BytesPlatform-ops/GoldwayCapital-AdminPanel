export const metadata = {
  title: "Goldway Capital API",
  description: "API-only backend for the Goldway Capital admin panel. No UI is served here.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
