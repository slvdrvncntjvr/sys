import sanitizeHtml from "sanitize-html";
import type { NoteMetadata } from "@/types/note";

const MAX_TAGS = 10;
const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 5000;
const MAX_TAG_LENGTH = 24;

export function sanitizePlainText(value: string): string {
  const cleaned = sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  });
  return cleaned.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

export function sanitizeTitle(value?: string): string {
  const sanitized = sanitizePlainText(value ?? "");
  return sanitized.slice(0, MAX_TITLE_LENGTH);
}

export function sanitizeContent(value: string): string {
  const sanitized = sanitizePlainText(value);
  return sanitized.slice(0, MAX_CONTENT_LENGTH);
}

export function sanitizeTags(tags: string[] = []): string[] {
  const deduped = Array.from(new Set(tags.map((tag) => sanitizePlainText(tag).toLowerCase())));
  return deduped.filter(Boolean).slice(0, MAX_TAGS).map((tag) => tag.slice(0, MAX_TAG_LENGTH));
}

export function buildTitleFromContent(content: string): string {
  const firstLine = content.split("\n").find((line) => line.trim().length > 0);
  return (firstLine ?? "Quick note").slice(0, MAX_TITLE_LENGTH);
}

export function extractUrlMetadata(content: string): Record<string, string> | null {
  const match = content.match(/https?:\/\/[^\s]+/i);
  if (!match) {
    return null;
  }

  try {
    const url = new URL(match[0]);
    return {
      url: url.toString(),
      host: url.host,
    };
  } catch {
    return null;
  }
}

export function sanitizeImageDataUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  const isAllowedDataUrl = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=\r\n]+$/i.test(
    normalized,
  );

  if (!isAllowedDataUrl) {
    return null;
  }

  return normalized;
}

export function mergeNoteMetadata({
  content,
  imageDataUrl,
  previous,
}: {
  content: string;
  imageDataUrl?: string | null;
  previous?: NoteMetadata | null;
}): NoteMetadata | null {
  const urlMeta = extractUrlMetadata(content) ?? {};
  const safeImage = sanitizeImageDataUrl(imageDataUrl);
  const merged: NoteMetadata = {
    ...urlMeta,
  };

  if (safeImage) {
    merged.imageDataUrl = safeImage;
  } else if (previous?.imageDataUrl) {
    merged.imageDataUrl = previous.imageDataUrl;
  }

  return Object.keys(merged).length > 0 ? merged : null;
}
