// ============================================================
// Document Editor Module Interfaces
// Maps to BE: modules/content doceditor
// Operations: com.sme.document.*
// ============================================================

// ── Common ────────────────────────────────────────────────────────────────────

export type DocumentStatus = "DRAFT" | "ACTIVE" | "PUBLISHED" | "ARCHIVED" | string;

export type DocumentContentKind = "EDITOR" | "FILE" | string;

export type DocumentReadStatus = "READ" | "ACK" | string;

export type DocumentMediaKind = "FILE" | "VIDEO" | string;

// ── Folder ────────────────────────────────────────────────────────────────────

export interface DocFolderDocument {
  documentId: string;
  title: string;
  description?: string;
  status: DocumentStatus;
  contentKind: DocumentContentKind;
  published: boolean;
  updatedAt: string;

  /** Optional fields for richer FE cards */
  createdAt?: string;
  folderId?: string;
  folderName?: string;
  fileUrl?: string;
  attachmentCount?: number;
  readCount?: number;
  ackCount?: number;
}

export interface DocFolderNode {
  folderId: string;
  parentFolderId: string | null;
  name: string;
  sortOrder: number;
  createdAt: string;

  /** Optional if BE returns count */
  documentCount?: number;
  childrenCount?: number;

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

  documentCount?: number;
  childrenCount?: number;
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

  documentCount?: number;
  childrenCount?: number;
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

/** BE list item */
export interface DocEditorListItem {
  documentId: string;
  title: string;
  description?: string;
  status: DocumentStatus;
  contentKind: DocumentContentKind;
  updatedAt: string;
  published: boolean;

  createdAt?: string;
  fileUrl?: string;
  folderPlacement?: DocFolderPlacement | null;
  attachmentCount?: number;
  readCount?: number;
  ackCount?: number;
}

export interface DocEditorListResponse {
  items: DocEditorListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export type DocListParams = {
  titleQuery?: string;
  status?: DocumentStatus;
  contentKind?: DocumentContentKind;
  page?: number;
  pageSize?: number;
};

// ── Document detail bundle ─────────────────────────────────────────────────────

export interface DocDetailParams {
  documentId: string;
  activityLimit?: number;
  readLimit?: number;
  commentLimit?: number;

  /**
   * Comma-separated:
   * "links,assignments,attachments,accessRules,activity,reads,comments"
   * blank = BE default/all
   */
  include?: string;

  relationLimit?: number;
}

export interface DocActivityItem {
  action: string;
  actorUserId: string;
  actorFullName?: string;
  actorEmail?: string;
  createdAt: string;
  detail?: Record<string, unknown>;
}

export interface DocReadItem {
  userId: string;
  fullName?: string;
  email?: string;
  status: DocumentReadStatus;
  readAt: string | null;

  /** BE may return either ackedAt or acknowledgedAt */
  ackedAt?: string | null;
  acknowledgedAt?: string | null;
}

export interface DocCommentItem {
  commentId: string;
  parentCommentId: string | null;
  authorUserId: string;
  authorFullName?: string;
  authorEmail?: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocLinkItem {
  documentLinkId: string;
  linkedDocumentId: string;

  /** Optional title for FE display */
  linkedDocumentTitle?: string;

  linkType: string;
  direction: "OUT" | "IN";
  createdAt: string;
  createdBy: string;
}

export interface DocAssignmentItem {
  documentAssignmentId: string;
  assigneeUserId: string;

  /** Optional fields for FE display */
  assigneeFullName?: string;
  assigneeEmail?: string;

  assignedByUserId: string;
  assignedByFullName?: string;
  status: string;
  assignedAt: string;
}

export interface DocAttachmentItem {
  documentAttachmentId: string;
  documentId?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  mediaKind: DocumentMediaKind;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByFullName?: string;
}

export interface DocAccessRuleItem {
  documentAccessRuleId: string;
  roleId: string | null;
  departmentId: string | null;

  /** Optional fields for FE display */
  roleCode?: string | null;
  roleName?: string | null;
  departmentName?: string | null;

  status: string;
  createdAt: string;
}

export interface DocEditorDetail {
  documentId: string;
  title: string;
  description?: string;
  status: DocumentStatus;
  contentKind: DocumentContentKind;
  published: boolean;

  /**
   * Keep both naming styles because BE/FE may use different fields.
   * FE should read draftContent first, then fallback to draftJson.
   */
  draftContent?: unknown;
  publishedContent?: unknown;
  draftJson?: unknown;
  publishedJson?: unknown;

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
  documentId?: string;
  versionNo: number;
  fileUrl: string | null;
  richTextSnapshot: boolean;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByFullName?: string;
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
  uploadedByFullName?: string;
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
  fullName?: string;
  email?: string;
  status: DocumentReadStatus;
  readAt: string | null;

  /** BE may return either ackedAt or acknowledgedAt */
  ackedAt?: string | null;
  acknowledgedAt?: string | null;
}

export interface DocReadListResponse {
  documentId: string;
  items: DocReadListItem[];
}

// ── Comments list/tree ────────────────────────────────────────────────────────

export interface DocCommentListResponse {
  documentId: string;
  items: DocCommentItem[];
}

export interface DocCommentTreeNode {
  commentId: string;
  parentCommentId: string | null;
  authorUserId: string;
  authorFullName?: string;
  authorEmail?: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  children: DocCommentTreeNode[];
}

export interface DocCommentTreeResponse {
  roots: DocCommentTreeNode[];
}

// ── Access rules list ─────────────────────────────────────────────────────────

export interface DocAccessRuleListResponse {
  documentId: string;

  /** Some BE may return rules; some may return items */
  rules?: DocAccessRuleItem[];
  items?: DocAccessRuleItem[];
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

// ── Tiptap JSON content helpers ────────────────────────────────────────────────

export interface TiptapTextMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapTextNode {
  type: "text";
  text: string;
  marks?: TiptapTextMark[];
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

export const isTiptapDoc = (value: unknown): value is TiptapDoc => {
  if (!value || typeof value !== "object") return false;

  const maybeDoc = value as Partial<TiptapDoc>;

  return maybeDoc.type === "doc" && Array.isArray(maybeDoc.content);
};

export const safeParseTiptapDoc = (value: unknown): TiptapDoc => {
  if (isTiptapDoc(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (isTiptapDoc(parsed)) return parsed;
    } catch {
      return textToTiptapDoc(value);
    }

    return textToTiptapDoc(value);
  }

  return emptyTiptapDoc();
};

export const tiptapDocToText = (doc: unknown): string => {
  const parsedDoc = safeParseTiptapDoc(doc);

  const extractText = (node: TiptapBlockNode | TiptapTextNode): string => {
    if (node.type === "text" && "text" in node) {
      return node.text ?? "";
    }

    if (!("content" in node) || !node.content?.length) {
      return "";
    }

    const text = node.content.map(extractText).join("");

    if (["paragraph", "heading", "listItem"].includes(node.type)) {
      return `${text}\n`;
    }

    return text;
  };

  return parsedDoc.content.map(extractText).join("").trim();
};

export const textToTiptapDoc = (text: string): TiptapDoc => {
  const lines = text.split("\n");

  return {
    type: "doc",
    content: lines.length
      ? lines.map((line) => ({
          type: "paragraph",
          content: line ? [{ type: "text", text: line }] : [],
        }))
      : [{ type: "paragraph" }],
  };
};