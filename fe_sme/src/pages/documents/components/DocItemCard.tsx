import { Button, Checkbox, Tag, Tooltip } from "antd";
import {
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { useLocale } from "@/i18n";
import type { UnifiedDoc } from "./types";
import {
  getDocDisplayStatus,
  getDocTypeLabelKey,
  isEditorDoc,
  isFileDoc,
} from "./types";

interface DocItemCardProps {
  doc: UnifiedDoc;
  onOpen: (doc: UnifiedDoc) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const getFileExt = (doc: UnifiedDoc) => {
  const value = doc.fileUrl || doc.title || "";
  const cleanValue = value.split("?")[0] ?? value;
  const ext = cleanValue.split(".").pop();

  return ext?.toUpperCase() || "FILE";
};

const getFileIcon = (doc: UnifiedDoc) => {
  if (isEditorDoc(doc)) {
    return <FileTextOutlined className="text-lg text-violet-600" />;
  }

  const ext = getFileExt(doc).toLowerCase();

  if (ext === "pdf") {
    return <FilePdfOutlined className="text-lg text-red-500" />;
  }

  if (["doc", "docx"].includes(ext)) {
    return <FileWordOutlined className="text-lg text-blue-600" />;
  }

  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileExcelOutlined className="text-lg text-green-600" />;
  }

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return <FileImageOutlined className="text-lg text-sky-500" />;
  }

  if (["txt", "md"].includes(ext)) {
    return <FileTextOutlined className="text-lg text-slate-500" />;
  }

  return <FileOutlined className="text-lg text-slate-500" />;
};

const getStatusTag = (status: string) => {
  const normalized = status.toUpperCase();

  if (normalized === "DRAFT") {
    return {
      color: "gold",
      labelKey: "document.status.draft",
    };
  }

  if (normalized === "PUBLISHED") {
    return {
      color: "green",
      labelKey: "document.status.published",
    };
  }

  if (normalized === "ACTIVE") {
    return {
      color: "green",
      labelKey: "document.status.active",
    };
  }

  if (normalized === "ARCHIVED") {
    return {
      color: "default",
      labelKey: "document.status.archived",
    };
  }

  return {
    color: "default",
    labelKey: "",
  };
};

const getTopBorderClass = (doc: UnifiedDoc) => {
  if (isEditorDoc(doc)) {
    return doc.published ? "bg-green-500" : "bg-violet-500";
  }

  const ext = getFileExt(doc).toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return "bg-sky-400";
  }

  if (["pdf"].includes(ext)) {
    return "bg-red-400";
  }

  if (["doc", "docx"].includes(ext)) {
    return "bg-blue-500";
  }

  if (["xls", "xlsx", "csv"].includes(ext)) {
    return "bg-green-500";
  }

  return "bg-slate-400";
};

export default function DocItemCard({
  doc,
  onOpen,
  selectable = false,
  selected = false,
  onToggleSelect,
}: DocItemCardProps) {
  const { t } = useLocale();

  const status = getDocDisplayStatus(doc);
  const statusTag = getStatusTag(status);
  const typeLabel = t(getDocTypeLabelKey(doc));
  const updatedAt = doc.updatedAt || doc.createdAt;
  const fileExt = isFileDoc(doc) ? getFileExt(doc) : typeLabel;

  const handleDownload = (event: React.MouseEvent) => {
    event.stopPropagation();

    if (!doc.fileUrl) return;

    window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
  };

  const handleSelect = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleSelect?.(doc.id);
  };

  return (
    <article
      className="group relative flex min-h-[150px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md"
      onClick={() => onOpen(doc)}
    >
      <div className={`h-1 w-full ${getTopBorderClass(doc)}`} />

      {selectable && (
        <div className="absolute right-3 top-3 z-10">
          <Checkbox checked={selected} onClick={handleSelect} />
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
            {getFileIcon(doc)}
          </div>

          <div className="min-w-0 flex-1 pr-5">
            <Tooltip title={doc.title}>
              <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-ink">
                {doc.title || t("document.editor.title_default")}
              </h3>
            </Tooltip>

            <p className="mt-0.5 line-clamp-2 text-xs italic text-muted">
              {doc.description || t("document.empty.no_description")}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Tag className="m-0 rounded-md text-[11px] leading-5">
            {fileExt}
          </Tag>

          <Tag color={isEditorDoc(doc) ? "purple" : "blue"} className="m-0 rounded-md text-[11px] leading-5">
            {typeLabel}
          </Tag>

          <Tag color={statusTag.color} className="m-0 rounded-md text-[11px] leading-5">
            {statusTag.labelKey ? t(statusTag.labelKey) : status}
          </Tag>

          {doc.folderName && (
            <Tag className="m-0 rounded-md text-[11px] leading-5">
              <FolderOutlined className="mr-1" />
              {doc.folderName}
            </Tag>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="flex items-center gap-2">
            <Button
              size="small"
              type="primary"
              icon={isEditorDoc(doc) ? <EditOutlined /> : <EyeOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                onOpen(doc);
              }}
            >
              {isEditorDoc(doc)
                ? t("document.action.edit")
                : t("document.action.view")}
            </Button>

            {isFileDoc(doc) && doc.fileUrl && (
              <Tooltip title={t("document.action.download")}>
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                />
              </Tooltip>
            )}
          </div>

          {updatedAt && (
            <span className="shrink-0 text-[11px] text-muted">
              {dayjs(updatedAt).fromNow()}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}