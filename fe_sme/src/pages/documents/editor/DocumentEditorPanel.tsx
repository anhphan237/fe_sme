import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Breadcrumb,
  Button,
  Divider,
  Empty,
  Input,
  Segmented,
  Skeleton,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { useLocale } from "@/i18n";
import {
  apiDocAttachmentList,
  apiDocAutosave,
  apiDocDetail,
  apiDocMarkRead,
  apiDocPublish,
} from "@/api/document/editor.api";
import {
  apiGetDocuments,
  apiSaveDocument,
  apiUploadDocumentAttachment,
} from "@/api/document/document.api";

import { useDocumentPermissions } from "../hooks/useDocumentPermissions";
import DocumentBlockEditor from "./DocumentBlockEditor";
import type {
  DocumentBlock,
  DocumentBlockDoc,
} from "./documentBlockEditor.utils";
import {
  blockDocToPlainText,
  normalizeBlockDoc,
} from "./documentBlockEditor.utils";

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";
type EditorMode = "write" | "preview";

type FolderPlacement = {
  folderId?: string;
  folderName?: string;
  path?: string[];
};

type EditorDocumentDetail = {
  documentId: string;
  title?: string;
  status?: string;
  published?: boolean;
  draftContent?: unknown;
  publishedContent?: unknown;
  createdAt?: string;
  updatedAt?: string;
  folderPlacement?: FolderPlacement | null;
  reads?: Array<unknown>;
  comments?: Array<unknown>;
};

interface DocumentEditorPanelProps {
  documentId: string | null;
  onPublished?: () => void;
  onTitleChange?: (documentId: string, title: string) => void;
}

const countWords = (text: string) => {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
};

const estimateReadMinutes = (text: string) => {
  return Math.max(1, Math.ceil(countWords(text) / 200));
};

const createEditorDocumentUrl = (documentId: string) => {
  return `${window.location.origin}/documents/editor/${documentId}`;
};

const buildLegacyDocumentDescription = (plainText: string) => {
  const clean = plainText.trim().replace(/\s+/g, " ");

  if (!clean) return "Editor document";

  return clean.length > 500 ? `${clean.slice(0, 500)}...` : clean;
};

const isSameEditorDocumentUrl = (
  fileUrl: string | undefined,
  documentId: string,
) => {
  if (!fileUrl) return false;

  const normalized = fileUrl.toLowerCase();
  const lowerId = documentId.toLowerCase();

  return (
    normalized.includes(`/documents/editor/${lowerId}`) ||
    normalized.includes(`app/documents/editor/${lowerId}`)
  );
};

const ensurePublishedDocumentInFileLibrary = async ({
  documentId,
  title,
  description,
}: {
  documentId: string;
  title: string;
  description: string;
}) => {
  const existingDocs = await apiGetDocuments();

  const existed = (existingDocs.items ?? []).some((item) =>
    isSameEditorDocumentUrl(item.fileUrl, documentId),
  );

  if (existed) return;

  await apiSaveDocument({
    name: title.trim() || "Untitled document",
    fileUrl: createEditorDocumentUrl(documentId),
    description: buildLegacyDocumentDescription(description),
  });
};

function SaveIndicator({ status }: { status: SaveStatus }) {
  const { t } = useLocale();

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
        <ClockCircleOutlined />
        {t("document.editor.autosave_pending")}
      </span>
    );
  }

  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted">
        <LoadingOutlined />
        {t("document.editor.saving")}
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <CheckOutlined />
        {t("document.editor.saved")}
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-500">
        <ExclamationCircleOutlined />
        {t("document.editor.save_error")}
      </span>
    );
  }

  return null;
}

