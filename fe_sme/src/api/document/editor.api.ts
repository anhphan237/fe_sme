import { gatewayRequest } from "../core/gateway";
import type {
  DocFolderTreeResponse,
  DocFolderListResponse,
  DocEditorListResponse,
  DocEditorDetail,
  DocVersionListResponse,
  DocVersionDetail,
  DocVersionCompareResponse,
  DocCommentTreeResponse,
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
  gatewayRequest("com.sme.document.publish", { documentId });

export const apiDocDetail = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocEditorDetail>(
    "com.sme.document.detail",
    { documentId },
  );

export const apiDocList = (params?: {
  titleQuery?: string;
  page?: number;
  pageSize?: number;
}) =>
  gatewayRequest<typeof params, DocEditorListResponse>("com.sme.document.list", params ?? {});

// ── Versions ───────────────────────────────────────────────────────────────────

export const apiDocVersionList = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocVersionListResponse>(
    "com.sme.document.version.list",
    { documentId },
  );

export const apiDocVersionGet = (versionId: string) =>
  gatewayRequest<{ versionId: string }, DocVersionDetail>(
    "com.sme.document.version.get",
    { versionId },
  );

export const apiDocVersionCompare = (versionId1: string, versionId2: string) =>
  gatewayRequest<{ versionId1: string; versionId2: string }, DocVersionCompareResponse>(
    "com.sme.document.version.compare",
    { versionId1, versionId2 },
  );

// ── Comments ───────────────────────────────────────────────────────────────────

export const apiDocCommentAdd = (
  documentId: string,
  body: string,
  parentCommentId?: string,
) =>
  gatewayRequest("com.sme.document.comment.add", { documentId, body, parentCommentId });

export const apiDocCommentTree = (documentId: string) =>
  gatewayRequest<{ documentId: string }, DocCommentTreeResponse>(
    "com.sme.document.comment.tree",
    { documentId },
  );

export const apiDocCommentUpdate = (commentId: string, body: string) =>
  gatewayRequest("com.sme.document.comment.update", { commentId, body });

export const apiDocCommentDelete = (commentId: string) =>
  gatewayRequest("com.sme.document.comment.delete", { commentId });

// ── Read receipts ──────────────────────────────────────────────────────────────

export const apiDocMarkRead = (documentId: string) =>
  gatewayRequest("com.sme.document.read.mark", { documentId });

// ── Access rules ───────────────────────────────────────────────────────────────

export const apiDocAccessRuleAdd = (
  documentId: string,
  rule: { roleId?: string; departmentId?: string },
) => gatewayRequest("com.sme.document.accessRule.add", { documentId, ...rule });

export const apiDocAccessRuleRemove = (ruleId: string) =>
  gatewayRequest("com.sme.document.accessRule.remove", { ruleId });
