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

// ── Folder ─────────────────────────────────────────────────────────────────────

export const apiDocFolderCreate = (name: string, parentFolderId?: string) =>
  gatewayRequest<{ name: string; parentFolderId?: string }, { folderId: string }>(
    "com.sme.document.folder.create",
    { name, parentFolderId },
  );

export const apiDocFolderRename = (folderId: string, name: string) =>
  gatewayRequest("com.sme.document.folder.rename", { folderId, name });

export const apiDocFolderMove = (folderId: string, newParentFolderId?: string) =>
  gatewayRequest("com.sme.document.folder.move", { folderId, newParentFolderId });

export const apiDocFolderDelete = (folderId: string) =>
  gatewayRequest("com.sme.document.folder.delete", { folderId });

export const apiDocFolderList = () =>
  gatewayRequest<Record<string, never>, DocFolderListResponse>(
    "com.sme.document.folder.list",
    {},
  );

export const apiDocFolderTree = () =>
  gatewayRequest<Record<string, never>, DocFolderTreeLiteResponse>(
    "com.sme.document.folder.tree",
    {},
  );

export const apiDocFolderTreeWithDocuments = () =>
  gatewayRequest<Record<string, never>, DocFolderTreeResponse>(
    "com.sme.document.folder.treeWithDocuments",
    {},
  );

export const apiDocFolderAddDocument = (folderId: string, documentId: string) =>
  gatewayRequest("com.sme.document.folder.addDocument", { folderId, documentId });

export const apiDocFolderRemoveDocument = (folderId: string, documentId: string) =>
  gatewayRequest("com.sme.document.folder.removeDocument", { folderId, documentId });

// ── Document lifecycle ─────────────────────────────────────────────────────────

export const apiDocCreateDraft = (title: string) =>
  gatewayRequest<{ title: string }, { documentId: string }>(
    "com.sme.document.createDraft",
    { title },
  );

export const apiDocUpdateDraft = (documentId: string, title: string, content: unknown) =>
  gatewayRequest("com.sme.document.updateDraft", {
    documentId,
    title,
    draftJson: JSON.stringify(content),
  });

export const apiDocAutosave = (documentId: string, title: string, content: unknown) =>
  gatewayRequest("com.sme.document.autosave", {
    documentId,
    title,
    draftJson: JSON.stringify(content),
  });

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

export const apiDocList = (params?: DocListParams) =>
  gatewayRequest<DocListParams, DocEditorListResponse>(
    "com.sme.document.list",
    params ?? {},
  );

// ── Versions ───────────────────────────────────────────────────────────────────

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

export const apiDocVersionCompare = (
  fromDocumentVersionId: string,
  toDocumentVersionId: string,
) =>
  gatewayRequest<
    { fromDocumentVersionId: string; toDocumentVersionId: string },
    DocVersionCompareResponse
  >("com.sme.document.version.compare", {
    fromDocumentVersionId,
    toDocumentVersionId,
  });

// ── Comments ───────────────────────────────────────────────────────────────────

export const apiDocCommentAdd = (
  documentId: string,
  body: string,
  parentCommentId?: string,
) =>
  gatewayRequest<
    { documentId: string; body: string; parentCommentId?: string },
    { commentId: string; documentId: string; parentCommentId: string | null; createdAt: string }
  >("com.sme.document.comment.add", { documentId, body, parentCommentId });

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
  gatewayRequest("com.sme.document.comment.update", { commentId, body });

export const apiDocCommentDelete = (commentId: string) =>
  gatewayRequest("com.sme.document.comment.delete", { commentId });

// ── Read receipts ──────────────────────────────────────────────────────────────

export const apiDocMarkRead = (documentId: string) =>
  gatewayRequest("com.sme.document.read.mark", { documentId });

export const apiDocReadList = (documentId: string, limit?: number) =>
  gatewayRequest<{ documentId: string; limit?: number }, DocReadListResponse>(
    "com.sme.document.read.list",
    { documentId, ...(limit !== undefined ? { limit } : {}) },
  );

// ── Access rules ───────────────────────────────────────────────────────────────

export const apiDocAccessRuleList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocAccessRuleListResponse>(
    "com.sme.document.accessRule.list",
    { documentId },
  );

export const apiDocAccessRuleAdd = (
  documentId: string,
  rule: { roleId?: string; departmentId?: string },
) => gatewayRequest("com.sme.document.accessRule.add", { documentId, ...rule });

export const apiDocAccessRuleRemove = (documentAccessRuleId: string) =>
  gatewayRequest("com.sme.document.accessRule.remove", { documentAccessRuleId });

// ── Links ──────────────────────────────────────────────────────────────────────

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
    { sourceDocumentId: string; targetDocumentId: string; linkType?: string },
    { documentLinkId: string }
  >("com.sme.document.link.add", { sourceDocumentId, targetDocumentId, linkType });

export const apiDocLinkRemove = (documentLinkId: string) =>
  gatewayRequest("com.sme.document.link.remove", { documentLinkId });

// ── Assignments ────────────────────────────────────────────────────────────────

export const apiDocAssignmentList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocAssignmentListResponse>(
    "com.sme.document.assignment.list",
    { documentId },
  );

export const apiDocAssignmentAssign = (documentId: string, assigneeUserId: string) =>
  gatewayRequest<
    { documentId: string; assigneeUserId: string },
    { documentAssignmentId: string }
  >("com.sme.document.assignment.assign", { documentId, assigneeUserId });

export const apiDocAssignmentUnassign = (documentAssignmentId: string) =>
  gatewayRequest("com.sme.document.assignment.unassign", { documentAssignmentId });

// ── Attachments ────────────────────────────────────────────────────────────────

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
  gatewayRequest("com.sme.document.attachment.remove", { documentAttachmentId });
