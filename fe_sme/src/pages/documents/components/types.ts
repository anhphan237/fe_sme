export type DocKind = "EDITOR" | "FILE";

export type UnifiedDocStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PUBLISHED"
  | "ARCHIVED"
  | string;

export interface UnifiedDoc {
  id: string;
  kind: DocKind;

  title: string;
  description?: string;

  status?: UnifiedDocStatus;
  published?: boolean;

  fileUrl?: string;

  folderId?: string;
  folderName?: string;

  createdAt?: string;
  updatedAt?: string;

  readCount?: number;
  ackCount?: number;
  attachmentCount?: number;
}

export const isEditorDoc = (doc: UnifiedDoc) => doc.kind === "EDITOR";

export const isFileDoc = (doc: UnifiedDoc) => doc.kind === "FILE";

export const getDocDisplayStatus = (doc: UnifiedDoc) => {
  if (doc.kind === "EDITOR") {
    if (doc.published) return "PUBLISHED";
    return doc.status || "DRAFT";
  }

  return doc.status || "ACTIVE";
};

export const getDocTypeLabelKey = (doc: UnifiedDoc) => {
  if (doc.kind === "EDITOR") return "document.type.editor";
  return "document.type.file";
};