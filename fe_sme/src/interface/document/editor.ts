// ============================================================
// Document Editor Module Interfaces
// Maps to BE: modules/content doceditor
// Operations: com.sme.document.*
// ============================================================

// ── Folder ────────────────────────────────────────────────────────────────────

export interface DocFolderDocument {
  documentId: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | string;
  published: boolean;
}

export interface DocFolderNode {
  folderId: string;
  parentFolderId: string | null;
  name: string;
  sortOrder: number;
  children: DocFolderNode[];
  documents: DocFolderDocument[];
}

export interface DocFolderTreeResponse {
  roots: DocFolderNode[];
}

export interface DocFolderItem {
  folderId: string;
  name: string;
  parentFolderId: string | null;
  sortOrder: number;
}

export interface DocFolderListResponse {
  folders: DocFolderItem[];
}

// ── Document list ──────────────────────────────────────────────────────────────

export interface DocFolderPlacement {
  folderId: string;
  folderName: string;
  path: string[];
}

export interface DocEditorListItem {
  documentId: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | string;
  published: boolean;
  updatedAt: string;
  createdBy: string;
  folderPlacement: DocFolderPlacement | null;
}

export interface DocEditorListResponse {
  items: DocEditorListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ── Document detail bundle ─────────────────────────────────────────────────────

export interface DocActivityItem {
  action: string;
  actorUserId: string;
  createdAt: string;
  detail?: Record<string, unknown>;
}

export interface DocReadItem {
  userId: string;
  readAt: string;
}

export interface DocCommentItem {
  commentId: string;
  parentCommentId: string | null;
  authorUserId: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocLinkItem {
  linkId: string;
  url: string;
  title: string;
}

export interface DocAssignmentItem {
  assignmentId: string;
  userId: string;
  assignedAt: string;
}

export interface DocAttachmentItem {
  attachmentId: string;
  name: string;
  fileUrl: string;
  contentType: string;
  size: number;
}

export interface DocAccessRuleItem {
  ruleId: string;
  roleId: string | null;
  departmentId: string | null;
}

export interface DocEditorDetail {
  documentId: string;
  title: string;
  description?: string;
  status: "DRAFT" | "ACTIVE" | string;
  contentKind: string;
  published: boolean;
  draftContent: unknown;
  publishedContent: unknown;
  publishedAt: string | null;
  publishedBy: string | null;
  createdAt: string;
  updatedAt: string;
  folderPlacement: DocFolderPlacement | null;
  activity: DocActivityItem[];
  reads: DocReadItem[];
  comments: DocCommentItem[];
  links: DocLinkItem[];
  assignments: DocAssignmentItem[];
  attachments: DocAttachmentItem[];
  accessRules: DocAccessRuleItem[];
}

// ── Versions ──────────────────────────────────────────────────────────────────

export interface DocVersionItem {
  versionId: string;
  documentId: string;
  versionNumber: number;
  publishedAt: string;
  publishedBy: string;
  note?: string;
}

export interface DocVersionListResponse {
  versions: DocVersionItem[];
}

export interface DocVersionDetail {
  versionId: string;
  documentId: string;
  versionNumber: number;
  content: unknown;
  publishedAt: string;
}

export interface DocVersionCompareResponse {
  equalDeep: boolean;
  summary: {
    topLevelKeysAdded: string[];
    topLevelKeysRemoved: string[];
    changedPaths: string[];
  };
}

// ── Comments tree ─────────────────────────────────────────────────────────────

export interface DocCommentTreeNode {
  commentId: string;
  parentCommentId: string | null;
  authorUserId: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  children: DocCommentTreeNode[];
}

export interface DocCommentTreeResponse {
  roots: DocCommentTreeNode[];
}

// ── Tiptap JSON content helpers ────────────────────────────────────────────────

export interface TiptapTextNode {
  type: "text";
  text: string;
  marks?: Array<{ type: string }>;
}

export interface TiptapBlockNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: Array<TiptapTextNode | TiptapBlockNode>;
}

export interface TiptapDoc {
  type: "doc";
  content: TiptapBlockNode[];
}

export const emptyTiptapDoc = (): TiptapDoc => ({
  type: "doc",
  content: [{ type: "paragraph" }],
});

export const tiptapDocToText = (doc: unknown): string => {
  if (!doc || typeof doc !== "object") return "";
  const node = doc as TiptapDoc;
  const extractText = (n: TiptapBlockNode | TiptapTextNode): string => {
    if ("text" in n) return n.text ?? "";
    if (!n.content) return "";
    return n.content.map(extractText).join(n.type === "paragraph" ? "\n" : "");
  };
  return (node.content ?? []).map(extractText).join("\n");
};

export const textToTiptapDoc = (text: string): TiptapDoc => ({
  type: "doc",
  content: text
    .split("\n")
    .map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    })),
});
