import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Drawer,
  Skeleton,
  Tag,
  Tooltip,
  message,
  Input,
  Divider,
  Spin,
  Badge,
  Breadcrumb,
  Segmented,
} from "antd";
import {
  ArrowLeftOutlined,
  HistoryOutlined,
  CommentOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  EditOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SendOutlined,
  ReloadOutlined,
  LoadingOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  FolderOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import {
  apiDocDetail,
  apiDocAutosave,
  apiDocPublish,
  apiDocVersionList,
  apiDocVersionGet,
  apiDocCommentTree,
  apiDocCommentAdd,
  apiDocCommentDelete,
  apiDocMarkRead,
} from "@/api/document/editor.api";
import {
  tiptapDocToText,
  textToTiptapDoc,
} from "@/interface/document/editor";
import type { DocCommentTreeNode, DocVersionItem } from "@/interface/document/editor";

dayjs.extend(relativeTime);

// ── Helpers ────────────────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function estimateReadMinutes(text: string): number {
  return Math.max(1, Math.ceil(countWords(text) / 200));
}

// ── Autosave hook ──────────────────────────────────────────────────────────────

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

function useAutosave(
  documentId: string | undefined,
  title: string,
  content: unknown,
  enabled: boolean,
  delayMs = 3000,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const titleRef = useRef(title);
  titleRef.current = title;
  const contentRef = useRef(content);
  contentRef.current = content;

  const saveFn = useCallback(
    async () => {
      if (!documentId) return;
      setSaveStatus("saving");
      try {
        await apiDocAutosave(documentId, titleRef.current, contentRef.current);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    },
    [documentId],
  );

  useEffect(() => {
    if (!enabled || !documentId) return;
    setSaveStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveFn(), delayMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, title, documentId, enabled]);

  const forceSave = useCallback(() => saveFn(), [saveFn]);

  return { saveStatus, setSaveStatus, forceSave };
}

// ── Save indicator ─────────────────────────────────────────────────────────────

function SaveIndicator({ status }: { status: SaveStatus }) {
  const { t } = useLocale();
  if (status === "pending" || status === "saving") return (
    <span className="flex items-center gap-1 text-xs text-muted">
      <LoadingOutlined className="animate-spin" /> {t("document.editor.saving")}
    </span>
  );
  if (status === "saved") return (
    <span className="flex items-center gap-1 text-xs text-green-600">
      <CheckOutlined /> {t("document.editor.saved")}
    </span>
  );
  if (status === "error") return (
    <span className="flex items-center gap-1 text-xs text-red-500">
      <ExclamationCircleOutlined /> {t("document.editor.save_error")}
    </span>
  );
  return null;
}

// ── Preview renderer ───────────────────────────────────────────────────────────

function PreviewPane({ text, placeholder }: { text: string; placeholder: string }) {
  if (!text.trim()) {
    return (
      <p className="text-sm italic text-slate-300">{placeholder}</p>
    );
  }
  return (
    <div className="prose prose-slate max-w-none text-base leading-relaxed text-ink">
      {text.split("\n\n").map((para, i) => (
        para.trim() ? (
          <p key={i} className="mb-4 whitespace-pre-wrap">{para}</p>
        ) : null
      ))}
    </div>
  );
}

// ── Comment node ──────────────────────────────────────────────────────────────

function CommentNode({
  node,
  currentUserId,
  depth = 0,
  onDelete,
  onReply,
}: {
  node: DocCommentTreeNode;
  currentUserId: string;
  depth?: number;
  onDelete: (commentId: string) => void;
  onReply: (parentCommentId: string) => void;
}) {
  const { t } = useLocale();
  const isOwn = node.authorUserId === currentUserId;

  return (
    <div style={{ marginLeft: depth * 14 }}>
      <div className={`rounded-xl p-3 ${depth === 0 ? "bg-slate-50" : "border border-stroke bg-white"}`}>
        <div className="mb-1.5 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
            <UserOutlined />
          </div>
          <span className="text-xs font-semibold text-ink">
            {node.authorUserId.slice(0, 8)}…
          </span>
          <span className="ml-auto shrink-0 text-xs text-muted">
            {dayjs(node.createdAt).fromNow()}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{node.body}</p>
        <div className="mt-2 flex items-center gap-3">
          {depth < 3 && (
            <button
              className="text-xs font-medium text-brand hover:underline"
              onClick={() => onReply(node.commentId)}>
              {t("document.editor.comment.reply")}
            </button>
          )}
          {isOwn && (
            <button
              className="text-xs text-red-500 hover:underline"
              onClick={() => onDelete(node.commentId)}>
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
            depth={depth + 1}
            onDelete={onDelete}
            onReply={onReply}
          />
        ))}
      </div>
    </div>
  );
}

