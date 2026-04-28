import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Divider,
  Empty,
  Popconfirm,
  Select,
  Skeleton,
  Tag,
  Tabs,
  Tooltip,
  Upload,
  message,
} from "antd";
import {
  PaperClipOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileTextOutlined,
  FilePptOutlined,
  FileExcelOutlined,
  FileOutlined,
  SafetyOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import {
  apiGetDocuments,
  apiListAcknowledgments,
  apiAcknowledgeDocument,
  apiUploadDocumentAttachment,
} from "@/api/document/document.api";
import {
  apiDocLinkList,
  apiDocLinkAdd,
  apiDocLinkRemove,
  apiDocAttachmentList,
  apiDocAttachmentRemove,
  apiDocList,
} from "@/api/document/editor.api";
import type { DocumentItem } from "@/interface/document";
import type {
  DocLinkItem,
  DocAttachmentItem,
} from "@/interface/document/editor";
import DocAccessRulesPanel from "./components/DocAccessRulesPanel";
import DocReadListPanel from "./components/DocReadListPanel";
import { useDocumentPermissions } from "./hooks/useDocumentPermissions";

// ── helpers ──────────────────────────────────────────────────────────────────

function getFileExt(url?: string): string {
  if (!url) return "";
  const clean = url.split("?")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.substring(dot + 1).toLowerCase() : "";
}

const EXT_COLOR: Record<string, string> = {
  pdf: "#ef4444",
  doc: "#2563eb",
  docx: "#2563eb",
  ppt: "#f97316",
  pptx: "#f97316",
  xls: "#16a34a",
  xlsx: "#16a34a",
  txt: "#94a3b8",
  md: "#94a3b8",
};

function getExtColor(url?: string): string {
  return EXT_COLOR[getFileExt(url)] ?? "#94a3b8";
}

function FileIconLarge({ url }: { url?: string }) {
  const ext = getFileExt(url);
  const cls = "text-5xl";
  if (ext === "pdf")
    return <FilePdfOutlined className={`${cls} text-red-500`} />;
  if (["doc", "docx"].includes(ext))
    return <FileWordOutlined className={`${cls} text-blue-600`} />;
  if (["ppt", "pptx"].includes(ext))
    return <FilePptOutlined className={`${cls} text-orange-500`} />;
  if (["xls", "xlsx"].includes(ext))
    return <FileExcelOutlined className={`${cls} text-green-600`} />;
  if (["txt", "md"].includes(ext))
    return <FileTextOutlined className={`${cls} text-slate-500`} />;
  return <FileOutlined className={`${cls} text-slate-400`} />;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "green",
  INACTIVE: "default",
  DRAFT: "gold",
};

// ── Query ─────────────────────────────────────────────────────────────────────

const useDocumentDetail = (documentId?: string) =>
  useQuery({
    queryKey: ["file-documents", documentId],
    queryFn: () => apiGetDocuments(),
    select: (res) =>
      res.items.find((d: DocumentItem) => d.documentId === documentId) ?? null,
    enabled: Boolean(documentId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

// ── Preview ───────────────────────────────────────────────────────────────────

function DocumentPreview({ doc }: { doc: DocumentItem }) {
  const { t } = useLocale();
  const ext = getFileExt(doc.fileUrl);
  const accentColor = getExtColor(doc.fileUrl);

  if (!doc.fileUrl) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-stroke bg-slate-50">
        <FileOutlined className="text-4xl text-slate-300" />
        <p className="mt-3 text-sm text-muted">
          {t("document.detail.no_preview")}
        </p>
      </div>
    );
  }

  if (ext === "pdf") {
    return (
      <iframe
        src={doc.fileUrl}
        title={doc.name}
        className="h-[560px] w-full rounded-xl border border-stroke"
      />
    );
  }

  // Non-PDF: download card
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-stroke bg-slate-50 py-16">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${accentColor}18` }}
      >
        <FileIconLarge url={doc.fileUrl} />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-ink">{doc.name}</p>
        <p className="mt-1 text-sm text-muted">
          {t("document.detail.preview_unavailable")}
        </p>
      </div>
      <a
        href={doc.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brandDark"
      >
        <DownloadOutlined />
        {t("document.action.download")} ({ext.toUpperCase()})
      </a>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const DocumentDetail = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { documentId } = useParams();
  const permissions = useDocumentPermissions();
  const {
    data: doc,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useDocumentDetail(documentId);

  const accentColor = getExtColor(doc?.fileUrl);
  const ext = getFileExt(doc?.fileUrl);

  // ─── Acknowledgment (EMPLOYEE only) ───────────────────────────────────────
  const queryClient = useQueryClient();
  const { data: ackData } = useQuery({
    queryKey: ["doc-acknowledgments"],
    queryFn: apiListAcknowledgments,
    enabled: permissions.canAcknowledge,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
  const isAcknowledged =
    ackData?.items.some((a) => a.documentId === documentId) ?? false;
  const ackMutation = useMutation({
    mutationFn: () => apiAcknowledgeDocument(documentId!),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["doc-acknowledgments"] }),
  });

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton.Button active className="h-8 w-48" />
        <Card className="border border-stroke shadow-sm">
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="border border-stroke shadow-sm">
              <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
          </div>
          <Card className="border border-stroke shadow-sm">
            <Skeleton active paragraph={{ rows: 5 }} />
          </Card>
        </div>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <Card className="border border-stroke shadow-sm">
        <p className="text-sm text-muted">
          {t("document.error.something_wrong")}{" "}
          <button
            className="font-semibold text-brand hover:underline"
            onClick={() => refetch()}
          >
            {t("document.error.retry")}
          </button>
        </p>
      </Card>
    );
  }

  // ─── Not found ─────────────────────────────────────────────────────────────
  if (!doc) {
    return (
      <Card className="border border-stroke shadow-sm">
        <div className="flex flex-col items-center py-12 text-center">
          <FileOutlined className="text-5xl text-slate-300" />
          <p className="mt-4 text-base font-semibold text-ink">
            {t("document.detail.not_found")}
          </p>
          <button
            onClick={() => navigate("/documents")}
            className="mt-4 text-sm font-medium text-brand hover:underline"
          >
            {t("document.detail.back_to_list")}
          </button>
        </div>
      </Card>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={() => navigate("/documents")}
        className="flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeftOutlined />
        {t("document.detail.back_to_list")}
      </button>

      {/* Header card */}
      <Card
        className="overflow-hidden border border-stroke bg-white shadow-sm"
        bodyStyle={{ padding: 0 }}
      >
        {/* Accent top bar */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: accentColor }}
        />
        <div className="flex flex-wrap items-start gap-4 p-4 sm:p-5">
          {/* File icon */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            <FileIconLarge url={doc.fileUrl} />
          </div>

          {/* Name + description + badges */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-ink">{doc.name}</h1>
              {ext && (
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-bold uppercase text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {ext}
                </span>
              )}
              {doc.status && (
                <Tag
                  color={STATUS_COLOR[doc.status] ?? "default"}
                  className="m-0"
                >
                  {doc.status}
                </Tag>
              )}
            </div>
            {doc.description ? (
              <p className="mt-1.5 text-sm text-muted">{doc.description}</p>
            ) : (
              <p className="mt-1.5 text-sm italic text-slate-300">
                {t("document.empty.no_description")}
              </p>
            )}
          </div>

          {/* Download + Refresh buttons */}
          <div className="flex shrink-0 items-center gap-2">
            {isFetching && !isLoading && (
              <SyncOutlined spin className="text-sm text-brand" />
            )}
            {doc.fileUrl && (
              <Tooltip title={t("document.action.download")}>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-stroke px-4 py-2 text-sm font-medium text-muted transition hover:border-slate-400 hover:text-ink"
                >
                  <DownloadOutlined />
                  {t("document.action.download")}
                </a>
              </Tooltip>
            )}
            <Tooltip title={t("document.action.refresh")}>
              <Button
                icon={<ReloadOutlined />}
                size="small"
                loading={isFetching && !isLoading}
                onClick={() => refetch()}
              />
            </Tooltip>
          </div>
        </div>
      </Card>

      {/* Body: Tabbed content + Sidebar */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Tabbed area (2/3) */}
        <div className="lg:col-span-2">
          <Card
            className="border border-stroke bg-white shadow-sm"
            bodyStyle={{ padding: 0 }}
          >
            <Tabs
              defaultActiveKey="preview"
              className="px-4"
              items={[
                {
                  key: "preview",
                  label: t("document.detail.tab.preview"),
                  children: (
                    <div className="pb-4">
                      <div className="mb-4">
                        <span className="text-xs text-muted">
                          {ext
                            ? ext === "pdf"
                              ? t("document.detail.inline_preview")
                              : t("document.detail.download_to_view")
                            : ""}
                        </span>
                      </div>
                      <DocumentPreview doc={doc} />
                    </div>
                  ),
                },
                ...(permissions.canViewStats
                  ? [
                      {
                        key: "reads",
                        label: t("document.detail.tab.reads"),
                        children: (
                          <div className="pb-4">
                            <DocReadListPanel documentId={doc.documentId} />
                          </div>
                        ),
                      },
                    ]
                  : []),
                ...(permissions.canEdit
                  ? [
                      {
                        key: "links",
                        label: t("document.detail.tab.links"),
                        children: (
                          <DocLinksTab
                            documentId={doc.documentId}
                            canEdit={permissions.canEdit}
                          />
                        ),
                      },
                      {
                        key: "attachments",
                        label: t("document.detail.tab.attachments"),
                        children: (
                          <DocAttachmentsTab
                            documentId={doc.documentId}
                            canEdit={permissions.canEdit}
                            canUpload={permissions.canCreate}
                          />
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </Card>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-4">
          {/* File info */}
          <Card className="border border-stroke bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <InfoCircleOutlined className="text-base text-brand" />
              <h2 className="text-base font-semibold text-ink">
                {t("document.detail.subtitle")}
              </h2>
            </div>
            <Divider className="my-3" />
            <div className="space-y-3">
              <InfoRow
                label={t("document.field.name")}
                value={
                  <span className="text-sm font-medium text-ink">
                    {doc.name}
                  </span>
                }
              />
              <InfoRow
                label={t("document.detail.file_type")}
                value={
                  ext ? (
                    <span
                      className="rounded-md px-2 py-0.5 text-xs font-bold uppercase text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      {ext}
                    </span>
                  ) : (
                    <span className="text-sm text-muted">—</span>
                  )
                }
              />
              <InfoRow
                label="Status"
                value={
                  doc.status ? (
                    <Tag
                      color={STATUS_COLOR[doc.status] ?? "default"}
                      className="m-0 text-xs"
                    >
                      {doc.status}
                    </Tag>
                  ) : (
                    <span className="text-sm text-muted">—</span>
                  )
                }
              />
              <InfoRow
                label={t("document.field.description")}
                value={
                  doc.description ? (
                    <span className="text-right text-sm text-ink">
                      {doc.description}
                    </span>
                  ) : (
                    <span className="text-sm italic text-slate-300">
                      {t("document.empty.no_description")}
                    </span>
                  )
                }
              />
            </div>
          </Card>

          {/* Access & visibility */}
          <Card className="border border-stroke bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <SafetyOutlined className="text-base text-muted" />
              <h2 className="text-base font-semibold text-ink">
                {t("document.detail.access")}
              </h2>
            </div>
            <Divider className="my-3" />
            <div className="space-y-3">
              <InfoRow
                label={t("document.detail.visibility")}
                value={
                  <span className="text-sm font-medium text-ink">
                    {t("document.detail.visibility_tenant")}
                  </span>
                }
              />
              <InfoRow
                label="ID"
                value={
                  <Tooltip title={doc.documentId}>
                    <span className="cursor-default font-mono text-xs text-muted">
                      {doc.documentId.slice(0, 8)}…
                    </span>
                  </Tooltip>
                }
              />
              {doc.documentCategoryId && (
                <InfoRow
                  label={t("document.field.category")}
                  value={
                    <span className="flex items-center gap-1 text-sm text-ink">
                      <FolderOutlined className="text-amber-500" />
                      {doc.documentCategoryId}
                    </span>
                  }
                />
              )}
            </div>
          </Card>

          {/* File URL */}
          {doc.fileUrl && (
            <Card className="border border-stroke bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <LinkOutlined className="text-base text-muted" />
                <h2 className="text-base font-semibold text-ink">
                  {t("document.field.file_url")}
                </h2>
              </div>
              <Divider className="my-3" />
              <Tooltip title={doc.fileUrl}>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 break-all text-xs text-brand hover:underline"
                >
                  <DownloadOutlined className="shrink-0" />
                  <span className="line-clamp-3">{doc.fileUrl}</span>
                </a>
              </Tooltip>
            </Card>
          )}

          {/* Version info */}
          <Card className="border border-stroke bg-white shadow-sm">
            <h2 className="text-base font-semibold text-ink">
              {t("document.detail.versions")}
            </h2>
            <Divider className="my-3" />
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  v1
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink">
                    {t("document.detail.version_latest")}
                  </p>
                  <p className="text-xs text-muted">
                    {t("document.detail.version_current")}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Acknowledgment — EMPLOYEE only */}
          {permissions.canAcknowledge && (
            <Card className="border border-stroke bg-white shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircleOutlined
                  className={`text-base ${
                    isAcknowledged ? "text-green-500" : "text-muted"
                  }`}
                />
                <h2 className="text-base font-semibold text-ink">
                  {t("document.detail.progress_title")}
                </h2>
              </div>
              <Divider className="my-3" />
              {isAcknowledged ? (
                <div className="flex flex-col gap-2">
                  <Tag color="green" className="w-fit">
                    {t("document.ack.status.acknowledged")}
                  </Tag>
                  <p className="text-xs text-muted">
                    {t("document.detail.ack_done_desc")}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-muted">
                    {t("document.detail.ack_description")}
                  </p>
                  <Button
                    type="primary"
                    size="small"
                    loading={ackMutation.isPending}
                    onClick={() => ackMutation.mutate()}
                  >
                    {t("document.action.acknowledge")}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Access Rules — visible to ADMIN, HR, MANAGER */}
          {permissions.canViewAccessRules && documentId && (
            <Card className="border border-stroke bg-white shadow-sm">
              <DocAccessRulesPanel
                documentId={documentId}
                canManage={permissions.canManageAccessRules}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Helper components ─────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted">{label}</span>
      <div>{value}</div>
    </div>
  );
}

function DocLinksTab({
  documentId,
  canEdit,
}: {
  documentId: string;
  canEdit: boolean;
}) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [targetId, setTargetId] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["doc-links", documentId],
    queryFn: () => apiDocLinkList(documentId),
    staleTime: 30_000,
  });

  const { data: docList } = useQuery({
    queryKey: ["doc-list", {}],
    queryFn: () => apiDocList(),
    staleTime: 60_000,
    enabled: adding,
  });

  const addMutation = useMutation({
    mutationFn: (tid: string) => apiDocLinkAdd(documentId, tid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-links", documentId] });
      setAdding(false);
      setTargetId(undefined);
      message.success(t("document.links.added"));
    },
    onError: () => message.error(t("document.links.add_error")),
  });

  const removeMutation = useMutation({
    mutationFn: (linkId: string) => apiDocLinkRemove(linkId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["doc-links", documentId] }),
    onError: () => message.error(t("document.links.remove_error")),
  });

  const items: DocLinkItem[] = data?.items ?? [];
  const outLinks = items.filter((l) => l.direction === "OUT");
  const inLinks = items.filter((l) => l.direction === "IN");

  if (isLoading) return <Skeleton active paragraph={{ rows: 3 }} />;

  const docOptions = (docList?.items ?? [])
    .filter((d) => d.documentId !== documentId)
    .map((d) => ({ label: d.title, value: d.documentId }));

  return (
    <div className="space-y-4 pb-4">
      {canEdit && !adding && (
        <Button
          size="small"
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => setAdding(true)}
        >
          {t("document.links.add")}
        </Button>
      )}
      {adding && (
        <div className="flex items-center gap-2">
          <Select
            showSearch
            placeholder={t("document.links.search_placeholder")}
            options={docOptions}
            value={targetId}
            onChange={setTargetId}
            filterOption={(input, opt) =>
              (opt?.label as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
            className="flex-1"
            size="small"
          />
          <Button
            size="small"
            type="primary"
            disabled={!targetId}
            loading={addMutation.isPending}
            onClick={() => targetId && addMutation.mutate(targetId)}
          >
            {t("document.links.add")}
          </Button>
          <Button
            size="small"
            onClick={() => {
              setAdding(false);
              setTargetId(undefined);
            }}
          >
            {t("document.batch.cancel")}
          </Button>
        </div>
      )}
      {outLinks.length === 0 && inLinks.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("document.links.empty")}
        />
      ) : (
        <>
          {outLinks.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {t("document.links.outgoing")}
              </p>
              <div className="space-y-1.5">
                {outLinks.map((l) => (
                  <div
                    key={l.documentLinkId}
                    className="flex items-center justify-between gap-2 rounded-xl border border-stroke bg-white px-3 py-2"
                  >
                    <span className="text-sm text-ink">
                      {l.linkedDocumentId.slice(0, 8)}…{" "}
                      <Tag className="m-0 text-xs">{l.linkType}</Tag>
                    </span>
                    {canEdit && (
                      <Popconfirm
                        title={t("document.links.remove_confirm")}
                        onConfirm={() =>
                          removeMutation.mutate(l.documentLinkId)
                        }
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          loading={removeMutation.isPending}
                        />
                      </Popconfirm>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {inLinks.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {t("document.links.incoming")}
              </p>
              <div className="space-y-1.5">
                {inLinks.map((l) => (
                  <div
                    key={l.documentLinkId}
                    className="flex items-center gap-2 rounded-xl border border-stroke bg-slate-50 px-3 py-2"
                  >
                    <span className="text-sm text-ink">
                      {l.linkedDocumentId.slice(0, 8)}…{" "}
                      <Tag className="m-0 text-xs">{l.linkType}</Tag>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DocAttachmentsTab({
  documentId,
  canEdit,
  canUpload,
}: {
  documentId: string;
  canEdit: boolean;
  canUpload: boolean;
}) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["doc-attachments", documentId],
    queryFn: () => apiDocAttachmentList(documentId),
    staleTime: 30_000,
  });

  const removeMutation = useMutation({
    mutationFn: (aid: string) => apiDocAttachmentRemove(aid),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["doc-attachments", documentId],
      }),
    onError: () => message.error(t("document.attachments.remove_error")),
  });

  const handleUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("fileName", file.name);
    setUploading(true);
    try {
      await apiUploadDocumentAttachment(documentId, fd);
      message.success(t("document.attachments.upload_success"));
      queryClient.invalidateQueries({
        queryKey: ["doc-attachments", documentId],
      });
    } catch (err: unknown) {
      message.error(
        err instanceof Error
          ? err.message
          : t("document.attachments.upload_error"),
      );
    } finally {
      setUploading(false);
    }
  };

  const items: DocAttachmentItem[] = data?.items ?? [];

  if (isLoading) return <Skeleton active paragraph={{ rows: 3 }} />;

  return (
    <div className="space-y-3 pb-4">
      {canUpload && (
        <Upload
          beforeUpload={(file) => {
            void handleUpload(file);
            return false;
          }}
          showUploadList={false}
          disabled={uploading}
        >
          <Button
            size="small"
            type="dashed"
            icon={<UploadOutlined />}
            loading={uploading}
          >
            {t("document.attachments.upload")}
          </Button>
        </Upload>
      )}
      {items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("document.attachments.empty")}
        />
      ) : (
        <div className="space-y-1.5">
          {items.map((a) => (
            <div
              key={a.documentAttachmentId}
              className="flex items-center justify-between gap-2 rounded-xl border border-stroke bg-white px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <PaperClipOutlined className="text-muted" />
                <div>
                  <a
                    href={a.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    {a.fileName}
                  </a>
                  <div className="text-xs text-muted">
                    {a.fileType} · {(a.fileSizeBytes / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              {canEdit && (
                <Popconfirm
                  title={t("document.attachments.remove_confirm")}
                  onConfirm={() =>
                    removeMutation.mutate(a.documentAttachmentId)
                  }
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    loading={removeMutation.isPending}
                  />
                </Popconfirm>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentDetail;
