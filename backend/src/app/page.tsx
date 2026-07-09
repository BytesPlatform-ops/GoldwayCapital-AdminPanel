import { redirect } from "next/navigation";
export default function BackendRoot() {
  redirect("/admin/login");
}
