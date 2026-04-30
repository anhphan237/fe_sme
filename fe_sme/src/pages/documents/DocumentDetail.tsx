import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Divider,
  Image,
  Result,
  Skeleton,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FolderOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  ReloadOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { useLocale } from "@/i18n";
import {
  apiAcknowledgeDocument,
  apiGetDocuments,
  apiListAcknowledgments,
} from "@/api/document/document.api";
import type { DocumentItem } from "@/interface/document";
import { useDocumentPermissions } from "./hooks/useDocumentPermissions";

type DetailDocumentItem = DocumentItem & {
  documentCategoryId?: string;
  categoryId?: string;
  categoryName?: string;
  createdAt?: string;
  updatedAt?: string;
  readCount?: number;
  ackCount?: number;
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "green",
  INACTIVE: "default",
  DRAFT: "gold",
  PUBLISHED: "green",
  ARCHIVED: "default",
};

const EXT_COLOR: Record<string, string> = {
  pdf: "#ef4444",
  doc: "#2563eb",
  docx: "#2563eb",
  ppt: "#f97316",
  pptx: "#f97316",
  xls: "#16a34a",
  xlsx: "#16a34a",
  csv: "#16a34a",
  jpg: "#0ea5e9",
  jpeg: "#0ea5e9",
  png: "#0ea5e9",
  gif: "#0ea5e9",
  webp: "#0ea5e9",
  txt: "#64748b",
  md: "#64748b",
};

const getFileExt = (url?: string, name?: string): string => {
  const value = url || name || "";
  const clean = value.split("?")[0] ?? value;
  const ext = clean.split(".").pop();

  return ext?.toLowerCase() || "";
};

const getExtColor = (url?: string, name?: string): string => {
  return EXT_COLOR[getFileExt(url, name)] ?? "#64748b";
};

const isImageFile = (ext: string) => {
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
};

const isPdfFile = (ext: string) => ext === "pdf";

const isOfficeFile = (ext: string) => {
  return ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(ext);
};

const isInternalEditorUrl = (url?: string) => {
  if (!url) return false;

  return url.includes("/documents/editor/");
};

const getEditorDocumentIdFromUrl = (url?: string) => {
  if (!url || !isInternalEditorUrl(url)) return null;

  const value = url.split("/documents/editor/").pop();

  if (!value) return null;

  return value.split(/[?#]/)[0] || null;
};

const getStatusLabelKey = (status?: string) => {
  const normalized = status?.toUpperCase();

  if (normalized === "ACTIVE") return "document.status.active";
  if (normalized === "DRAFT") return "document.status.draft";
  if (normalized === "PUBLISHED") return "document.status.published";
  if (normalized === "ARCHIVED") return "document.status.archived";

  return "";
};
const sanitizeFileName = (value: string) => {
  const invalidChars = new Set(["<", ">", ":", '"', "/", "\\", "|", "?", "*"]);

  return value
    .trim()
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);

      if (code >= 0 && code <= 31) return false;

      return !invalidChars.has(char);
    })
    .join("")
    .replace(/\s+/g, " ")
    .slice(0, 180);
};

const getDownloadFileName = (doc: DetailDocumentItem) => {
  const ext = getFileExt(doc.fileUrl, doc.name);
  const cleanName = sanitizeFileName(doc.name || "document");

  if (!ext) return cleanName;

  const lowerName = cleanName.toLowerCase();
  const suffix = `.${ext.toLowerCase()}`;

  if (lowerName.endsWith(suffix)) return cleanName;

  return `${cleanName}.${ext}`;
};

const downloadFileWithName = async (url: string, filename: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("DOWNLOAD_FAILED");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(objectUrl);
};
const getDocumentListItems = (data: unknown): DetailDocumentItem[] => {
  if (!data) return [];

  if (Array.isArray(data)) return data as DetailDocumentItem[];

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.items)) return obj.items as DetailDocumentItem[];
    if (Array.isArray(obj.documents))
      return obj.documents as DetailDocumentItem[];
    if (Array.isArray(obj.data)) return obj.data as DetailDocumentItem[];
  }

  return [];
};

function FileIconLarge({ url, name }: { url?: string; name?: string }) {
  const ext = getFileExt(url, name);
  const className = "text-5xl";

  if (ext === "pdf") {
    return <FilePdfOutlined className={`${className} text-red-500`} />;
  }

  if (["doc", "docx"].includes(ext)) {
    return <FileWordOutlined className={`${className} text-blue-600`} />;
  }

  if (["ppt", "pptx"].includes(ext)) {
    return <FilePptOutlined className={`${className} text-orange-500`} />;
  }

  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileExcelOutlined className={`${className} text-green-600`} />;
  }

  if (isImageFile(ext)) {
    return <FileImageOutlined className={`${className} text-sky-500`} />;
  }

  if (["txt", "md"].includes(ext)) {
    return <FileTextOutlined className={`${className} text-slate-500`} />;
  }

  return <FileOutlined className={`${className} text-slate-400`} />;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <div className="min-w-0 text-right text-sm text-ink">{value}</div>
    </div>
  );
}

