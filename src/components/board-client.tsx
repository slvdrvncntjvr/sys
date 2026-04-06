"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Archive, Pin, PinOff, Save, Search, Trash2, Undo2 } from "lucide-react";
import type { BoardView, NoteDto, NoteMetadata } from "@/types/note";

type BoardClientProps = {
  initialNotes: NoteDto[];
  view: BoardView;
};

type EditDraft = {
  title: string;
  content: string;
  tagsRaw: string;
  imageDataUrl: string | null;
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function getImageDataUrl(metadata: NoteMetadata | null): string | null {
  return metadata?.imageDataUrl ?? null;
}

function normalizeTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function BoardClient({ initialNotes, view }: BoardClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [notes, setNotes] = useState<NoteDto[]>(initialNotes);
  const [search, setSearch] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCapture, setQuickCapture] = useState("");
  const [quickTags, setQuickTags] = useState("");
  const [quickImageDataUrl, setQuickImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const quickCaptureRef = useRef<HTMLTextAreaElement>(null);

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read image."));
      reader.readAsDataURL(file);
    });
  }

  async function handleQuickImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image too large. Maximum size is 2 MB.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setQuickImageDataUrl(dataUrl);
      setError(null);
    } catch {
      setError("Could not read image.");
    }
  }

  const viewTitle = useMemo(() => {
    if (view === "archive") return "Archive";
    if (view === "trash") return "Trash";
    return "Board";
  }, [view]);

  const refreshNotes = useCallback(
    async (q = search) => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ view });
      if (q.trim()) {
        params.set("q", q.trim());
      }

      const response = await fetch(`/api/notes?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setLoading(false);
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        setError("Could not load notes.");
        return;
      }

      const data = (await response.json()) as { notes: NoteDto[] };
      setNotes(data.notes);
      setLoading(false);
    },
    [router, search, view],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshNotes(search);
    }, 220);

    return () => clearTimeout(timer);
  }, [search, refreshNotes]);

  useEffect(() => {
    function onGlobalKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      const isTyping = tagName === "input" || tagName === "textarea";

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key.toLowerCase() === "n" && !isTyping) {
        event.preventDefault();
        quickCaptureRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onGlobalKeydown);
    return () => window.removeEventListener("keydown", onGlobalKeydown);
  }, []);

  async function createNote() {
    if (!quickCapture.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: quickTitle,
        content: quickCapture,
        tags: normalizeTags(quickTags),
        imageDataUrl: quickImageDataUrl,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("Failed to save note.");
      return;
    }

    setQuickTitle("");
    setQuickCapture("");
    setQuickTags("");
    setQuickImageDataUrl(null);
    await refreshNotes("");
  }

  async function updateNote(id: string, body: Record<string, unknown>) {
    setError(null);

    const response = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setError("Update failed.");
      return false;
    }

    await refreshNotes();
    return true;
  }

  async function deleteNote(id: string) {
    setError(null);

    const response = await fetch(`/api/notes/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Delete failed.");
      return;
    }

    await refreshNotes();
  }

  function startEditing(note: NoteDto) {
    setEditingId(note.id);
    setDraft({
      title: note.title,
      content: note.content,
      tagsRaw: note.tags.join(", "),
      imageDataUrl: getImageDataUrl(note.metadata),
    });
  }

  async function saveEditing(id: string) {
    if (!draft) return;

    const ok = await updateNote(id, {
      title: draft.title,
      content: draft.content,
      tags: normalizeTags(draft.tagsRaw),
      imageDataUrl: draft.imageDataUrl,
    });

    if (ok) {
      setEditingId(null);
      setDraft(null);
    }
  }

  const isEmpty = !loading && notes.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="lux-panel mb-6 rounded-3xl p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Owner console</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">System Board</h1>
            <p className="mt-2 text-sm text-slate-600">Capture, shape, and publish your stream instantly.</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Sign out
          </button>
        </div>

        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Board sections">
          <Link
            href="/board"
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              pathname === "/board"
                ? "bg-blue-600 text-white"
                : "lux-chip hover:bg-white"
            }`}
          >
            Board
          </Link>
          <Link
            href="/archive"
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              pathname === "/archive"
                ? "bg-blue-600 text-white"
                : "lux-chip hover:bg-white"
            }`}
          >
            Archive
          </Link>
          <Link
            href="/trash"
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              pathname === "/trash"
                ? "bg-blue-600 text-white"
                : "lux-chip hover:bg-white"
            }`}
          >
            Trash
          </Link>
        </nav>
      </header>

      <section className="lux-panel mb-5 rounded-2xl p-4">
        <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Save size={18} /> Quick capture
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            value={quickTitle}
            onChange={(event) => setQuickTitle(event.target.value)}
            placeholder="Optional title"
            className="lux-input h-11 rounded-xl px-3 outline-none transition"
          />

          <input
            type="text"
            value={quickTags}
            onChange={(event) => setQuickTags(event.target.value)}
            placeholder="tags: personal, links"
            className="lux-input h-11 rounded-xl px-3 outline-none transition sm:col-span-2"
          />
        </div>

        <textarea
          ref={quickCaptureRef}
          value={quickCapture}
          onChange={(event) => setQuickCapture(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void createNote();
            }
          }}
          placeholder="Paste text or links here. Press Ctrl/Cmd + Enter to save quickly."
          className="lux-input mt-3 min-h-28 w-full rounded-xl px-3 py-2 outline-none transition"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="lux-chip inline-flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-white">
            Add image
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => void handleQuickImageSelect(event)}
              className="hidden"
            />
          </label>
          {quickImageDataUrl ? (
            <button
              onClick={() => setQuickImageDataUrl(null)}
              className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
            >
              Remove image
            </button>
          ) : null}
        </div>

        {quickImageDataUrl ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
            <Image
              src={quickImageDataUrl}
              alt="Selected upload preview"
              width={1200}
              height={900}
              className="h-auto w-full object-cover"
              unoptimized
            />
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">Hotkeys: / search, n quick capture, Ctrl/Cmd+Enter save.</p>
          <button
            onClick={() => void createNote()}
            disabled={submitting || !quickCapture.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save note"}
          </button>
        </div>
      </section>

      <section className="lux-panel mb-5 rounded-2xl p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search in ${viewTitle.toLowerCase()} by text or tag`}
            className="lux-input h-11 w-full rounded-xl pl-9 pr-3 outline-none transition"
          />
        </div>
      </section>

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
      ) : null}

      {isEmpty ? (
        <div className="lux-panel rounded-2xl border-dashed p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No notes in {viewTitle.toLowerCase()}.</h2>
          <p className="mt-1 text-sm text-slate-600">
            {view === "board"
              ? "Capture your first note above."
              : view === "archive"
                ? "Archive notes from the board to keep things clean."
                : "Trash is empty. Deleted notes will appear here first."}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => {
          const editing = editingId === note.id;

          return (
            <article key={note.id} className="lux-panel rounded-2xl p-4">
              {editing && draft ? (
                <div className="space-y-2">
                  <input
                    value={draft.title}
                    onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-teal-500"
                  />
                  <textarea
                    value={draft.content}
                    onChange={(event) => setDraft({ ...draft, content: event.target.value })}
                    className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Update image
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }
                          if (!file.type.startsWith("image/")) {
                            setError("Please choose an image file.");
                            return;
                          }
                          if (file.size > MAX_IMAGE_BYTES) {
                            setError("Image too large. Maximum size is 2 MB.");
                            return;
                          }
                          try {
                            const dataUrl = await fileToDataUrl(file);
                            setDraft({ ...draft, imageDataUrl: dataUrl });
                            setError(null);
                          } catch {
                            setError("Could not read image.");
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {draft.imageDataUrl ? (
                      <button
                        onClick={() => setDraft({ ...draft, imageDataUrl: null })}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700"
                      >
                        Remove image
                      </button>
                    ) : null}
                  </div>
                  {draft.imageDataUrl ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <Image
                        src={draft.imageDataUrl}
                        alt="Draft image preview"
                        width={1200}
                        height={900}
                        className="h-auto w-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <input
                    value={draft.tagsRaw}
                    onChange={(event) => setDraft({ ...draft, tagsRaw: event.target.value })}
                    placeholder="tag1, tag2"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-teal-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => void saveEditing(note.id)}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setDraft(null);
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{note.title}</h3>
                    <span className="lux-chip rounded-full px-2 py-1 text-xs">
                      {formatTime(note.updatedAt)}
                    </span>
                  </div>
                  <p className="mb-3 line-clamp-6 whitespace-pre-wrap text-sm text-slate-700">{note.content}</p>

                  {getImageDataUrl(note.metadata) ? (
                    <div className="mb-3 overflow-hidden rounded-lg border border-slate-200">
                      <Image
                        src={getImageDataUrl(note.metadata)!}
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
                      className="mb-3 block rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs text-blue-700"
                    >
                      {note.metadata.host}
                    </a>
                  ) : null}

                  {note.tags.length > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {note.tags.map((tag) => (
                        <span
                          key={`${note.id}-${tag}`}
                          className="lux-chip rounded-full px-2 py-1 text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {view !== "trash" ? (
                      <button
                        onClick={() => void updateNote(note.id, { isPinned: !note.isPinned })}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                      >
                        {note.isPinned ? (
                          <span className="inline-flex items-center gap-1">
                            <PinOff size={14} /> Unpin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Pin size={14} /> Pin
                          </span>
                        )}
                      </button>
                    ) : null}

                    {view === "board" ? (
                      <button
                        onClick={() => void updateNote(note.id, { isArchived: true, isPinned: false })}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Archive size={14} /> Archive
                        </span>
                      </button>
                    ) : null}

                    {view === "archive" ? (
                      <button
                        onClick={() => void updateNote(note.id, { isArchived: false })}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Undo2 size={14} /> Restore
                        </span>
                      </button>
                    ) : null}

                    {view === "trash" ? (
                      <button
                        onClick={() => void updateNote(note.id, { isTrashed: false, isArchived: false })}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Undo2 size={14} /> Restore
                        </span>
                      </button>
                    ) : null}

                    <button
                      onClick={() => void deleteNote(note.id)}
                      className="rounded-lg border border-rose-300 px-2.5 py-1.5 text-xs font-medium text-rose-700"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 size={14} /> {view === "trash" ? "Delete" : "Trash"}
                      </span>
                    </button>

                    {view !== "trash" ? (
                      <button
                        onClick={() => startEditing(note)}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
