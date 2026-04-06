import { BoardClient } from "@/components/board-client";
import { getOwnerSession } from "@/lib/auth";
import { getNotesForView } from "@/lib/note-queries";
import type { NoteDto, NoteMetadata } from "@/types/note";

function serializeNotes(notes: Awaited<ReturnType<typeof getNotesForView>>): NoteDto[] {
  return notes.map((note) => ({
    ...note,
    metadata: (note.metadata as NoteMetadata | null) ?? null,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }));
}

export default async function BoardPage() {
  const owner = await getOwnerSession();
  const notes = await getNotesForView({
    userId: owner!.id,
    view: "board",
  });

  return <BoardClient initialNotes={serializeNotes(notes)} view="board" />;
}