// ── Comments panel ────────────────────────────────────────────────────────────

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
  const currentUser = useUserStore((s) => s.currentUser);
  const currentUserId = currentUser?.userId ?? "";

  const { data: tree, isLoading } = useQuery({
    queryKey: ["doc-comments-tree", documentId],
    queryFn: () => apiDocCommentTree(documentId),
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: ({ body: b, parentId }: { body: string; parentId?: string }) =>
      apiDocCommentAdd(documentId, b, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-comments-tree", documentId] });
      setBody("");
      setReplyTo(null);
    },
    onError: () => message.error(t("document.editor.comment.add_error")),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => apiDocCommentDelete(commentId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["doc-comments-tree", documentId] }),
    onError: () => message.error(t("document.editor.comment.delete_error")),
  });

  const roots = tree?.roots ?? [];
  const countAll = (n: DocCommentTreeNode): number =>
    1 + n.children.reduce((s, c) => s + countAll(c), 0);
  const totalComments = roots.reduce((acc, r) => acc + countAll(r), 0);

  const submit = () => {
    if (!body.trim()) return;
    addMutation.mutate({ body: body.trim(), parentId: replyTo ?? undefined });
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
      styles={{ body: { padding: 16, display: "flex", flexDirection: "column", gap: 12 } }}>

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
              onDelete={(id) => deleteMutation.mutate(id)}
              onReply={(parentId) => setReplyTo(parentId)}
            />
          ))}
        </div>
      )}

      <Divider className="my-0" />

      {replyTo && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
          <span className="flex-1 truncate">{t("document.editor.replying_to")}</span>
          <button className="shrink-0 hover:underline" onClick={() => setReplyTo(null)}>
            {t("document.editor.comment.cancel_reply")}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <Input.TextArea
          placeholder={replyTo
            ? t("document.editor.comment.reply_placeholder")
            : t("document.editor.comment.placeholder")}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
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
      <p className="text-xs text-muted">{t("document.editor.comment.submit_hint")}</p>
    </Drawer>
  );
}

