import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getOwnerSession } from "@/lib/auth";
import { getNotesForView } from "@/lib/note-queries";
import { prisma } from "@/lib/prisma";
import {
  buildTitleFromContent,
  extractUrlMetadata,
  sanitizeContent,
  sanitizeTags,
  sanitizeTitle,
} from "@/lib/sanitize";
import { createNoteSchema, queryNotesSchema } from "@/lib/validators/note";

export async function GET(request: Request) {
  const owner = await getOwnerSession();
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = queryNotesSchema.safeParse({
    view: url.searchParams.get("view") ?? "board",
    q: url.searchParams.get("q") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const notes = await getNotesForView({
    userId: owner.id,
    view: parsed.data.view,
    q: parsed.data.q,
  });

  return NextResponse.json({ notes }, { status: 200 });
}

export async function POST(request: Request) {
  const owner = await getOwnerSession();
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid note payload" }, { status: 400 });
  }

  const content = sanitizeContent(parsed.data.content);
  if (!content) {
    return NextResponse.json({ error: "Note content cannot be empty" }, { status: 400 });
  }

  const title = sanitizeTitle(parsed.data.title) || buildTitleFromContent(content);
  const tags = sanitizeTags(parsed.data.tags ?? []);
  const metadata = extractUrlMetadata(content);

  const note = await prisma.note.create({
    data: {
      title,
      content,
      tags,
      isPinned: !!parsed.data.isPinned,
      metadata: metadata ?? Prisma.JsonNull,
      userId: owner.id,
    },
  });

  return NextResponse.json({ note }, { status: 201 });
}
