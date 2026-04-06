import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type BoardView = "board" | "archive" | "trash";

export function buildViewWhere(userId: string, view: BoardView): Prisma.NoteWhereInput {
  if (view === "archive") {
    return {
      userId,
      isArchived: true,
      isTrashed: false,
    };
  }

  if (view === "trash") {
    return {
      userId,
      isTrashed: true,
    };
  }

  return {
    userId,
    isArchived: false,
    isTrashed: false,
  };
}

export async function getNotesForView({
  userId,
  view,
  q,
}: {
  userId: string;
  view: BoardView;
  q?: string;
}) {
  const baseWhere = buildViewWhere(userId, view);
  const normalizedQuery = q?.trim().toLowerCase();

  const where = normalizedQuery
    ? {
        ...baseWhere,
        OR: [
          { title: { contains: normalizedQuery, mode: "insensitive" as const } },
          { content: { contains: normalizedQuery, mode: "insensitive" as const } },
          { tags: { has: normalizedQuery } },
        ],
      }
    : baseWhere;

  return prisma.note.findMany({
    where,
    orderBy:
      view === "trash"
        ? [{ updatedAt: "desc" }]
        : [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });
}
