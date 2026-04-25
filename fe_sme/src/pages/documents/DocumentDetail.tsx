import { useNavigate, useParams } from "react-router-dom";
import { Card, Divider, Skeleton, Tag, Tooltip, Button } from "antd";
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
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import {
  apiGetDocuments,
  apiListAcknowledgments,
  apiAcknowledgeDocument,
} from "@/api/document/document.api";
import type { DocumentItem } from "@/interface/document";

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
    queryKey: ["documents", undefined],
    queryFn: () => apiGetDocuments(),
    select: (res) =>
      res.items.find((d: DocumentItem) => d.documentId === documentId) ?? null,
    enabled: Boolean(documentId),
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
        style={{ backgroundColor: `${accentColor}18` }}>
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
        className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brandDark">
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
  const {
    data: doc,
    isLoading,
    isError,
    refetch,
  } = useDocumentDetail(documentId);

  const accentColor = getExtColor(doc?.fileUrl);
  const ext = getFileExt(doc?.fileUrl);

  // ─── Acknowledgment ────────────────────────────────────────────────────────
  const queryClient = useQueryClient();
  const { data: ackData } = useQuery({
    queryKey: ["acknowledgments"],
    queryFn: apiListAcknowledgments,
  });
  const isAcknowledged =
    ackData?.items.some((a) => a.documentId === documentId) ?? false;
  const ackMutation = useMutation({
    mutationFn: () => apiAcknowledgeDocument(documentId!),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["acknowledgments"] }),
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
            onClick={() => refetch()}>
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
            className="mt-4 text-sm font-medium text-brand hover:underline">
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
        className="flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink">
        <ArrowLeftOutlined />
        {t("document.detail.back_to_list")}
      </button>

      {/* Header card */}
      <Card
        className="overflow-hidden border border-stroke bg-white shadow-sm"
        bodyStyle={{ padding: 0 }}>
        {/* Accent top bar */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: accentColor }}
        />
        <div className="flex flex-wrap items-start gap-4 p-4 sm:p-5">
          {/* File icon */}
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${accentColor}18` }}>
            <FileIconLarge url={doc.fileUrl} />
          </div>

          {/* Name + description + badges */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-ink">{doc.name}</h1>
              {ext && (
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-bold uppercase text-white"
                  style={{ backgroundColor: accentColor }}>
                  {ext}
                </span>
              )}
              {doc.status && (
                <Tag
                  color={STATUS_COLOR[doc.status] ?? "default"}
                  className="m-0">
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

          {/* Download button */}
          {doc.fileUrl && (
            <Tooltip title={t("document.action.download")}>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-2 rounded-xl border border-stroke px-4 py-2 text-sm font-medium text-muted transition hover:border-slate-400 hover:text-ink">
                <DownloadOutlined />
                {t("document.action.download")}
              </a>
            </Tooltip>
          )}
        </div>
      </Card>

      {/* Body: Preview + Sidebar */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Preview (2/3) */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="border border-stroke bg-white shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">
                {t("document.detail.preview")}
              </h2>
              <span className="text-xs text-muted">
                {ext
                  ? ext === "pdf"
                    ? t("document.detail.inline_preview")
                    : t("document.detail.download_to_view")
                  : ""}
              </span>
            </div>
            <DocumentPreview doc={doc} />
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
                      style={{ backgroundColor: accentColor }}>
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
                      className="m-0 text-xs">
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
                  className="flex items-center gap-1.5 break-all text-xs text-brand hover:underline">
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

          {/* Acknowledgment */}
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
                  onClick={() => ackMutation.mutate()}>
                  {t("document.action.acknowledge")}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

// ── Helper component ──────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted">{label}</span>
      <div>{value}</div>
    </div>
  );
}

export default DocumentDetail;
