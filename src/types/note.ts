export type NoteMetadata = {
  url?: string;
  host?: string;
  imageDataUrl?: string;
};

export type NoteDto = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  metadata: NoteMetadata | null;
  createdAt: string;
  updatedAt: string;
};

export type BoardView = "board" | "archive" | "trash";
