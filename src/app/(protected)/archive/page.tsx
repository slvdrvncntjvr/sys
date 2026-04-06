import { BoardClient } from "@/components/board-client";
import { getOwnerSession } from "@/lib/auth";
import { getNotesForView } from "@/lib/note-queries";
import type { NoteDto } from "@/types/note";

function serializeNotes(notes: Awaited<ReturnType<typeof getNotesForView>>): NoteDto[] {
  return notes.map((note) => ({
    ...note,
    metadata: (note.metadata as Record<string, string> | null) ?? null,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }));
}

export default async function ArchivePage() {
  const owner = await getOwnerSession();
  const notes = await getNotesForView({
    userId: owner!.id,
    view: "archive",
  });

  return <BoardClient initialNotes={serializeNotes(notes)} view="archive" />;
}
