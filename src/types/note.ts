export type NoteDto = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  metadata: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
};

export type BoardView = "board" | "archive" | "trash";