function DocumentPreview({ doc }: { doc: DetailDocumentItem }) {
  const { t } = useLocale();
  const navigate = useNavigate();

  const ext = getFileExt(doc.fileUrl, doc.name);
  const accentColor = getExtColor(doc.fileUrl, doc.name);
  const editorDocumentId = getEditorDocumentIdFromUrl(doc.fileUrl);

  if (!doc.fileUrl) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-stroke bg-slate-50">
        <FileOutlined className="text-5xl text-slate-300" />
        <p className="mt-3 text-sm text-muted">
          {t("document.detail.no_preview")}
        </p>
      </div>
    );
  }

  if (editorDocumentId) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-5 rounded-2xl border border-stroke bg-slate-50 px-6 py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-50">
          <FileTextOutlined className="text-5xl text-violet-600" />
        </div>

        <div className="text-center">
          <p className="text-base font-semibold text-ink">{doc.name}</p>
          <p className="mt-1 text-sm text-muted">
            {t("document.detail.editor_preview_hint")}
          </p>
        </div>

        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/documents/editor/${editorDocumentId}`)}
        >
          {t("document.detail.open_editor_document")}
        </Button>
      </div>
    );
  }

  if (isPdfFile(ext)) {
    return (
      <iframe
        src={doc.fileUrl}
        title={doc.name}
        className="h-[680px] w-full rounded-2xl border border-stroke bg-white"
      />
    );
  }

  if (isImageFile(ext)) {
    return (
      <div className="flex w-full justify-center">
        <Image
          src={doc.fileUrl}
          alt={doc.name}
          className="max-h-[680px] rounded-xl object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 rounded-2xl border border-stroke bg-slate-50 px-6 py-16">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${accentColor}18` }}
      >
        <FileIconLarge url={doc.fileUrl} name={doc.name} />
      </div>

      <div className="max-w-lg text-center">
        <p className="text-base font-semibold text-ink">{doc.name}</p>
        <p className="mt-1 text-sm text-muted">
          {isOfficeFile(ext)
            ? t("document.detail.office_preview_hint")
            : t("document.detail.preview_unavailable")}
        </p>
      </div>

      <Button
        type="primary"
        icon={<DownloadOutlined />}
        onClick={async () => {
          try {
            await downloadFileWithName(doc.fileUrl!, getDownloadFileName(doc));
          } catch {
            window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
          }
        }}
      >
        {t("document.action.download")}
        {ext ? ` (${ext.toUpperCase()})` : ""}
      </Button>
    </div>
  );
}

function DocumentDetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton.Button active className="h-8 w-48" />

      <Card className="border border-stroke shadow-sm">
        <Skeleton active avatar paragraph={{ rows: 3 }} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="border border-stroke shadow-sm">
          <Skeleton active paragraph={{ rows: 12 }} />
        </Card>

        <div className="space-y-4">
          <Card className="border border-stroke shadow-sm">
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>

          <Card className="border border-stroke shadow-sm">
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DocumentDetail() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const permissions = useDocumentPermissions();
  const { documentId } = useParams<{ documentId: string }>();

  const {
    data: doc,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["file-document-detail", documentId],
    queryFn: () => apiGetDocuments(),
    select: (res) => {
      const items = getDocumentListItems(res);

      return (
        items.find((item) => item.documentId === documentId) ??
        items.find((item) => String(item.documentId) === String(documentId)) ??
        null
      );
    },
    enabled: Boolean(documentId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: ackData } = useQuery({
    queryKey: ["doc-acknowledgments"],
    queryFn: apiListAcknowledgments,
    enabled: Boolean(documentId) && permissions.canAcknowledge,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const ackedDocIds = useMemo(
    () => new Set((ackData?.items ?? []).map((item) => item.documentId)),
    [ackData],
  );

  const isAcknowledged = documentId ? ackedDocIds.has(documentId) : false;

  const ackMutation = useMutation({
    mutationFn: () => apiAcknowledgeDocument(documentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-acknowledgments"] });
      queryClient.invalidateQueries({
        queryKey: ["file-document-detail", documentId],
      });
      message.success(t("document.ack.success"));
    },
    onError: () => {
      message.error(t("document.ack.error"));
    },
  });

  const ext = getFileExt(doc?.fileUrl, doc?.name);
  const accentColor = getExtColor(doc?.fileUrl, doc?.name);
  const statusLabelKey = getStatusLabelKey(doc?.status);
  const categoryText =
    doc?.categoryName || doc?.documentCategoryId || doc?.categoryId || "—";
  const handleDownload = async () => {
    if (!doc?.fileUrl) return;

    try {
      await downloadFileWithName(doc.fileUrl, getDownloadFileName(doc));
    } catch {
      // fallback nếu server/CDN không cho fetch CORS
      window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return <DocumentDetailSkeleton />;
  }

  if (isError) {
    return (
      <Card className="border border-stroke shadow-sm">
        <Result
          status="error"
          title={t("document.error.something_wrong")}
          extra={[
            <Button key="back" onClick={() => navigate("/documents")}>
              {t("document.detail.back_to_list")}
            </Button>,
            <Button key="retry" type="primary" onClick={() => refetch()}>
              {t("document.error.retry")}
            </Button>,
          ]}
        />
      </Card>
    );
  }

  if (!doc) {
    return (
      <Card className="border border-stroke shadow-sm">
        <Result
          status="404"
          title={t("document.detail.not_found")}
          subTitle={t("document.detail.not_found_desc")}
          extra={
            <Button type="primary" onClick={() => navigate("/documents")}>
              {t("document.detail.back_to_list")}
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate("/documents")}
        className="flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeftOutlined />
        {t("document.detail.back_to_list")}
      </button>

      <Card
        className="overflow-hidden border border-stroke bg-white shadow-sm"
        styles={{ body: { padding: 0 } }}
      >
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: accentColor }}
        />

        <div className="flex flex-wrap items-start gap-4 p-4 sm:p-5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            <FileIconLarge url={doc.fileUrl} name={doc.name} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-bold text-ink">
                {doc.name}
              </h1>

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
                  {statusLabelKey ? t(statusLabelKey) : doc.status}
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

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {isFetching && !isLoading && (
              <span className="text-xs text-brand">
                {t("document.loading.refreshing")}
              </span>
            )}

            <Tooltip title={t("document.action.refresh")}>
              <Button
                icon={<ReloadOutlined />}
                loading={isFetching && !isLoading}
                onClick={() => refetch()}
              />
            </Tooltip>

            {doc.fileUrl && (
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                className="rounded-xl"
              >
                {t("document.action.download")}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card
          className="border border-stroke bg-white shadow-sm"
          title={
            <span className="flex items-center gap-2">
              <EyeOutlined />
              {t("document.detail.tab.preview")}
            </span>
          }
        >
          <DocumentPreview doc={doc} />
        </Card>

        <aside className="space-y-4">
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
                value={<span className="font-medium">{doc.name}</span>}
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
                    <span className="text-muted">—</span>
                  )
                }
              />

              <InfoRow
                label={t("document.detail.status")}
                value={
                  doc.status ? (
                    <Tag
                      color={STATUS_COLOR[doc.status] ?? "default"}
                      className="m-0 text-xs"
                    >
                      {statusLabelKey ? t(statusLabelKey) : doc.status}
                    </Tag>
                  ) : (
                    <span className="text-muted">—</span>
                  )
                }
              />

              <InfoRow
                label={t("document.field.description")}
                value={
                  doc.description ? (
                    <span className="break-words">{doc.description}</span>
                  ) : (
                    <span className="italic text-slate-300">
                      {t("document.empty.no_description")}
                    </span>
                  )
                }
              />

              <InfoRow
                label={t("document.field.category")}
                value={
                  <span className="inline-flex items-center gap-1">
                    <FolderOutlined className="text-amber-500" />
                    {categoryText}
                  </span>
                }
              />

              {doc.createdAt && (
                <InfoRow
                  label={t("document.detail.created_at")}
                  value={dayjs(doc.createdAt).format("DD/MM/YYYY HH:mm")}
                />
              )}

              {doc.updatedAt && (
                <InfoRow
                  label={t("document.detail.updated_at")}
                  value={dayjs(doc.updatedAt).format("DD/MM/YYYY HH:mm")}
                />
              )}
            </div>
          </Card>

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
                value={t("document.detail.visibility_tenant")}
              />

              <InfoRow
                label="ID"
                value={
                  <Tooltip title={doc.documentId}>
                    <span className="font-mono text-xs text-muted">
                      {doc.documentId.slice(0, 12)}…
                    </span>
                  </Tooltip>
                }
              />

              {typeof doc.readCount === "number" && (
                <InfoRow
                  label={t("document.reads.total_read")}
                  value={doc.readCount}
                />
              )}

              {typeof doc.ackCount === "number" && (
                <InfoRow
                  label={t("document.reads.total_ack")}
                  value={doc.ackCount}
                />
              )}
            </div>
          </Card>

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
                  className="flex items-start gap-1.5 break-all text-xs text-brand hover:underline"
                >
                  <DownloadOutlined className="mt-0.5 shrink-0" />
                  <span className="line-clamp-4">{doc.fileUrl}</span>
                </a>
              </Tooltip>
            </Card>
          )}

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
        </aside>
      </div>
    </div>
  );
}
