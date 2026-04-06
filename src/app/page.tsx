import { prisma } from "@/lib/prisma";
import { PublicBoard } from "@/components/public-board";
import type { NoteDto, NoteMetadata } from "@/types/note";

function serializeNotes(
  notes: Array<{
    id: string;
    title: string;
    content: string;
    tags: string[];
    isPinned: boolean;
    isArchived: boolean;
    isTrashed: boolean;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }>,
): NoteDto[] {
  return notes.map((note) => ({
    ...note,
    metadata: (note.metadata as NoteMetadata | null) ?? null,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }));
}

export default async function HomePage() {
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();

  if (!ownerEmail) {
    return <PublicBoard notes={[]} />;
  }

  const owner = await prisma.user.findUnique({
    where: { email: ownerEmail },
    select: { id: true },
  });

  if (!owner) {
    return <PublicBoard notes={[]} />;
  }

  const notes = await prisma.note.findMany({
    where: {
      userId: owner.id,
      isArchived: false,
      isTrashed: false,
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  return <PublicBoard notes={serializeNotes(notes)} />;
}
