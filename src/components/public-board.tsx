"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-5 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Board</h1>
            <p className="text-sm text-slate-600">Public braindump stream</p>
          </div>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Owner login
          </Link>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes and tags"
            className="h-11 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No public notes yet.</h2>
          <p className="mt-1 text-sm text-slate-600">New notes from your board will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <article key={note.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="line-clamp-2 text-base font-semibold text-slate-900">{note.title}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                  {formatTime(note.updatedAt)}
                </span>
              </div>

              <p className="mb-3 line-clamp-6 whitespace-pre-wrap text-sm text-slate-700">{note.content}</p>

              {note.metadata?.imageDataUrl ? (
                <div className="mb-3 overflow-hidden rounded-lg border border-slate-200">
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
                  className="mb-3 block rounded-lg border border-teal-200 bg-teal-50 px-2 py-1.5 text-xs text-teal-700"
                >
                  {note.metadata.host ?? note.metadata.url}
                </a>
              ) : null}

              {note.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <span
                      key={`${note.id}-${tag}`}
                      className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
