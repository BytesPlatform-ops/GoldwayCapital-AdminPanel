import type { Metadata } from "next";
import { ServicePageView } from "@/components/ServicePageView";
import { SERVICE_PAGES } from "@/lib/site";

const page = SERVICE_PAGES["medicare-solutions"];
export const metadata: Metadata = { title: page.title, description: page.intro };

export default function Page() {
  return <ServicePageView page={page} />;
}
