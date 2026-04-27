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
  contentKind: "EDITOR" | "FILE" | string;
  published: boolean;
  updatedAt: string;
}

export interface DocFolderNode {
  folderId: string;
  parentFolderId: string | null;
  name: string;
  sortOrder: number;
  createdAt: string;
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
  createdAt: string;
}

export interface DocFolderListResponse {
  items: DocFolderItem[];
}

// Lite tree (no documents) — for folder picker modal
export interface DocFolderTreeLiteNode {
  folderId: string;
  parentFolderId: string | null;
  name: string;
  sortOrder: number;
  children: DocFolderTreeLiteNode[];
}

export interface DocFolderTreeLiteResponse {
  roots: DocFolderTreeLiteNode[];
}

// ── Document list ──────────────────────────────────────────────────────────────

export interface DocFolderPlacement {
  folderId: string;
  folderName: string;
  path: string[];
}

/** BE list item — no createdBy / folderPlacement in list response */
export interface DocEditorListItem {
  documentId: string;
  title: string;
  status: "DRAFT" | "ACTIVE" | string;
  contentKind: string;
  updatedAt: string;
  published: boolean;
}

export interface DocEditorListResponse {
  items: DocEditorListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export type DocListParams = {
  titleQuery?: string;
  page?: number;
  pageSize?: number;
};

// ── Document detail bundle ─────────────────────────────────────────────────────

export interface DocDetailParams {
  documentId: string;
  activityLimit?: number;
  readLimit?: number;
  commentLimit?: number;
  /** Comma-separated: "links,assignments,attachments,accessRules" — blank = all */
  include?: string;
  relationLimit?: number;
}

export interface DocActivityItem {
  action: string;
  actorUserId: string;
  createdAt: string;
  detail?: Record<string, unknown>;
}

export interface DocReadItem {
  userId: string;
  status: "READ" | "ACK" | string;
  readAt: string | null;
  ackedAt: string | null;
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
  documentLinkId: string;
  linkedDocumentId: string;
  linkType: string;
  direction: "OUT" | "IN";
  createdAt: string;
  createdBy: string;
}

export interface DocAssignmentItem {
  documentAssignmentId: string;
  assigneeUserId: string;
  assignedByUserId: string;
  status: string;
  assignedAt: string;
}

export interface DocAttachmentItem {
  documentAttachmentId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  mediaKind: "FILE" | "VIDEO" | string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface DocAccessRuleItem {
  documentAccessRuleId: string;
  roleId: string | null;
  departmentId: string | null;
  status: string;
  createdAt: string;
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
  documentVersionId: string;
  versionNo: number;
  fileUrl: string | null;
  richTextSnapshot: boolean;
  uploadedAt: string;
  uploadedBy: string;
}

export interface DocVersionListResponse {
  documentId: string;
  items: DocVersionItem[];
}

export interface DocVersionDetail {
  documentVersionId: string;
  documentId: string;
  versionNo: number;
  fileUrl: string | null;
  contentJson: unknown;
  uploadedAt: string;
  uploadedBy: string;
}

export interface DocVersionCompareResponse {
  documentId: string;
  equal: boolean;
  fromDocumentVersionId: string;
  toDocumentVersionId: string;
  fromVersionNo: number;
  toVersionNo: number;
  summary: {
    topLevelKeysAdded?: string[];
    topLevelKeysRemoved?: string[];
    changedPaths?: string[];
  } | null;
}

export interface DocPublishResponse {
  documentId: string;
  versionNo: number;
  documentVersionId: string;
}

// ── Read receipts list (full user info) ───────────────────────────────────────

export interface DocReadListItem {
  userId: string;
  fullName: string;
  email: string;
  status: "READ" | "ACK" | string;
  readAt: string | null;
  ackedAt: string | null;
}

export interface DocReadListResponse {
  documentId: string;
  items: DocReadListItem[];
}

// ── Comments list (flat, for admin/audit) ─────────────────────────────────────

export interface DocCommentListResponse {
  documentId: string;
  items: DocCommentItem[];
}

// ── Access rules list ─────────────────────────────────────────────────────────

export interface DocAccessRuleListResponse {
  documentId: string;
  rules: DocAccessRuleItem[];
}

// ── Links list ────────────────────────────────────────────────────────────────

export interface DocLinkListResponse {
  documentId: string;
  items: DocLinkItem[];
}

// ── Assignments list ──────────────────────────────────────────────────────────

export interface DocAssignmentListResponse {
  documentId: string;
  items: DocAssignmentItem[];
}

// ── Attachments list ──────────────────────────────────────────────────────────

export interface DocAttachmentListResponse {
  documentId: string;
  items: DocAttachmentItem[];
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