function usePanelAutosave({
  documentId,
  title,
  content,
  enabled,
  delayMs = 2500,
}: {
  documentId: string;
  title: string;
  content: DocumentBlockDoc;
  enabled: boolean;
  delayMs?: number;
}) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    if (!enabled) return;

    const timer = window.setTimeout(async () => {
      setSaveStatus("saving");

      try {
        await apiDocAutosave(documentId, title, content);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [content, delayMs, documentId, enabled, title]);

  const forceSave = useCallback(async () => {
    setSaveStatus("saving");

    try {
      await apiDocAutosave(documentId, title, content);
      setSaveStatus("saved");
      return true;
    } catch {
      setSaveStatus("error");
      return false;
    }
  }, [content, documentId, title]);

  return {
    saveStatus,
    setSaveStatus,
    forceSave,
  };
}

function BlockPreview({ value }: { value: DocumentBlockDoc }) {
  const { t } = useLocale();

  if (!value.content.length) {
    return (
      <p className="text-sm italic text-slate-300">
        {t("document.editor.no_content")}
      </p>
    );
  }

  const renderBlock = (block: DocumentBlock) => {
    if (block.type === "heading") {
      const text = block.text || "";

      if (block.level === 1) {
        return (
          <h1 key={block.id} className="mb-4 text-3xl font-bold text-ink">
            {text}
          </h1>
        );
      }

      if (block.level === 2) {
        return (
          <h2 key={block.id} className="mb-3 mt-6 text-2xl font-bold text-ink">
            {text}
          </h2>
        );
      }

      return (
        <h3 key={block.id} className="mb-2 mt-5 text-xl font-semibold text-ink">
          {text}
        </h3>
      );
    }

    if (block.type === "paragraph") {
      return (
        <p
          key={block.id}
          className="mb-4 whitespace-pre-wrap text-base leading-7 text-ink"
        >
          {block.text}
        </p>
      );
    }

    if (block.type === "quote") {
      return (
        <blockquote
          key={block.id}
          className="mb-4 border-l-4 border-brand/40 bg-slate-50 px-4 py-3 text-base italic text-muted"
        >
          {block.text}
        </blockquote>
      );
    }

    if (block.type === "checklist") {
      const items = block.items ?? [];

      return (
        <div key={block.id} className="mb-4 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <span className="mt-0.5 text-brand">
                {item.checked ? "☑" : "☐"}
              </span>
              <span
                className={[
                  "text-base leading-7",
                  item.checked ? "text-muted line-through" : "text-ink",
                ].join(" ")}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (block.type === "image") {
      if (!block.src) return null;

      return (
        <figure
          key={block.id}
          className="mb-5 overflow-hidden rounded-2xl border border-stroke bg-slate-50"
        >
          <img
            src={block.src}
            alt={block.alt || ""}
            className="max-h-[460px] w-full object-contain"
          />

          {block.alt && (
            <figcaption className="border-t border-stroke px-3 py-2 text-center text-xs text-muted">
              {block.alt}
            </figcaption>
          )}
        </figure>
      );
    }

    if (block.type === "divider") {
      return <Divider key={block.id} />;
    }

    return null;
  };

  return (
    <div className="prose prose-slate max-w-none">
      {value.content.map(renderBlock)}
    </div>
  );
}

function EmptyPanel() {
  const { t } = useLocale();

  return (
    <div className="flex h-full min-h-[480px] items-center justify-center bg-slate-50">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="space-y-1">
            <p className="font-medium text-ink">
              {t("document.workspace.empty_select_doc")}
            </p>
            <p className="text-sm text-muted">
              {t("document.workspace.empty_select_doc_desc")}
            </p>
          </div>
        }
      />
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-stroke px-5 py-3">
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      </div>

      <div className="flex-1 p-8">
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    </div>
  );
}

function EditorPanelContent({
  doc,
  onPublished,
  onTitleChange,
}: {
  doc: EditorDocumentDetail;
  onPublished?: () => void;
  onTitleChange?: (documentId: string, title: string) => void;
}) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const permissions = useDocumentPermissions();

  const canEdit = permissions.canEdit;
  const initialTitle = doc.title || t("document.editor.title_default");
  const initialContent = normalizeBlockDoc(
    doc.draftContent ?? doc.publishedContent,
  );

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<DocumentBlockDoc>(initialContent);
  const [editingTitle, setEditingTitle] = useState(false);
  const [mode, setMode] = useState<EditorMode>(canEdit ? "write" : "preview");
  const [isDirty, setIsDirty] = useState(false);

  const plainText = useMemo(() => blockDocToPlainText(content), [content]);
  const wordCount = useMemo(() => countWords(plainText), [plainText]);
  const readMinutes = useMemo(
    () => estimateReadMinutes(plainText),
    [plainText],
  );

  const { saveStatus, setSaveStatus, forceSave } = usePanelAutosave({
    documentId: doc.documentId,
    title,
    content,
    enabled: isDirty && canEdit,
  });

  const invalidateQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["doc-detail", doc.documentId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["doc-folder-tree"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["doc-folder-tree-with-documents"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["file-documents"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["doc-acknowledgments"],
      }),
    ]);
  }, [doc.documentId, queryClient]);

  const saveDraft = useCallback(
    async (showToast = false) => {
      if (!canEdit) return false;

      const ok = await forceSave();

      if (!ok) {
        message.error(t("document.editor.save_error"));
        return false;
      }

      setIsDirty(false);
      setSaveStatus("saved");
      onTitleChange?.(doc.documentId, title);
      await invalidateQueries();

      if (showToast) {
        message.success(t("document.editor.save_success"));
      }

      return true;
    },
    [
      canEdit,
      doc.documentId,
      forceSave,
      invalidateQueries,
      onTitleChange,
      setSaveStatus,
      t,
      title,
    ],
  );

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (isDirty) {
        const ok = await saveDraft(false);
        if (!ok) throw new Error("SAVE_FAILED");
      }

      const result = await apiDocPublish(doc.documentId);

      await ensurePublishedDocumentInFileLibrary({
        documentId: doc.documentId,
        title,
        description: plainText,
      });

      return result;
    },
    onSuccess: async () => {
      setIsDirty(false);
      setSaveStatus("saved");

      await invalidateQueries();

      message.success(t("document.editor.publish_success"));
      onPublished?.();
    },
    onError: () => {
      message.error(t("document.editor.publish_error"));
    },
  });

  const refresh = async () => {
    await invalidateQueries();
    message.success(t("document.editor.refresh_success"));
  };

  const isPublished = Boolean(doc.published);
  const readCount = doc.reads?.length ?? 0;
  const commentCount = doc.comments?.length ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-50">
      <div className="flex items-center gap-2 border-b border-stroke/80 bg-white/90 px-5 py-3 shadow-sm backdrop-blur">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {doc.folderPlacement && (
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
                ...((doc.folderPlacement.path ?? []).map((item) => ({
                  title: <span className="text-muted">{item}</span>,
                })) ?? []),
                {
                  title: (
                    <span className="text-muted">
                      {doc.folderPlacement.folderName}
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
                setIsDirty(true);
                setSaveStatus("pending");
              }}
              onBlur={() => setEditingTitle(false)}
              onPressEnter={() => setEditingTitle(false)}
              className="max-w-md text-base font-bold"
              autoFocus
            />
          ) : (
            <h1
              className={[
                "truncate text-base font-bold leading-tight text-ink",
                canEdit ? "cursor-pointer hover:text-brand" : "",
              ].join(" ")}
              onClick={() => {
                if (canEdit) setEditingTitle(true);
              }}
            >
              {title || t("document.editor.title_default")}

              {canEdit && (
                <EditOutlined className="ml-1.5 text-xs text-slate-300" />
              )}
            </h1>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <Tag color={isPublished ? "green" : "gold"} className="m-0">
            {isPublished
              ? t("document.editor.status.published")
              : t("document.editor.status.draft")}
          </Tag>

          <SaveIndicator status={isDirty ? saveStatus : "idle"} />
        </div>

        <Divider type="vertical" className="mx-0 h-5" />

        <Segmented
          size="small"
          value={mode}
          onChange={(value) => setMode(value as EditorMode)}
          options={[
            {
              label: t("document.editor.mode.write"),
              value: "write",
              icon: <EditOutlined />,
              disabled: !canEdit,
            },
            {
              label: t("document.editor.mode.preview"),
              value: "preview",
              icon: <EyeOutlined />,
            },
          ]}
        />

        <div className="flex shrink-0 items-center gap-1">
          <Tooltip title={t("document.action.refresh")}>
            <Button size="small" icon={<ReloadOutlined />} onClick={refresh} />
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
          {t("document.editor.word_count", { count: String(wordCount) })}
        </span>

        <span className="text-slate-200">·</span>

        <span>
          {t("document.editor.read_time", { min: String(readMinutes) })}
        </span>

        {readCount > 0 && (
          <>
            <span className="text-slate-200">·</span>
            <span className="inline-flex items-center gap-1">
              <EyeOutlined />
              {t("document.editor.reads", { count: String(readCount) })}
            </span>
          </>
        )}

        {commentCount > 0 && (
          <>
            <span className="text-slate-200">·</span>
            <Badge count={commentCount} size="small" color="blue" />
          </>
        )}

        <span className="ml-auto hidden items-center gap-1 md:inline-flex">
          <FolderOutlined />
          {doc.folderPlacement?.folderName ||
            t("document.editor.info.no_folder")}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-stroke bg-white shadow-sm">
            <div className="border-b border-stroke bg-slate-50 px-6 py-4 sm:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                    {t("document.editor.workspace_label")}
                  </p>

                  <p className="mt-1 text-sm text-muted">
                    {mode === "preview"
                      ? t("document.editor.workspace_preview_desc")
                      : t("document.editor.workspace_write_desc")}
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

            <div className="min-h-[520px] p-6 sm:p-8">
              {mode === "preview" ? (
                <BlockPreview value={content} />
              ) : (
                <DocumentBlockEditor
                  value={content}
                  readOnly={!canEdit}
                  onUploadImage={async (file) => {
                    const formData = new FormData();

                    formData.append("file", file);
                    formData.append("fileName", file.name);
                    formData.append("mediaKind", "FILE");

                    const uploaded = await apiUploadDocumentAttachment(
                      doc.documentId,
                      formData,
                    );

                    const attachmentList = await apiDocAttachmentList(
                      doc.documentId,
                    );

                    const items = attachmentList?.items ?? [];

                    const uploadedAttachment =
                      items.find(
                        (item) =>
                          item.documentAttachmentId ===
                          uploaded.documentAttachmentId,
                      ) ??
                      [...items]
                        .reverse()
                        .find((item) => item.fileName === file.name) ??
                      items[items.length - 1];

                    const imageUrl = uploadedAttachment?.fileUrl;

                    if (!imageUrl) {
                      throw new Error(t("document.block.image.upload_error"));
                    }

                    return {
                      secureUrl: imageUrl,
                      originalFilename:
                        uploadedAttachment?.fileName || file.name,
                    };
                  }}
                  onChange={(nextValue) => {
                    setContent(nextValue);
                    setIsDirty(true);
                    setSaveStatus("pending");
                  }}
                />
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-stroke bg-white px-4 py-3 shadow-sm">
              <p className="flex items-center gap-1 text-xs font-semibold text-muted">
                <InfoCircleOutlined />
                {t("document.editor.info.created")}
              </p>
              <p className="mt-1 text-sm text-ink">
                {doc.createdAt
                  ? dayjs(doc.createdAt).format("DD/MM/YYYY HH:mm")
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-stroke bg-white px-4 py-3 shadow-sm">
              <p className="flex items-center gap-1 text-xs font-semibold text-muted">
                <ClockCircleOutlined />
                {t("document.editor.info.modified")}
              </p>
              <p className="mt-1 text-sm text-ink">
                {doc.updatedAt
                  ? dayjs(doc.updatedAt).format("DD/MM/YYYY HH:mm")
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-stroke bg-white px-4 py-3 shadow-sm">
              <p className="flex items-center gap-1 text-xs font-semibold text-muted">
                <FileTextOutlined />
                {t("document.editor.section.stats")}
              </p>
              <p className="mt-1 text-sm text-ink">
                {wordCount} {t("document.editor.word_unit")} · {readMinutes}
                {t("document.editor.minute_suffix")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocumentEditorPanel({
  documentId,
  onPublished,
  onTitleChange,
}: DocumentEditorPanelProps) {
  const { t } = useLocale();

  const { data: doc, isLoading } = useQuery({
    queryKey: ["doc-detail", documentId],
    queryFn: () =>
      apiDocDetail({
        documentId: documentId!,
        include: "activity",
      }) as Promise<EditorDocumentDetail>,
    enabled: Boolean(documentId),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!documentId) return;

    apiDocMarkRead(documentId).catch(() => undefined);
  }, [documentId]);

  if (!documentId) {
    return <EmptyPanel />;
  }

  if (isLoading) {
    return <LoadingPanel />;
  }

  if (!doc) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("document.editor.not_found")}
        />
      </div>
    );
  }

  return (
    <EditorPanelContent
      key={doc.documentId}
      doc={doc}
      onPublished={onPublished}
      onTitleChange={onTitleChange}
    />
  );
}