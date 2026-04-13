import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Tag,
  Skeleton,
  Empty,
  Form,
  Button,
  Upload,
  message,
  Input,
  Tooltip,
  Badge,
} from "antd";
import {
  FilePdfOutlined,
  FileWordOutlined,
  FileTextOutlined,
  FileOutlined,
  FilePptOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  InboxOutlined,
  FolderOutlined,
  EyeOutlined,
  FileAddOutlined,
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { BookOpen, FileCheck, Files, FolderOpen } from "lucide-react";
import BaseButton from "@/components/button";
import BaseModal from "@core/components/Modal/BaseModal";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import { useLocale } from "@/i18n";
import {
  apiGetDocuments,
  apiUploadDocumentFile,
} from "@/api/document/document.api";
import type { DocumentItem } from "@/interface/document";

const { Dragger } = Upload;

// ── helpers ─────────────────────────────────────────────────────────────────

function getFileExt(url?: string): string {
  if (!url) return "";
  const clean = url.split("?")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.substring(dot + 1).toLowerCase() : "";
}

function FileIcon({
  url,
  className = "text-lg",
}: {
  url?: string;
  className?: string;
}) {
  const ext = getFileExt(url);
  if (ext === "pdf")
    return <FilePdfOutlined className={`${className} text-red-500`} />;
  if (["doc", "docx"].includes(ext))
    return <FileWordOutlined className={`${className} text-blue-600`} />;
  if (["ppt", "pptx"].includes(ext))
    return <FilePptOutlined className={`${className} text-orange-500`} />;
  if (["xls", "xlsx"].includes(ext))
    return <FileExcelOutlined className={`${className} text-green-600`} />;
  if (["txt", "md"].includes(ext))
    return <FileTextOutlined className={`${className} text-slate-500`} />;
  return <FileOutlined className={`${className} text-slate-400`} />;
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

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "green",
  INACTIVE: "default",
  DRAFT: "gold",
};

const FOLDERS = ["Company", "Department", "Compliance", "Security"];
const folderOptions = FOLDERS.map((f) => ({ label: f, value: f }));

// ── Query ────────────────────────────────────────────────────────────────────

const useAllDocumentsQuery = () =>
  useQuery({
    queryKey: ["documents", undefined],
    queryFn: () => apiGetDocuments(),
    select: (res) => res.items,
  });

const useDocumentsQuery = (categoryId?: string) =>
  useQuery({
    queryKey: ["documents", categoryId],
    queryFn: () => apiGetDocuments(categoryId),
    select: (res) => res.items,
  });

// ── KPI Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: "blue" | "teal" | "amber" | "violet";
}) {
  const toneMap: Record<typeof tone, string> = {
    blue: "bg-blue-50 text-blue-700",
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <Card
      size="small"
      className="border border-stroke bg-white shadow-sm transition hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-2.5 ${toneMap[tone]}`}>{icon}</div>
      </div>
    </Card>
  );
}

// ── Document Card ─────────────────────────────────────────────────────────────