// ── Version history drawer ─────────────────────────────────────────────────────

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
    enabled: !!selectedId,
  });

  const versions = versionList?.versions ?? [];

  return (
    <Drawer
      title={
        <span className="flex items-center gap-2">
          <HistoryOutlined /> {t("document.editor.versions")}
        </span>
      }
      open={open}
      onClose={onClose}
      width={480}
      styles={{ body: { padding: 0 } }}>
      <div className="flex h-full">
        <div className="flex w-48 shrink-0 flex-col overflow-y-auto border-r border-stroke bg-slate-50 p-3">
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : versions.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted">
              {t("document.editor.version.empty")}
            </p>
          ) : (
            versions.map((v: DocVersionItem) => (
              <button
                key={v.versionId}
                className={`mb-1 rounded-xl px-3 py-2.5 text-left transition ${
                  selectedId === v.versionId
                    ? "bg-brand text-white"
                    : "bg-white hover:bg-slate-100"
                }`}
                onClick={() => setSelectedId(v.versionId)}>
                <div className="text-sm font-semibold">v{v.versionNumber}</div>
                <div className={`mt-0.5 text-xs ${selectedId === v.versionId ? "text-white/70" : "text-muted"}`}>
                  {dayjs(v.publishedAt).format("DD/MM HH:mm")}
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
          {loadingDetail && <div className="flex justify-center py-8"><Spin /></div>}
          {versionDetail && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-base font-semibold text-ink">v{versionDetail.versionNumber}</span>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => { onRestore(versionDetail.content); onClose(); }}>
                  {t("document.editor.version.restore")}
                </Button>
              </div>
              <Divider className="my-2" />
              <div className="flex-1 overflow-y-auto rounded-xl bg-slate-50 p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">
                  {tiptapDocToText(versionDetail.content)}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ── Info panel ────────────────────────────────────────────────────────────────

function InfoPanel({
  doc,
  wordCount,
  readMinutes,
}: {
  doc: Record<string, unknown>;
  wordCount: number;
  readMinutes: number;
}) {
  const { t } = useLocale();

  const reads: Array<{ userId: string; readAt: string }> = (doc.reads as Array<{ userId: string; readAt: string }>) ?? [];

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-stroke bg-slate-50">
      {/* Header */}
      <div className="border-b border-stroke px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          <InfoCircleOutlined />
          {t("document.editor.info_panel")}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-0 divide-y divide-stroke">
        {/* Writing stats */}
        <div className="px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-muted">Thống kê</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
              <p className="text-xs text-muted">{t("document.editor.word_count", { count: "" }).replace("{count} ", "")}</p>
              <p className="text-lg font-bold text-ink">{wordCount}</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
              <p className="text-xs text-muted">Thời gian đọc</p>
              <p className="text-lg font-bold text-ink">{readMinutes}<span className="text-xs font-normal text-muted"> phút</span></p>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-3 px-4 py-3">
          <p className="text-xs font-semibold text-muted">Thông tin</p>

          <div className="flex items-start gap-2 text-xs">
            <ClockCircleOutlined className="mt-0.5 shrink-0 text-muted" />
            <div>
              <p className="font-medium text-ink">{t("document.editor.info.created")}</p>
              <p className="text-muted">
                {doc.createdAt ? dayjs(doc.createdAt as string).format("DD/MM/YYYY HH:mm") : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs">
            <EditOutlined className="mt-0.5 shrink-0 text-muted" />
            <div>
              <p className="font-medium text-ink">{t("document.editor.info.modified")}</p>
              <p className="text-muted">
                {doc.updatedAt ? dayjs(doc.updatedAt as string).fromNow() : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs">
            <FolderOutlined className="mt-0.5 shrink-0 text-muted" />
            <div>
              <p className="font-medium text-ink">{t("document.editor.info.folder")}</p>
              <p className="text-muted">
                {doc.folderPlacement
                  ? (doc.folderPlacement as { folderName: string }).folderName
                  : t("document.editor.info.no_folder")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs">
            <TeamOutlined className="mt-0.5 shrink-0 text-muted" />
            <div>
              <p className="font-medium text-ink">{t("document.editor.info.access")}</p>
              <p className="text-muted">{t("document.editor.info.access.open")}</p>
            </div>
          </div>
        </div>

        {/* Readers */}
        <div className="px-4 py-3">
          <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted">
            <EyeOutlined />
            {t("document.editor.readers")}
            {reads.length > 0 && (
              <span className="ml-1 rounded-full bg-brand/10 px-1.5 text-brand">{reads.length}</span>
            )}
          </p>

          {reads.length === 0 ? (
            <p className="text-xs italic text-slate-300">{t("document.editor.readers.empty")}</p>
          ) : (
            <div className="space-y-1.5">
              {reads.slice(0, 20).map((r, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs text-brand">
                    <UserOutlined />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">{r.userId.slice(0, 8)}…</p>
                    <p className="text-xs text-muted">{dayjs(r.readAt).fromNow()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ── Main DocumentEditor ────────────────────────────────────────────────────────

const DocumentEditor = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);
  const canEdit = (currentUser?.roles ?? []).some((r) =>
    ["HR", "MANAGER", "ADMIN", "EMPLOYEE"].includes(r),
  );

  const [title, setTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [mode, setMode] = useState<"write" | "preview">("write");

  const wordCount = useMemo(() => countWords(textContent), [textContent]);
  const readMinutes = useMemo(() => estimateReadMinutes(textContent), [textContent]);

  // ── Load document detail
  // refetchOnWindowFocus: false — prevents background refetch from resetting user's in-progress edits
  const { data: doc, isLoading } = useQuery({
    queryKey: ["doc-detail", documentId],
    queryFn: () => apiDocDetail(documentId!),
    enabled: !!documentId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // initializedDocIdRef — only initialize editor content once per document.
  // Without this guard, every re-render (caused by setSaveStatus etc.) would re-run
  // the effect because `t` from useLocale() is a new function reference each render,
  // which would reset the textarea content while the user is typing.
  const initializedDocIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!doc) return;
    if (initializedDocIdRef.current === doc.documentId) return;
    initializedDocIdRef.current = doc.documentId;
    setTitle(doc.title || t("document.editor.title_default"));
    const raw = doc.draftContent ?? doc.publishedContent;
    setTextContent(raw ? tiptapDocToText(raw) : "");
    setIsDirty(false);
    // t intentionally excluded — new reference each render, must not trigger reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  useEffect(() => {
    if (documentId && doc) apiDocMarkRead(documentId).catch(() => {});
  }, [documentId, doc]);

  const tiptapContent = useMemo(() => textToTiptapDoc(textContent), [textContent]);

  const { saveStatus, setSaveStatus, forceSave } = useAutosave(
    documentId,
    title,
    tiptapContent,
    isDirty && canEdit,
  );

  // ── Ctrl+S shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (!isDirty || !canEdit) return;
        forceSave()
          .then(() => {
            setIsDirty(false);
            setSaveStatus("saved");
          })
          .catch(() => setSaveStatus("error"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, canEdit, forceSave, setSaveStatus]);

  // ── Publish
  const publishMutation = useMutation({
    mutationFn: () => apiDocPublish(documentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-detail", documentId] });
      queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });
      message.success(t("document.editor.publish_success"));
      setIsDirty(false);
    },
    onError: () => message.error(t("document.editor.publish_error")),
  });

  const handleRestore = (content: unknown) => {
    setTextContent(tiptapDocToText(content));
    setIsDirty(true);
    message.success(t("document.editor.restore_success"));
  };

  // ── Loading / error states
  if (isLoading) {
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

  if (!doc) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-12">
        <p className="text-muted">{t("document.editor.not_found")}</p>
        <Button onClick={() => navigate("/documents")}>{t("document.editor.back")}</Button>
      </div>
    );
  }

  const commentCount = doc.comments?.length ?? 0;
  const readCount = doc.reads?.length ?? 0;
  const isPublished = doc.published;
  const docAsRecord = doc as unknown as Record<string, unknown>;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Unsaved changes banner ──────────────────────────────────── */}
      {isDirty && saveStatus === "idle" && (
        <div className="flex items-center gap-3 bg-amber-50 px-5 py-2 text-xs text-amber-700 border-b border-amber-200">
          <ExclamationCircleOutlined />
          <span>{t("document.editor.unsaved_changes")}</span>
        </div>
      )}

      {/* ── Top toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-stroke bg-white px-5 py-2.5 shadow-sm">
        {/* Back */}
        <Tooltip title={t("document.editor.back")}>
          <Button
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/documents")}
          />
        </Tooltip>

        <Divider type="vertical" className="mx-0 h-5" />

        {/* Breadcrumb + title */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {doc.folderPlacement && (
            <Breadcrumb
              className="text-xs"
              items={[
                { title: <span className="text-muted">Tài liệu</span> },
                ...doc.folderPlacement.path.map((p: string) => ({ title: p })),
                { title: <span className="text-muted">{doc.folderPlacement.folderName}</span> },
              ]}
            />
          )}
          {editingTitle && canEdit ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onPressEnter={() => setEditingTitle(false)}
              className="max-w-sm text-base font-bold"
              autoFocus
            />
          ) : (
            <h1
              className={`text-base font-bold text-ink leading-tight ${canEdit ? "cursor-pointer hover:text-brand" : ""}`}
              onClick={() => canEdit && setEditingTitle(true)}>
              {title || t("document.editor.title_default")}
              {canEdit && <EditOutlined className="ml-1.5 text-xs text-slate-300" />}
            </h1>
          )}
        </div>

        {/* Status + save indicator */}
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Tag color={isPublished ? "green" : "gold"} className="m-0">
            {isPublished ? t("document.editor.status.published") : t("document.editor.status.draft")}
          </Tag>
          <SaveIndicator status={isDirty ? saveStatus : "idle"} />
        </div>

        <Divider type="vertical" className="mx-0 h-5" />

        {/* Write / Preview toggle */}
        {canEdit && (
          <Segmented
            size="small"
            value={mode}
            onChange={(v) => setMode(v as "write" | "preview")}
            options={[
              { label: t("document.editor.mode.write"), value: "write", icon: <EditOutlined /> },
              { label: t("document.editor.mode.preview"), value: "preview", icon: <EyeOutlined /> },
            ]}
          />
        )}

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip title={t("document.editor.versions")}>
            <Button size="small" icon={<HistoryOutlined />} onClick={() => setShowVersions(true)} />
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
              onClick={() => setShowInfo((v) => !v)}
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
                    forceSave()
                      .then(() => {
                        setIsDirty(false);
                        setSaveStatus("saved");
                        message.success(t("document.editor.save_success"));
                      })
                      .catch(() => {
                        setSaveStatus("error");
                        message.error(t("document.editor.save_error"));
                      });
                  }}
                />
              </Tooltip>

              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={publishMutation.isPending}
                onClick={() => publishMutation.mutate()}>
                {t("document.editor.publish")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Meta strip ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-b border-stroke bg-white px-6 py-1.5 text-xs text-muted">
        <span>{t("document.editor.word_count", { count: String(wordCount) })}</span>
        <span className="text-slate-200">·</span>
        <span>{t("document.editor.read_time", { min: String(readMinutes) })}</span>
        {readCount > 0 && (
          <>
            <span className="text-slate-200">·</span>
            <span className="flex items-center gap-1">
              <EyeOutlined />
              {t("document.editor.reads", { count: String(readCount) })}
            </span>
          </>
        )}
        {doc.activity?.length > 0 && (
          <span className="ml-auto">
            {doc.activity.length} {t("document.editor.activity")}
          </span>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Editor / Preview area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-8 py-10">
              {mode === "preview" ? (
                <PreviewPane
                  text={textContent}
                  placeholder={t("document.editor.no_content")}
                />
              ) : (
                <textarea
                  className="w-full resize-none bg-transparent font-sans text-base leading-relaxed text-ink outline-none placeholder:text-slate-300"
                  style={{ minHeight: "calc(100vh - 200px)" }}
                  value={textContent}
                  onChange={(e) => { setTextContent(e.target.value); setIsDirty(true); }}
                  placeholder={canEdit ? t("document.editor.placeholder") : ""}
                  readOnly={!canEdit}
                />
              )}
            </div>
          </div>
        </div>

        {/* Info panel */}
        {showInfo && (
          <InfoPanel
            doc={docAsRecord}
            wordCount={wordCount}
            readMinutes={readMinutes}
          />
        )}
      </div>

      {/* ── Drawers ────────────────────────────────────────────────────── */}
      {documentId && (
        <>
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
        </>
      )}
    </div>
  );
};

export default DocumentEditor;
