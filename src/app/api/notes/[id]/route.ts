import { z } from "zod";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getOwnerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildTitleFromContent,
  mergeNoteMetadata,
  sanitizeContent,
  sanitizeTags,
  sanitizeTitle,
} from "@/lib/sanitize";
import type { NoteMetadata } from "@/types/note";
import { updateNoteSchema } from "@/lib/validators/note";

const paramsSchema = z.object({ id: z.string().cuid() });

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const owner = await getOwnerSession();
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
  }

  const existing = await prisma.note.findFirst({
    where: {
      id: params.data.id,
      userId: owner.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
  }

  const data = parsed.data;
  const nextContent =
    data.content !== undefined ? sanitizeContent(data.content) : existing.content;

  if (!nextContent) {
    return NextResponse.json({ error: "Note content cannot be empty" }, { status: 400 });
  }

  const nextTitle =
    data.title !== undefined
      ? sanitizeTitle(data.title) || buildTitleFromContent(nextContent)
      : existing.title;

  const nextTags = data.tags !== undefined ? sanitizeTags(data.tags) : existing.tags;

  const note = await prisma.note.update({
    where: { id: existing.id },
    data: {
      title: nextTitle,
      content: nextContent,
      tags: nextTags,
      isPinned: data.isPinned ?? existing.isPinned,
      isArchived: data.isArchived ?? existing.isArchived,
      isTrashed: data.isTrashed ?? existing.isTrashed,
      metadata:
        mergeNoteMetadata({
          content: nextContent,
          imageDataUrl: data.imageDataUrl,
          previous: (existing.metadata as NoteMetadata | null) ?? null,
        }) ?? Prisma.JsonNull,
    },
  });

  return NextResponse.json({ note }, { status: 200 });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const owner = await getOwnerSession();
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
  }

  const existing = await prisma.note.findFirst({
    where: {
      id: params.data.id,
      userId: owner.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  if (!existing.isTrashed) {
    const note = await prisma.note.update({
      where: { id: existing.id },
      data: {
        isPinned: false,
        isArchived: false,
        isTrashed: true,
      },
    });

    return NextResponse.json({ note, message: "Moved to trash" }, { status: 200 });
  }

  await prisma.note.delete({ where: { id: existing.id } });

  return NextResponse.json({ success: true, message: "Deleted permanently" }, { status: 200 });
}