function DocCard({
  doc,
  onView,
}: {
  doc: DocumentItem;
  onView: (id: string) => void;
}) {
  const { t } = useLocale();
  const ext = getFileExt(doc.fileUrl) || "file";
  const accentColor = getExtColor(doc.fileUrl);

  return (
    <div
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm transition hover:border-slate-300 hover:shadow-soft"
      onClick={() => onView(doc.documentId)}>
      {/* Accent strip */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
            <FileIcon url={doc.fileUrl} className="text-xl" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold leading-snug text-ink group-hover:text-brand">
              {doc.name}
            </h4>
            {doc.description ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                {doc.description}
              </p>
            ) : (
              <p className="mt-0.5 text-xs italic text-slate-300">
                {t("document.empty.no_description")}
              </p>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            count={ext.toUpperCase()}
            style={{ backgroundColor: accentColor, fontSize: 10, height: 18, lineHeight: "18px" }}
          />
          {doc.status && (
            <Tag
              color={STATUS_COLOR[doc.status] ?? "default"}
              className="m-0 text-xs">
              {doc.status}
            </Tag>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <button
            className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brandDark"
            onClick={(e) => {
              e.stopPropagation();
              onView(doc.documentId);
            }}>
            <EyeOutlined />
            {t("document.action.view")}
          </button>
          {doc.fileUrl && (
            <Tooltip title={t("document.action.download")}>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-muted transition hover:border-slate-400 hover:text-ink"
                onClick={(e) => e.stopPropagation()}>
                <DownloadOutlined />
                {t("document.action.download")}
              </a>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

// ── List Row ──────────────────────────────────────────────────────────────────

function DocRow({
  doc,
  onView,
}: {
  doc: DocumentItem;
  onView: (id: string) => void;
}) {
  const { t } = useLocale();
  const ext = getFileExt(doc.fileUrl) || "—";
  const accentColor = getExtColor(doc.fileUrl);

  return (
    <div
      className="group flex cursor-pointer items-center gap-4 rounded-xl border border-stroke bg-white px-4 py-3 transition hover:border-slate-300 hover:shadow-sm"
      onClick={() => onView(doc.documentId)}>
      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
        <FileIcon url={doc.fileUrl} />
      </div>

      {/* Name + description */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink group-hover:text-brand">
          {doc.name}
        </p>
        {doc.description && (
          <p className="truncate text-xs text-muted">{doc.description}</p>
        )}
      </div>

      {/* Badges */}
      <div className="hidden items-center gap-2 sm:flex">
        <Badge
          count={ext.toUpperCase()}
          style={{ backgroundColor: accentColor, fontSize: 10, height: 18, lineHeight: "18px" }}
        />
        {doc.status && (
          <Tag color={STATUS_COLOR[doc.status] ?? "default"} className="m-0 text-xs">
            {doc.status}
          </Tag>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Tooltip title={t("document.action.view")}>
          <button
            className="rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-brand"
            onClick={(e) => {
              e.stopPropagation();
              onView(doc.documentId);
            }}>
            <EyeOutlined />
          </button>
        </Tooltip>
        {doc.fileUrl && (
          <Tooltip title={t("document.action.download")}>
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-brand"
              onClick={(e) => e.stopPropagation()}>
              <DownloadOutlined />
            </a>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const Documents = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  const { data: allDocs = [] } = useAllDocumentsQuery();
  const { data, isLoading, isError, refetch } = useDocumentsQuery(
    selectedFolder ?? undefined,
  );

  const displayedDocs = useMemo(() => {
    const base = data ?? [];
    if (!searchText.trim()) return base;
    const q = searchText.toLowerCase();
    return base.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q),
    );
  }, [data, searchText]);

  // Stats from the full document list
  const totalDocs = allDocs.length;
  const activeDocs = allDocs.filter((d) => d.status === "ACTIVE").length;
  const pdfDocs = allDocs.filter((d) => getFileExt(d.fileUrl) === "pdf").length;
  const otherDocs = totalDocs - pdfDocs;

  const handleOpenUpload = () => {
    form.resetFields();
    setFileList([]);
    setOpen(true);
  };

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      const file = fileList[0]?.originFileObj;
      if (!file) {
        message.warning(t("document.upload.select_file"));
        return;
      }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", values.name ?? file.name);
      if (values.description) fd.append("description", values.description);
      if (values.documentCategoryId)
        fd.append("documentCategoryId", values.documentCategoryId);

      setUploading(true);
      await apiUploadDocumentFile(fd);
      message.success(t("document.upload.success"));
      setOpen(false);
      form.resetFields();
      setFileList([]);
      queryClient.invalidateQueries({ queryKey: ["documents"], exact: false });
    } catch (err: unknown) {
      message.error(
        err instanceof Error ? err.message : t("document.upload.failed"),
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">
            {t("document.page.title")}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {t("document.page.subtitle")}
          </p>
        </div>
        <button
          onClick={handleOpenUpload}
          className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brandDark active:scale-95">
          <FileAddOutlined />
          {t("document.action.upload")}
        </button>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("document.stat.total")}
          value={totalDocs}
          icon={<Files className="h-4 w-4" />}
          tone="blue"
        />
        <StatCard
          label={t("document.stat.active")}
          value={activeDocs}
          icon={<FileCheck className="h-4 w-4" />}
          tone="teal"
        />
        <StatCard
          label="PDF"
          value={pdfDocs}
          icon={<BookOpen className="h-4 w-4" />}
          tone="amber"
        />
        <StatCard
          label={t("document.stat.other_types")}
          value={otherDocs}
          icon={<FolderOpen className="h-4 w-4" />}
          tone="violet"
        />
      </div>

      {/* Search + View toggle */}
      <Card
        size="small"
        className="border border-stroke bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            prefix={<SearchOutlined className="text-muted" />}
            placeholder={t("document.search.placeholder")}
            className="max-w-xs"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted">
              {displayedDocs.length} {t("document.stat.results")}
            </span>
            <Button
              size="small"
              type={view === "grid" ? "primary" : "default"}
              icon={<AppstoreOutlined />}
              onClick={() => setView("grid")}
            />
            <Button
              size="small"
              type={view === "list" ? "primary" : "default"}
              icon={<BarsOutlined />}
              onClick={() => setView("list")}
            />
          </div>
        </div>
      </Card>

      {/* Main layout */}
      <div className="flex gap-4">
        {/* Sidebar */}
        <div className="w-52 shrink-0 space-y-1">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("document.sidebar.folders")}
          </p>
          <button
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${
              selectedFolder === null
                ? "bg-brand text-white"
                : "text-ink hover:bg-slate-100"
            }`}
            onClick={() => setSelectedFolder(null)}>
            <FolderOutlined />
            <span className="flex-1">{t("document.folder.all")}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                selectedFolder === null
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-muted"
              }`}>
              {totalDocs}
            </span>
          </button>

          {FOLDERS.map((folder) => (
            <button
              key={folder}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${
                selectedFolder === folder
                  ? "bg-brand text-white"
                  : "text-ink hover:bg-slate-100"
              }`}
              onClick={() =>
                setSelectedFolder(selectedFolder === folder ? null : folder)
              }>
              <FolderOutlined />
              <span className="flex-1 truncate">{folder}</span>
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Card key={i} className="border border-stroke shadow-sm">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </Card>
              ))}
            </div>
          ) : isError ? (
            <Card className="border border-stroke bg-white shadow-sm">
              <p className="text-sm text-muted">
                {t("document.error.something_wrong")}{" "}
                <button
                  className="font-semibold text-brand hover:underline"
                  onClick={() => refetch()}>
                  {t("document.error.retry")}
                </button>
              </p>
            </Card>
          ) : displayedDocs.length === 0 ? (
            <Card className="border border-stroke bg-white shadow-sm">
              <Empty
                description={
                  searchText
                    ? t("document.empty.no_search_result")
                    : t("document.empty.description")
                }
                className="py-12">
                {!searchText && (
                  <button
                    onClick={handleOpenUpload}
                    className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brandDark">
                    <FileAddOutlined />
                    {t("document.action.upload")}
                  </button>
                )}
              </Empty>
            </Card>
          ) : view === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {displayedDocs.map((doc: DocumentItem) => (
                <DocCard
                  key={doc.documentId}
                  doc={doc}
                  onView={(id) => navigate(`/documents/${id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {displayedDocs.map((doc: DocumentItem) => (
                <DocRow
                  key={doc.documentId}
                  doc={doc}
                  onView={(id) => navigate(`/documents/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <BaseModal
        open={open}
        title={t("document.modal.upload.title")}
        onCancel={() => setOpen(false)}
        onOk={handleUpload}
        okText={t("document.action.upload")}
        confirmLoading={uploading}>
        <Form form={form} layout="vertical" className="mt-4 space-y-2">
          <Form.Item label={t("document.field.file")} required>
            <Dragger
              beforeUpload={() => false}
              fileList={fileList}
              maxCount={1}
              accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx"
              onChange={({ fileList: fl }) => {
                setFileList(fl);
                if (fl[0]?.name && !form.getFieldValue("name")) {
                  form.setFieldValue(
                    "name",
                    fl[0].name.replace(/\.[^/.]+$/, ""),
                  );
                }
              }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {t("document.upload.dragger_text")}
              </p>
              <p className="ant-upload-hint">
                {t("document.upload.dragger_hint")}
              </p>
            </Dragger>
          </Form.Item>

          <BaseInput
            name="name"
            label={t("document.field.name")}
            placeholder={t("document.field.name.placeholder")}
            formItemProps={{ rules: [{ required: true }] }}
          />
          <BaseInput
            name="description"
            label={t("document.field.description")}
            placeholder={t("document.field.description.placeholder")}
          />
          <BaseSelect
            name="documentCategoryId"
            label={t("document.field.category")}
            options={folderOptions}
            placeholder={t("document.field.category.placeholder")}
          />
        </Form>
      </BaseModal>
    </div>
  );
};

export default Documents;
