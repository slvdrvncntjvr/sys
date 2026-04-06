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
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative grid w-full gap-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 p-4 shadow-[0_24px_80px_rgba(16,22,37,0.08)] backdrop-blur lg:grid-cols-[1.05fr_0.95fr] lg:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(31,111,255,0.15),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(15,169,104,0.14),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.08))]" />

        <section className="relative flex min-h-[520px] flex-col justify-between rounded-[1.6rem] bg-slate-950 p-6 text-white sm:p-8 lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">private workspace</p>
            <h1 className="mt-3 max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">
              Clean notes, sharper capture, no clutter.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
              System Board is the braindump layer for fast ideas, mobile uploads, links, and low-friction publishing.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Fast</p>
              <p className="mt-2 text-2xl font-semibold">Quick capture</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Mobile</p>
              <p className="mt-2 text-2xl font-semibold">Images + links</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Private</p>
              <p className="mt-2 text-2xl font-semibold">Owner only</p>
            </div>
          </div>

          <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Today&apos;s stream</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['brain dump', 'links', 'snapshots', 'archive', 'searchable'].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex items-center rounded-[1.6rem] bg-white p-6 sm:p-8 lg:p-10">
          <div className="w-full">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">sign in</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Owner access</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use the private credentials to unlock your board, archive, and trash.
              </p>
            </div>
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
