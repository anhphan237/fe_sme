// Unified document type — represents either a FILE or an EDITOR document
export type DocKind = "FILE" | "EDITOR";

export interface UnifiedDoc {
  id: string;
  kind: DocKind;
  title: string;
  description?: string;
  status: string;
  published?: boolean;
  fileUrl?: string;
  folderId?: string;
  folderName?: string;
  updatedAt?: string;
}
