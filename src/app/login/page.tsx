import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getOwnerSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Login | System Board",
  description: "Owner login for System Board",
};

export default async function LoginPage() {
  const owner = await getOwnerSession();
  if (owner) {
    redirect("/board");
  }

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <div className="w-full rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur sm:p-8">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
            private workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">System Board</h1>
          <p className="mt-2 text-sm text-slate-600">Owner-only sign in required.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
