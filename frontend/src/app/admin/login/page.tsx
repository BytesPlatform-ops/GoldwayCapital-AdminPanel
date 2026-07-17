import { redirect } from "next/navigation";
import { getMe } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin Sign In" };

export default async function AdminLoginPage({ searchParams }: { searchParams: { timeout?: string } }) {
  const me = await getMe();
  if (me) redirect("/admin/dashboard");
  const timedOut = searchParams.timeout === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-700 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold tracking-widest text-gold-500">GOLDWAY CAPITAL</div>
          <div className="mt-1 text-sm tracking-wide text-navy-100">A Senior Solutions Company</div>
        </div>
        <div className="card">
          <h1 className="mb-1 text-xl font-bold text-navy-800">Admin Sign In</h1>
          <p className="mb-6 text-sm text-gray-500">Command center for leads, pipeline &amp; content.</p>
          {timedOut && (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
              You were signed out due to inactivity. Please sign in again.
            </p>
          )}
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
