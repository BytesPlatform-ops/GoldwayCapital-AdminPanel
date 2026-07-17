import { redirect } from "next/navigation";
import { getMe } from "@/lib/auth";
import PanelChrome from "@/components/PanelChrome";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/admin/login");

  return <PanelChrome me={{ name: me.name, role: me.role }}>{children}</PanelChrome>;
}
