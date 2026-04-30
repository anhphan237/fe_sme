import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Breadcrumb,
  Button,
  Divider,
  Drawer,
  Input,
  Modal,
  Segmented,
  Skeleton,
  Spin,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FolderOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SaveOutlined,
  SendOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { useUserNameMap } from "@/utils/resolvers/userResolver";
import {
  apiDocAutosave,
  apiDocCommentAdd,
  apiDocCommentDelete,
  apiDocCommentTree,
  apiDocDetail,

  apiDocMarkRead,
  apiDocPublish,
  apiDocVersionGet,
  apiDocVersionList,
} from "@/api/document/editor.api";
import {
  apiSaveDocument,
  apiUploadDocumentFile,
} from "@/api/document/document.api";
import type {
  DocCommentTreeNode,
  DocEditorDetail,
  DocReadItem,
  DocVersionItem,
} from "@/interface/document/editor";

import DocumentBlockEditor from "./DocumentBlockEditor";
import {
  blockDocToPlainText,
  normalizeBlockDoc,
} from "./documentBlockEditor.utils";
import type { DocumentBlockDoc } from "./documentBlockEditor.utils";
import DocumentInfoDrawer from "./DocumentInfoDrawer";
import { useDocumentPermissions } from "../hooks/useDocumentPermissions";

