"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, Sparkles, Star } from "lucide-react";
import type { NoteDto } from "@/types/note";

type PublicBoardProps = {
  notes: NoteDto[];
};

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PublicBoard({ notes }: PublicBoardProps) {
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const total = notes.length;
    const pinned = notes.filter((note) => note.isPinned).length;
    const withImages = notes.filter((note) => Boolean(note.metadata?.imageDataUrl)).length;

    return { total, pinned, withImages };
  }, [notes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return notes;
    }

    return notes.filter((note) => {
      const inTitle = note.title.toLowerCase().includes(q);
      const inContent = note.content.toLowerCase().includes(q);
      const inTags = note.tags.some((tag) => tag.toLowerCase().includes(q));
      return inTitle || inContent || inTags;
    });
  }, [notes, query]);

  const featuredNote = filtered[0] ?? null;
  const feedNotes = filtered.slice(featuredNote ? 1 : 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 p-4 shadow-[0_25px_80px_rgba(16,22,37,0.08)] backdrop-blur md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(31,111,255,0.14),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(15,169,104,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0.15))]" />

        <header className="relative grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              <Sparkles size={14} /> Public journal
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              System Board is the living brain layer for everything you stash.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Quick thoughts, pasted links, snapshots, and mobile-captured images flow into one elegant stream.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Owner login <ArrowRight size={16} />
              </Link>
              <span className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700">
                <Star size={16} /> Private owner feed
              </span>
            </div>
          </div>

          <aside className="lux-panel rounded-[1.75rem] p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-950 px-4 py-4 text-white shadow-lg shadow-slate-950/15">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Notes</p>
                <p className="mt-2 text-3xl font-semibold">{stats.total}</p>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-blue-800">
                <p className="text-xs uppercase tracking-[0.18em] text-blue-500">Pinned</p>
                <p className="mt-2 text-3xl font-semibold">{stats.pinned}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-500">Images</p>
                <p className="mt-2 text-3xl font-semibold">{stats.withImages}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Flow</p>
              <ol className="mt-3 space-y-3 text-sm text-slate-600">
                <li className="flex gap-3"><span className="text-blue-600">01</span> Capture from mobile in one tap.</li>
                <li className="flex gap-3"><span className="text-blue-600">02</span> Organize with tags, pinning, and archive.</li>
                <li className="flex gap-3"><span className="text-blue-600">03</span> Surface notes publicly on the root feed.</li>
              </ol>
            </div>
          </aside>
        </header>

        <section className="relative mt-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes and tags"
              className="lux-input h-14 w-full rounded-2xl pl-11 pr-4 text-base outline-none transition"
            />
          </div>
        </section>

        {featuredNote ? (
          <section className="relative mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="lux-panel rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Featured
                </div>
                <span className="lux-chip rounded-full px-2 py-1 text-xs">{formatTime(featuredNote.updatedAt)}</span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{featuredNote.title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 sm:text-base">
                {featuredNote.content}
              </p>

              {featuredNote.metadata?.url ? (
                <a
                  href={featuredNote.metadata.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 inline-flex rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                >
                  {featuredNote.metadata.host ?? featuredNote.metadata.url}
                </a>
              ) : null}

              {featuredNote.tags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {featuredNote.tags.map((tag) => (
                    <span key={`${featuredNote.id}-${tag}`} className="lux-chip rounded-full px-3 py-1 text-xs font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>

            <aside className="lux-panel overflow-hidden rounded-[1.75rem]">
              {featuredNote.metadata?.imageDataUrl ? (
                <Image
                  src={featuredNote.metadata.imageDataUrl}
                  alt={featuredNote.title}
                  width={1200}
                  height={900}
                  className="h-full min-h-[320px] w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex min-h-[320px] items-end bg-[linear-gradient(180deg,rgba(31,111,255,0.08),rgba(15,169,104,0.12))] p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Board energy</p>
                    <p className="mt-2 max-w-sm text-2xl font-semibold tracking-tight text-slate-950">
                      Notes with no image still feel intentional.
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </section>
        ) : null}

        {filtered.length === 0 ? (
          <div className="lux-panel mt-6 rounded-[1.75rem] border-dashed p-10 text-center">
            <h2 className="text-lg font-semibold text-slate-900">No public notes yet.</h2>
            <p className="mt-1 text-sm text-slate-600">New notes from your board will appear here automatically.</p>
          </div>
        ) : null}

        {feedNotes.length > 0 ? (
          <section className="mt-6 columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3 xl:columns-4 sm:space-y-0 sm:gap-4">
            {feedNotes.map((note) => (
              <article
                key={note.id}
                className="mb-4 break-inside-avoid overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/90 p-4 shadow-[0_12px_40px_rgba(16,22,37,0.08)]"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-base font-semibold text-slate-950">{note.title}</h3>
                  <span className="lux-chip rounded-full px-2 py-1 text-[11px]">{formatTime(note.updatedAt)}</span>
                </div>

                <p className="mb-3 line-clamp-6 whitespace-pre-wrap text-sm leading-7 text-slate-700">{note.content}</p>

                {note.metadata?.imageDataUrl ? (
                  <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200">
                    <Image
                      src={note.metadata.imageDataUrl}
                      alt={note.title}
                      width={1200}
                      height={900}
                      className="h-auto w-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}

                {note.metadata?.url ? (
                  <a
                    href={note.metadata.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mb-3 block rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700"
                  >
                    {note.metadata.host ?? note.metadata.url}
                  </a>
                ) : null}

                {note.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag) => (
                      <span key={`${note.id}-${tag}`} className="lux-chip rounded-full px-2.5 py-1 text-xs font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
