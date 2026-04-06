import { z } from "zod";

const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 5000;
const MAX_TAG_LENGTH = 24;
const MAX_IMAGE_DATA_URL_LENGTH = 2_800_000;

const imageDataUrlSchema = z
  .string()
  .max(MAX_IMAGE_DATA_URL_LENGTH)
  .regex(/^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=\r\n]+$/i)
  .optional();

export const createNoteSchema = z.object({
  title: z.string().max(MAX_TITLE_LENGTH).optional(),
  content: z.string().min(1).max(MAX_CONTENT_LENGTH),
  tags: z.array(z.string().min(1).max(MAX_TAG_LENGTH)).max(10).optional(),
  isPinned: z.boolean().optional(),
  imageDataUrl: imageDataUrlSchema,
});

export const updateNoteSchema = z
  .object({
    title: z.string().max(MAX_TITLE_LENGTH).optional(),
    content: z.string().min(1).max(MAX_CONTENT_LENGTH).optional(),
    tags: z.array(z.string().min(1).max(MAX_TAG_LENGTH)).max(10).optional(),
    isPinned: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    isTrashed: z.boolean().optional(),
    imageDataUrl: imageDataUrlSchema,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided for update.",
  });

export const queryNotesSchema = z.object({
  view: z.enum(["board", "archive", "trash"]).default("board"),
  q: z.string().max(120).optional(),
});