dayjs.extend(relativeTime);

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const formatI18n = (
  template: string,
  values: Record<string, string | number>,
) => {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{{${key}}}`, String(value));
  }, template);
};

const countWords = (text: string): number => {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
};

const estimateReadMinutes = (text: string): number => {
  return Math.max(1, Math.ceil(countWords(text) / 200));
};

const getInitialBlockContent = (doc: DocEditorDetail): DocumentBlockDoc => {
  const raw =
    doc.draftContent ??
    doc.draftJson ??
    doc.publishedContent ??
    doc.publishedJson;

  return normalizeBlockDoc(raw);
};

const getAckTime = (read: DocReadItem): string | null => {
  return read.acknowledgedAt ?? read.ackedAt ?? null;
};

const createEditorDocumentUrl = (documentId: string) => {
  return `${window.location.origin}/documents/editor/${documentId}`;
};

const buildLegacyDocumentDescription = (plainText: string) => {
  const text = plainText.trim();

  if (!text) return "";

  return text.length > 250 ? `${text.slice(0, 250)}...` : text;
};

function useAutosave(
  documentId: string | undefined,
  title: string,
  content: DocumentBlockDoc,
  enabled: boolean,
  delayMs = 3000,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const contentRef = useRef(content);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const saveFn = useCallback(async () => {
    if (!documentId || !enabled) return;

    setSaveStatus("saving");

    try {
      await apiDocAutosave(documentId, titleRef.current, contentRef.current);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [documentId, enabled]);

  useEffect(() => {
    if (!enabled || !documentId) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      void saveFn();
    }, delayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [content, delayMs, documentId, enabled, saveFn, title]);

  const forceSave = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    await saveFn();
  }, [saveFn]);

  return { saveStatus, setSaveStatus, forceSave };
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const { t } = useLocale();

  if (status === "pending" || status === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted">
        <LoadingOutlined className="animate-spin" />
        {t("document.editor.saving")}
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600">
        <CheckOutlined />
        {t("document.editor.saved")}
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-xs text-red-500">
        <ExclamationCircleOutlined />
        {t("document.editor.save_error")}
      </span>
    );
  }

  return null;
}

function CommentNode({
  node,
  currentUserId,
  resolveName,
  depth = 0,
  onDelete,
  onReply,
}: {
  node: DocCommentTreeNode;
  currentUserId: string;
  resolveName: (id: string | null | undefined, fallback?: string) => string;
  depth?: number;
  onDelete: (commentId: string) => void;
  onReply: (parentCommentId: string) => void;
}) {
  const { t } = useLocale();
  const isOwn = node.authorUserId === currentUserId;

  return (
    <div style={{ marginLeft: depth * 14 }}>
      <div
        className={`rounded-xl p-3 ${
          depth === 0 ? "bg-slate-50" : "border border-stroke bg-white"
        }`}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
            <UserOutlined />
          </div>

          <span className="text-xs font-semibold text-ink">
            {resolveName(node.authorUserId, t("document.editor.user_fallback"))}
          </span>

          <span className="ml-auto shrink-0 text-xs text-muted">
            {dayjs(node.createdAt).fromNow()}
          </span>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
          {node.body}
        </p>

        <div className="mt-2 flex items-center gap-3">
          {depth < 3 && (
            <button
              className="text-xs font-medium text-brand hover:underline"
              onClick={() => onReply(node.commentId)}
            >
              {t("document.editor.comment.reply")}
            </button>
          )}

          {isOwn && (
            <button
              className="text-xs text-red-500 hover:underline"
              onClick={() => onDelete(node.commentId)}
            >
              {t("document.editor.comment.delete")}
            </button>
          )}
        </div>
      </div>

      <div className="mt-1.5 space-y-1.5">
        {node.children.map((child) => (
          <CommentNode
            key={child.commentId}
            node={child}
            currentUserId={currentUserId}
            resolveName={resolveName}
            depth={depth + 1}
            onDelete={onDelete}
            onReply={onReply}
          />
        ))}
      </div>
    </div>
  );
}

function CommentsPanel({
  documentId,
  open,
  onClose,
}: {
  documentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const currentUser = useUserStore((state) => state.currentUser);
  const currentUserId = currentUser?.id ?? "";
  const { resolveName } = useUserNameMap({ enabled: open });

  const { data: tree, isLoading } = useQuery({
    queryKey: ["doc-comments-tree", documentId],
    queryFn: () => apiDocCommentTree(documentId),
    enabled: open,
  });

  const roots = tree?.roots ?? [];

  const countAll = (node: DocCommentTreeNode): number => {
    return 1 + node.children.reduce((sum, child) => sum + countAll(child), 0);
  };

  const totalComments = roots.reduce((sum, root) => sum + countAll(root), 0);

  const addMutation = useMutation({
    mutationFn: ({ value, parentId }: { value: string; parentId?: string }) =>
      apiDocCommentAdd(documentId, value, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doc-comments-tree", documentId],
      });
      setBody("");
      setReplyTo(null);
    },
    onError: () => {
      message.error(t("document.editor.comment.add_error"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => apiDocCommentDelete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["doc-comments-tree", documentId],
      });
    },
    onError: () => {
      message.error(t("document.editor.comment.delete_error"));
    },
  });

  const submit = () => {
    if (!body.trim()) return;

    addMutation.mutate({
      value: body.trim(),
      parentId: replyTo ?? undefined,
    });
  };

  return (
    <Drawer
      title={
        <span className="flex items-center gap-2">
          <CommentOutlined />
          {t("document.editor.comments")}
          <Badge count={totalComments} color="blue" />
        </span>
      }
      open={open}
      onClose={onClose}
      width={400}
      styles={{
        body: {
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        },
      }}
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : roots.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center text-sm text-muted">
          <CommentOutlined className="mb-2 text-3xl text-slate-200" />
          {t("document.editor.comment.empty")}
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto">
          {roots.map((node) => (
            <CommentNode
              key={node.commentId}
              node={node}
              currentUserId={currentUserId}
              resolveName={resolveName}
              onDelete={(id) => deleteMutation.mutate(id)}
              onReply={(parentId) => setReplyTo(parentId)}
            />
          ))}
        </div>
      )}

      <Divider className="my-0" />

      {replyTo && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
          <span className="flex-1 truncate">
            {t("document.editor.replying_to")}
          </span>

          <button
            className="shrink-0 hover:underline"
            onClick={() => setReplyTo(null)}
          >
            {t("document.editor.comment.cancel_reply")}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <Input.TextArea
          placeholder={
            replyTo
              ? t("document.editor.comment.reply_placeholder")
              : t("document.editor.comment.placeholder")
          }
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              submit();
            }
          }}
        />

        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={addMutation.isPending}
          disabled={!body.trim()}
          onClick={submit}
          className="shrink-0"
        />
      </div>

      <p className="text-xs text-muted">
        {t("document.editor.comment.submit_hint")}
      </p>
    </Drawer>
  );
}

function VersionHistoryDrawer({
  documentId,
  open,
  onClose,
  onRestore,
}: {
  documentId: string;
  open: boolean;
  onClose: () => void;
  onRestore: (content: unknown) => void;
}) {
  const { t } = useLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: versionList, isLoading } = useQuery({
    queryKey: ["doc-versions", documentId],
    queryFn: () => apiDocVersionList(documentId),
    enabled: open,
  });

  const { data: versionDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["doc-version-detail", selectedId],
    queryFn: () => apiDocVersionGet(selectedId!),
    enabled: Boolean(selectedId),
  });

  const versions = versionList?.items ?? [];

  return (
    <Drawer
      title={
        <span className="flex items-center gap-2">
          <HistoryOutlined />
          {t("document.editor.versions")}
        </span>
      }
      open={open}
      onClose={onClose}
      width={480}
      styles={{ body: { padding: 0 } }}
    >
      <div className="flex h-full">
        <div className="flex w-48 shrink-0 flex-col overflow-y-auto border-r border-stroke bg-slate-50 p-3">
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : versions.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted">
              {t("document.editor.version.empty")}
            </p>
          ) : (
            versions.map((version: DocVersionItem) => (
              <button
                key={version.documentVersionId}
                className={`mb-1 rounded-xl px-3 py-2.5 text-left transition ${
                  selectedId === version.documentVersionId
                    ? "bg-brand text-white"
                    : "bg-white hover:bg-slate-100"
                }`}
                onClick={() => setSelectedId(version.documentVersionId)}
              >
                <div className="text-sm font-semibold">
                  v{version.versionNo}
                </div>

                <div
                  className={`mt-0.5 text-xs ${
                    selectedId === version.documentVersionId
                      ? "text-white/70"
                      : "text-muted"
                  }`}
                >
                  {dayjs(version.uploadedAt).format("DD/MM HH:mm")}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden p-4">
          {!selectedId && (
            <div className="flex flex-1 flex-col items-center justify-center text-sm text-muted">
              <HistoryOutlined className="mb-2 text-3xl text-slate-200" />
              {t("document.editor.version.select_hint")}
            </div>
          )}

          {loadingDetail && (
            <div className="flex justify-center py-8">
              <Spin />
            </div>
          )}

          {versionDetail && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-base font-semibold text-ink">
                  v{versionDetail.versionNo}
                </span>

                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    onRestore(versionDetail.contentJson);
                    onClose();
                  }}
                >
                  {t("document.editor.version.restore")}
                </Button>
              </div>

              <Divider className="my-2" />

              <div className="flex-1 overflow-y-auto rounded-xl bg-slate-50 p-4">
                <DocumentBlockEditor
                  value={normalizeBlockDoc(versionDetail.contentJson)}
                  readOnly
                  onChange={() => undefined}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function InfoPanel({
  doc,
  wordCount,
  readMinutes,
  resolveName,
}: {
  doc: DocEditorDetail;
  wordCount: number;
  readMinutes: number;
  resolveName: (id: string | null | undefined, fallback?: string) => string;
}) {
  const { t } = useLocale();
  const reads = doc.reads ?? [];

  return (
    <aside className="hidden w-80 shrink-0 overflow-y-auto bg-slate-50/80 p-4 xl:block">
      <div className="overflow-hidden rounded-3xl border border-stroke bg-white shadow-sm">
        <div className="border-b border-stroke bg-slate-50 px-5 py-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            <InfoCircleOutlined />
            {t("document.editor.info_panel")}
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-0 divide-y divide-stroke">
          <div className="px-5 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              {t("document.editor.section.stats")}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-stroke bg-slate-50 px-3 py-3">
                <p className="text-xs text-muted">
                  {t("document.editor.word_count_label")}
                </p>
                <p className="text-lg font-bold text-ink">{wordCount}</p>
              </div>

              <div className="rounded-2xl border border-stroke bg-slate-50 px-3 py-3">
                <p className="text-xs text-muted">
                  {t("document.editor.read_time_label")}
                </p>
                <p className="text-lg font-bold text-ink">
                  {readMinutes}
                  <span className="text-xs font-normal text-muted">
                    {t("document.editor.minute_suffix")}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("document.editor.section.details")}
            </p>

            <div className="flex items-start gap-2 text-xs">
              <ClockCircleOutlined className="mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="font-medium text-ink">
                  {t("document.editor.info.created")}
                </p>
                <p className="text-muted">
                  {doc.createdAt
                    ? dayjs(doc.createdAt).format("DD/MM/YYYY HH:mm")
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs">
              <EditOutlined className="mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="font-medium text-ink">
                  {t("document.editor.info.modified")}
                </p>
                <p className="text-muted">
                  {doc.updatedAt ? dayjs(doc.updatedAt).fromNow() : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs">
              <FolderOutlined className="mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="font-medium text-ink">
                  {t("document.editor.info.folder")}
                </p>
                <p className="text-muted">
                  {doc.folderPlacement?.folderName ??
                    t("document.editor.info.no_folder")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs">
              <TeamOutlined className="mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="font-medium text-ink">
                  {t("document.editor.info.access")}
                </p>
                <p className="text-muted">
                  {t("document.editor.info.access.open")}
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted">
              <EyeOutlined />
              {t("document.editor.readers")}
              {reads.length > 0 && (
                <span className="ml-1 rounded-full bg-brand/10 px-1.5 text-brand">
                  {reads.length}
                </span>
              )}
            </p>

            {reads.length === 0 ? (
              <p className="text-xs italic text-slate-300">
                {t("document.editor.readers.empty")}
              </p>
            ) : (
              <div className="space-y-1.5">
                {reads.slice(0, 20).map((read) => (
                  <div
                    key={read.userId}
                    className="flex items-center gap-2 rounded-2xl border border-stroke bg-slate-50 px-3 py-2"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs text-brand">
                      <UserOutlined />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-ink">
                        {resolveName(
                          read.userId,
                          read.fullName ??
                            read.email ??
                            t("document.editor.user_fallback"),
                        )}
                      </p>

                      <p className="text-xs text-muted">
                        {read.readAt ? dayjs(read.readAt).fromNow() : "—"}
                      </p>

                      {getAckTime(read) && (
                        <p className="text-xs text-green-600">
                          {t("document.reads.ack")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function DocumentEditorLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-stroke bg-white px-5 py-3">
        <Skeleton.Button active size="small" />
        <Skeleton.Input active size="small" className="w-64" />
        <div className="ml-auto flex gap-2">
          <Skeleton.Button active size="small" />
          <Skeleton.Button active size="small" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-8">
          <div className="mx-auto max-w-3xl space-y-4">
            <Skeleton active paragraph={{ rows: 14 }} />
          </div>
        </div>

        <div className="hidden w-72 border-l border-stroke bg-slate-50 p-4 xl:block">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    </div>
  );
}

function DocumentEditorContent({
  documentId,
  initialDoc,
}: {
  documentId: string;
  initialDoc: DocEditorDetail;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const { resolveName } = useUserNameMap();
  const permissions = useDocumentPermissions();

  const canEdit = permissions.canEdit;

  const [title, setTitle] = useState(
    initialDoc.title || t("document.editor.title_default"),
  );
  const [editingTitle, setEditingTitle] = useState(false);
  const [content, setContent] = useState<DocumentBlockDoc>(() =>
    getInitialBlockContent(initialDoc),
  );
  const [isDirty, setIsDirty] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [mode, setMode] = useState<"write" | "preview">(
    canEdit ? "write" : "preview",
  );
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [exitSaving, setExitSaving] = useState(false);

  const plainText = useMemo(() => blockDocToPlainText(content), [content]);
  const wordCount = useMemo(() => countWords(plainText), [plainText]);
  const readMinutes = useMemo(
    () => estimateReadMinutes(plainText),
    [plainText],
  );

  const { saveStatus, setSaveStatus, forceSave } = useAutosave(
    documentId,
    title,
    content,
    isDirty && canEdit,
  );

  const uploadBlockImage = useCallback(
    async (file: File) => {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("name", file.name.replace(/\.[^/.]+$/, "") || file.name);
      formData.append("description", "Document block image");

      const uploaded = await apiUploadDocumentFile(formData);

      if (!uploaded.fileUrl) {
        throw new Error(t("document.block.image.upload_error"));
      }

      return {
        secureUrl: uploaded.fileUrl,
        originalFilename: uploaded.name || file.name,
      };
    },
    [t],
  );

  useEffect(() => {
    apiDocMarkRead(documentId).catch(() => undefined);
  }, [documentId]);

  const invalidateDocumentQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["doc-detail", documentId] }),
      queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] }),
      queryClient.invalidateQueries({ queryKey: ["file-documents"] }),
      queryClient.invalidateQueries({ queryKey: ["doc-acknowledgments"] }),
    ]);
  }, [documentId, queryClient]);

  const goBackToPrevious = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/documents");
  }, [navigate]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    setSaveStatus("pending");
  }, [setSaveStatus]);

  const saveDraft = useCallback(
    async (showSuccessToast = false): Promise<boolean> => {
      if (!canEdit || !documentId) return false;

      try {
        await forceSave();
        setIsDirty(false);
        setSaveStatus("saved");
        await invalidateDocumentQueries();

        if (showSuccessToast) {
          message.success(t("document.editor.save_success"));
        }

        return true;
      } catch {
        setSaveStatus("error");
        message.error(t("document.editor.save_error"));
        return false;
      }
    },
    [
      canEdit,
      documentId,
      forceSave,
      invalidateDocumentQueries,
      setSaveStatus,
      t,
    ],
  );

  const handleBackRequest = useCallback(() => {
    if (!isDirty) {
      void invalidateDocumentQueries();
      goBackToPrevious();
      return;
    }

    setExitModalOpen(true);
  }, [goBackToPrevious, invalidateDocumentQueries, isDirty]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();

        if (!isDirty || !canEdit) return;

        void saveDraft();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canEdit, isDirty, saveDraft]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (isDirty) {
        const saved = await saveDraft();
        if (!saved) {
          throw new Error("SAVE_DRAFT_FAILED");
        }
      }

      await apiSaveDocument({
        name: title.trim() || t("document.editor.title_default"),
        fileUrl: createEditorDocumentUrl(documentId),
        description:
          buildLegacyDocumentDescription(plainText) ||
          t("document.editor.page_description_default"),
      });

      return apiDocPublish(documentId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["doc-detail", documentId] }),
        queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] }),
        queryClient.invalidateQueries({ queryKey: ["file-documents"] }),
        queryClient.invalidateQueries({ queryKey: ["doc-acknowledgments"] }),
      ]);

      setIsDirty(false);
      message.success(t("document.editor.publish_success"));

      navigate("/documents", {
        replace: true,
      });
    },
  });

  const handleRestore = (restoredContent: unknown) => {
    setContent(normalizeBlockDoc(restoredContent));
    markDirty();
    message.success(t("document.editor.restore_success"));
  };

  const commentCount = initialDoc.comments?.length ?? 0;
  const readCount = initialDoc.reads?.length ?? 0;
  const isPublished = initialDoc.published;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-50">
      {isDirty && saveStatus === "idle" && (
        <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs text-amber-700">
          <ExclamationCircleOutlined />
          <span>{t("document.editor.unsaved_changes")}</span>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-stroke/80 bg-white/90 px-5 py-3 shadow-sm backdrop-blur">
        <Tooltip title={t("document.editor.back")}>
          <Button
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackRequest}
          />
        </Tooltip>

        <Divider type="vertical" className="mx-0 h-5" />

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {initialDoc.folderPlacement && (
            <Breadcrumb
              className="text-xs"
              items={[
                {
                  title: (
                    <span className="text-muted">
                      {t("document.editor.breadcrumb_root")}
                    </span>
                  ),
                },
                ...initialDoc.folderPlacement.path.map((path) => ({
                  title: path,
                })),
                {
                  title: (
                    <span className="text-muted">
                      {initialDoc.folderPlacement?.folderName}
                    </span>
                  ),
                },
              ]}
            />
          )}

          {editingTitle && canEdit ? (
            <Input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                markDirty();
              }}
              onBlur={() => setEditingTitle(false)}
              onPressEnter={() => setEditingTitle(false)}
              className="max-w-sm text-base font-bold"
              autoFocus
            />
          ) : (
            <h1
              className={`text-base font-bold leading-tight text-ink ${
                canEdit ? "cursor-pointer hover:text-brand" : ""
              }`}
              onClick={() => canEdit && setEditingTitle(true)}
            >
              {title || t("document.editor.title_default")}
              {canEdit && (
                <EditOutlined className="ml-1.5 text-xs text-slate-300" />
              )}
            </h1>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Tag color={isPublished ? "green" : "gold"} className="m-0">
            {isPublished
              ? t("document.editor.status.published")
              : t("document.editor.status.draft")}
          </Tag>

          <SaveIndicator status={isDirty ? saveStatus : "idle"} />
        </div>

        <Divider type="vertical" className="mx-0 h-5" />

        {canEdit && (
          <Segmented
            size="small"
            value={mode}
            onChange={(value) => setMode(value as "write" | "preview")}
            options={[
              {
                label: t("document.editor.mode.write"),
                value: "write",
                icon: <EditOutlined />,
              },
              {
                label: t("document.editor.mode.preview"),
                value: "preview",
                icon: <EyeOutlined />,
              },
            ]}
          />
        )}

        <div className="flex shrink-0 items-center gap-1">
          <Tooltip title={t("document.editor.versions")}>
            <Button
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => setShowVersions(true)}
            />
          </Tooltip>

          <Tooltip title={t("document.editor.drawer")}>
            <Button
              size="small"
              icon={<AppstoreOutlined />}
              type={showInfoDrawer ? "primary" : "default"}
              ghost={showInfoDrawer}
              onClick={() => setShowInfoDrawer((value) => !value)}
            />
          </Tooltip>

          <Tooltip title={t("document.editor.comments")}>
            <Badge count={commentCount} size="small" offset={[-2, 2]}>
              <Button
                size="small"
                icon={<CommentOutlined />}
                onClick={() => setShowComments(true)}
              />
            </Badge>
          </Tooltip>

          <Tooltip title={t("document.editor.info_panel")}>
            <Button
              size="small"
              icon={<InfoCircleOutlined />}
              type={showInfo ? "primary" : "default"}
              ghost={showInfo}
              onClick={() => setShowInfo((value) => !value)}
            />
          </Tooltip>

          {canEdit && (
            <>
              <Tooltip title={t("document.editor.shortcut_save")}>
                <Button
                  size="small"
                  icon={<SaveOutlined />}
                  disabled={!isDirty}
                  onClick={() => {
                    void saveDraft(true);
                  }}
                />
              </Tooltip>

              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={publishMutation.isPending}
                onClick={() => publishMutation.mutate()}
              >
                {t("document.editor.publish")}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-stroke/80 bg-white/80 px-6 py-2 text-xs text-muted backdrop-blur">
        <span>
          {formatI18n(t("document.editor.word_count"), {
            count: wordCount,
          })}
        </span>

        <span className="text-slate-200">·</span>

        <span>
          {formatI18n(t("document.editor.read_time"), {
            min: readMinutes,
          })}
        </span>

        {readCount > 0 && (
          <>
            <span className="text-slate-200">·</span>
            <span className="flex items-center gap-1">
              <EyeOutlined />
              {formatI18n(t("document.editor.reads"), {
                count: readCount,
              })}
            </span>
          </>
        )}

        {initialDoc.activity?.length > 0 && (
          <span className="ml-auto">
            {initialDoc.activity.length} {t("document.editor.activity")}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
              <div className="mb-4 overflow-hidden rounded-3xl border border-stroke bg-white shadow-sm">
                <div className="border-b border-stroke bg-slate-50 px-6 py-4 sm:px-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                        {t("document.editor.workspace_label")}
                      </p>

                      <p className="mt-1 text-sm text-muted">
                        {canEdit
                          ? t("document.editor.workspace_write_desc")
                          : t("document.editor.workspace_preview_desc")}
                      </p>
                    </div>

                    <Tag
                      color={mode === "preview" ? "blue" : "default"}
                      className="m-0 rounded-full px-3 py-0.5"
                    >
                      {mode === "preview"
                        ? t("document.editor.mode.preview")
                        : t("document.editor.mode.write")}
                    </Tag>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <DocumentBlockEditor
                    value={content}
                    readOnly={!canEdit || mode === "preview"}
                    onChange={(nextContent) => {
                      setContent(nextContent);
                      markDirty();
                    }}
                    onUploadImage={uploadBlockImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {showInfo && (
          <InfoPanel
            doc={initialDoc}
            wordCount={wordCount}
            readMinutes={readMinutes}
            resolveName={resolveName}
          />
        )}
      </div>

      <CommentsPanel
        documentId={documentId}
        open={showComments}
        onClose={() => setShowComments(false)}
      />

      <VersionHistoryDrawer
        documentId={documentId}
        open={showVersions}
        onClose={() => setShowVersions(false)}
        onRestore={handleRestore}
      />

      <DocumentInfoDrawer
        documentId={documentId}
        open={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        canViewStats={permissions.canViewStats}
        canEdit={canEdit}
        canPublish={permissions.canPublish}
        canManageAccessRules={permissions.canManageAccessRules}
        canViewAccessRules={permissions.canViewAccessRules}
        canUpload={permissions.canCreate}
      />

      <Modal
        open={exitModalOpen}
        title={t("document.editor.exit_confirm_title")}
        onCancel={() => setExitModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setExitModalOpen(false)}>
            {t("document.editor.exit_cancel")}
          </Button>,

          <Button
            key="discard"
            onClick={() => {
              setIsDirty(false);
              setExitModalOpen(false);
              void invalidateDocumentQueries();
              goBackToPrevious();
            }}
          >
            {t("document.editor.exit_discard")}
          </Button>,

          <Button
            key="save"
            type="primary"
            loading={exitSaving}
            onClick={async () => {
              setExitSaving(true);
              const ok = await saveDraft();
              setExitSaving(false);

              if (!ok) return;

              setExitModalOpen(false);
              message.success(t("document.editor.save_exit_success"));
              goBackToPrevious();
            }}
          >
            {t("document.editor.exit_save")}
          </Button>,
        ]}
      >
        <p className="text-sm text-muted">
          {t("document.editor.exit_confirm_desc")}
        </p>
      </Modal>
    </div>
  );
}

export default function DocumentEditor() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { t } = useLocale();

  const goBackToPrevious = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/documents");
  }, [navigate]);

  const { data: doc, isLoading } = useQuery({
    queryKey: ["doc-detail", documentId],
    queryFn: () =>
      apiDocDetail({
        documentId: documentId!,
        include:
          "activity,reads,comments,links,assignments,attachments,accessRules",
        activityLimit: 50,
        readLimit: 50,
        commentLimit: 50,
        relationLimit: 50,
      }),
    enabled: Boolean(documentId),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <DocumentEditorLoading />;
  }

  if (!doc || !documentId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-12">
        <p className="text-muted">{t("document.editor.not_found")}</p>
        <Button onClick={goBackToPrevious}>{t("document.editor.back")}</Button>
      </div>
    );
  }

  return (
    <DocumentEditorContent
      key={doc.documentId}
      documentId={documentId}
      initialDoc={doc}
    />
  );
}
