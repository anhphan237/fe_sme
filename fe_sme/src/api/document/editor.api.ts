import { gatewayRequest } from "../core/gateway";
import type {
  DocFolderTreeResponse,
  DocFolderTreeLiteResponse,
  DocFolderListResponse,
  DocEditorListResponse,
  DocListParams,
  DocEditorDetail,
  DocDetailParams,
  DocVersionListResponse,
  DocVersionDetail,
  DocVersionCompareResponse,
  DocPublishResponse,
  DocCommentTreeResponse,
  DocCommentListResponse,
  DocReadListResponse,
  DocAccessRuleListResponse,
  DocLinkListResponse,
  DocAssignmentListResponse,
  DocAttachmentListResponse,
} from "@/interface/document/editor";

const EMPTY_PAYLOAD: Record<string, never> = {};

const cleanPayload = <T extends Record<string, unknown>>(payload: T): T => {
  const entries = Object.entries(payload).filter(([, value]) => {
    if (value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  });

  return Object.fromEntries(entries) as T;
};

const toDraftJson = (content: unknown): string => {
  if (typeof content === "string") return content;

  try {
    return JSON.stringify(content ?? {});
  } catch {
    return "{}";
  }
};

// ──────────────────────────────────────────────
// Folder APIs - usable for V1
// ──────────────────────────────────────────────

export const apiDocFolderCreate = (
  name: string,
  parentFolderId?: string | null,
) =>
  gatewayRequest<
    {
      name: string;
      parentFolderId?: string | null;
    },
    { folderId: string }
  >(
    "com.sme.document.folder.create",
    cleanPayload({
      name: name.trim(),
      parentFolderId,
    }),
  );

export const apiDocFolderRename = (folderId: string, name: string) =>
  gatewayRequest(
    "com.sme.document.folder.rename",
    cleanPayload({
      folderId,
      name: name.trim(),
    }),
  );

export const apiDocFolderMove = (
  folderId: string,
  newParentFolderId?: string | null,
) =>
  gatewayRequest("com.sme.document.folder.move", {
    folderId,
    newParentFolderId: newParentFolderId ?? null,
  });

export const apiDocFolderDelete = (folderId: string) =>
  gatewayRequest("com.sme.document.folder.delete", { folderId });

export const apiDocFolderTree = () =>
  gatewayRequest<Record<string, never>, DocFolderTreeLiteResponse>(
    "com.sme.document.folder.tree",
    EMPTY_PAYLOAD,
  );

export const apiDocFolderTreeWithDocuments = () =>
  gatewayRequest<Record<string, never>, DocFolderTreeResponse>(
    "com.sme.document.folder.treeWithDocuments",
    EMPTY_PAYLOAD,
  );

export const apiDocFolderAddDocument = (
  folderId: string,
  documentId: string,
) =>
  gatewayRequest("com.sme.document.folder.addDocument", {
    folderId,
    documentId,
  });

// ──────────────────────────────────────────────
// Folder APIs - keep export for compatibility
// Do not use in V1 if BE operation is not available
// ──────────────────────────────────────────────

export const apiDocFolderList = () =>
  gatewayRequest<Record<string, never>, DocFolderListResponse>(
    "com.sme.document.folder.list",
    EMPTY_PAYLOAD,
  );

export const apiDocFolderRemoveDocument = (
  folderId: string,
  documentId: string,
) =>
  gatewayRequest("com.sme.document.folder.removeDocument", {
    folderId,
    documentId,
  });

// ──────────────────────────────────────────────
// Document lifecycle APIs - usable for V1
// ──────────────────────────────────────────────

export const apiDocCreateDraft = (title: string) =>
  gatewayRequest<
    {
      title: string;
      draftJson: string;
    },
    { documentId: string }
  >("com.sme.document.createDraft", {
    title: title.trim() || "Untitled document",
    draftJson: "{}",
  });

export const apiDocUpdateDraft = (
  documentId: string,
  title: string,
  content: unknown,
) =>
  gatewayRequest("com.sme.document.updateDraft", {
    documentId,
    title: title.trim() || "Untitled document",
    draftJson: toDraftJson(content),
  });

/**
 * V1 note:
 * BE does not expose `com.sme.document.autosave` in Postman.
 * Keep this function name for FE compatibility, but route it to updateDraft.
 */
export const apiDocAutosave = (
  documentId: string,
  title: string,
  content: unknown,
) => apiDocUpdateDraft(documentId, title, content);

export const apiDocPublish = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocPublishResponse>(
    "com.sme.document.publish",
    { documentId },
  );

export const apiDocDetail = (params: DocDetailParams) =>
  gatewayRequest<DocDetailParams, DocEditorDetail>(
    "com.sme.document.detail",
    params,
  );

// Keep export for compatibility.
// Do not use in V1 if BE operation is not available.
export const apiDocList = (params?: DocListParams) =>
  gatewayRequest<DocListParams, DocEditorListResponse>(
    "com.sme.document.list",
    params ?? ({} as DocListParams),
  );

// ──────────────────────────────────────────────
// Versions APIs - usable if BE has these operations
// ──────────────────────────────────────────────

export const apiDocVersionList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocVersionListResponse>(
    "com.sme.document.version.list",
    { documentId },
  );

export const apiDocVersionGet = (documentVersionId: string) =>
  gatewayRequest<{ documentVersionId: string }, DocVersionDetail>(
    "com.sme.document.version.get",
    { documentVersionId },
  );

export function apiDocVersionCompare(
  documentId: string,
  fromDocumentVersionId: string,
  toDocumentVersionId: string,
): Promise<DocVersionCompareResponse>;

export function apiDocVersionCompare(
  fromDocumentVersionId: string,
  toDocumentVersionId: string,
): Promise<DocVersionCompareResponse>;

export function apiDocVersionCompare(
  arg1: string,
  arg2: string,
  arg3?: string,
): Promise<DocVersionCompareResponse> {
  const payload =
    arg3 !== undefined
      ? {
          documentId: arg1,
          fromDocumentVersionId: arg2,
          toDocumentVersionId: arg3,
        }
      : {
          fromDocumentVersionId: arg1,
          toDocumentVersionId: arg2,
        };

  return gatewayRequest<typeof payload, DocVersionCompareResponse>(
    "com.sme.document.version.compare",
    payload,
  );
}

// ──────────────────────────────────────────────
// Comments APIs - usable if BE has these operations
// ──────────────────────────────────────────────

export const apiDocCommentAdd = (
  documentId: string,
  body: string,
  parentCommentId?: string,
) =>
  gatewayRequest<
    {
      documentId: string;
      body: string;
      parentCommentId?: string;
    },
    {
      commentId: string;
      documentId: string;
      parentCommentId: string | null;
      createdAt: string;
    }
  >(
    "com.sme.document.comment.add",
    cleanPayload({
      documentId,
      body,
      parentCommentId,
    }),
  );

export const apiDocCommentTree = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocCommentTreeResponse>(
    "com.sme.document.comment.tree",
    { documentId },
  );

export const apiDocCommentList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocCommentListResponse>(
    "com.sme.document.comment.list",
    { documentId },
  );

export const apiDocCommentUpdate = (commentId: string, body: string) =>
  gatewayRequest("com.sme.document.comment.update", {
    commentId,
    body,
  });

export const apiDocCommentDelete = (commentId: string) =>
  gatewayRequest("com.sme.document.comment.delete", { commentId });

// ──────────────────────────────────────────────
// Read APIs - usable for V1
// ──────────────────────────────────────────────

export const apiDocMarkRead = (documentId: string) =>
  gatewayRequest("com.sme.document.read.mark", { documentId });

export const apiDocReadList = (documentId: string, limit?: number) =>
  gatewayRequest<
    {
      documentId: string;
      limit?: number;
    },
    DocReadListResponse
  >(
    "com.sme.document.read.list",
    cleanPayload({
      documentId,
      limit,
    }),
  );

// ──────────────────────────────────────────────
// Access rules APIs
// Keep export for compatibility.
// Do not call in V1 because BE operation is not confirmed in Postman.
// ──────────────────────────────────────────────

export const apiDocAccessRuleList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocAccessRuleListResponse>(
    "com.sme.document.accessRule.list",
    { documentId },
  );

export const apiDocAccessRuleAdd = (
  documentId: string,
  rule: {
    roleId?: string;
    departmentId?: string;
  },
) =>
  gatewayRequest(
    "com.sme.document.accessRule.add",
    cleanPayload({
      documentId,
      ...rule,
    }),
  );

export const apiDocAccessRuleRemove = (documentAccessRuleId: string) =>
  gatewayRequest("com.sme.document.accessRule.remove", {
    documentAccessRuleId,
  });

// ──────────────────────────────────────────────
// Links APIs
// Keep export for compatibility.
// Do not call in V1 because BE operation is not confirmed in Postman.
// ──────────────────────────────────────────────

export const apiDocLinkList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocLinkListResponse>(
    "com.sme.document.link.list",
    { documentId },
  );

export const apiDocLinkAdd = (
  sourceDocumentId: string,
  targetDocumentId: string,
  linkType?: string,
) =>
  gatewayRequest<
    {
      sourceDocumentId: string;
      targetDocumentId: string;
      linkType?: string;
    },
    { documentLinkId: string }
  >(
    "com.sme.document.link.add",
    cleanPayload({
      sourceDocumentId,
      targetDocumentId,
      linkType,
    }),
  );

export const apiDocLinkRemove = (documentLinkId: string) =>
  gatewayRequest("com.sme.document.link.remove", { documentLinkId });

// ──────────────────────────────────────────────
// Assignments APIs
// Keep export for compatibility.
// Do not call in V1 because BE operation is not confirmed in Postman.
// ──────────────────────────────────────────────

export const apiDocAssignmentList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocAssignmentListResponse>(
    "com.sme.document.assignment.list",
    { documentId },
  );

export const apiDocAssignmentAssign = (
  documentId: string,
  assigneeUserId: string,
) =>
  gatewayRequest<
    {
      documentId: string;
      assigneeUserId: string;
    },
    { documentAssignmentId: string }
  >("com.sme.document.assignment.assign", {
    documentId,
    assigneeUserId,
  });

export const apiDocAssignmentUnassign = (documentAssignmentId: string) =>
  gatewayRequest("com.sme.document.assignment.unassign", {
    documentAssignmentId,
  });

// ──────────────────────────────────────────────
// Attachments APIs
// Keep export for compatibility.
// Do not call in V1 because BE operation is not confirmed in Postman.
// ──────────────────────────────────────────────

export const apiDocAttachmentList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocAttachmentListResponse>(
    "com.sme.document.attachment.list",
    { documentId },
  );

export const apiDocAttachmentAdd = (input: {
  documentId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  mediaKind: "FILE" | "VIDEO";
}) =>
  gatewayRequest<typeof input, { documentAttachmentId: string }>(
    "com.sme.document.attachment.add",
    input,
  );

export const apiDocAttachmentRemove = (documentAttachmentId: string) =>
  gatewayRequest("com.sme.document.attachment.remove", {
    documentAttachmentId,
  });
  export const apiDocFolderUpdate = (
  folderId: string,
  payload: {
    name?: string;
    parentFolderId?: string | null;
  },
) =>
  gatewayRequest<
    {
      folderId: string;
      name?: string;
      parentFolderId?: string | null;
    },
    {
      folderId: string;
    }
  >("com.sme.document.folder.update", {
    folderId,
    ...payload,
  });