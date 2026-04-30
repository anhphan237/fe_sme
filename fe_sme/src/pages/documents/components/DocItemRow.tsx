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

interface DocItemRowProps {
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

export default function DocItemRow({
  doc,
  onOpen,
  selectable = false,
  selected = false,
  onToggleSelect,
}: DocItemRowProps) {
  const { t } = useLocale();

  const status = getDocDisplayStatus(doc);
  const statusTag = getStatusTag(status);
  const typeLabel = t(getDocTypeLabelKey(doc));
  const fileExt = isFileDoc(doc) ? getFileExt(doc) : typeLabel;
  const updatedAt = doc.updatedAt || doc.createdAt;

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
      className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-stroke bg-white px-4 py-3 shadow-sm transition hover:border-brand/30 hover:bg-slate-50 hover:shadow-md"
      onClick={() => onOpen(doc)}
    >
      {selectable && (
        <Checkbox
          checked={selected}
          onClick={handleSelect}
          className="shrink-0"
        />
      )}

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50">
        {getFileIcon(doc)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <Tooltip title={doc.title}>
            <h3 className="truncate text-sm font-semibold text-ink group-hover:text-brand">
              {doc.title || t("document.editor.title_default")}
            </h3>
          </Tooltip>

          {doc.folderName && (
            <Tag className="m-0 hidden shrink-0 rounded-md text-[11px] leading-5 md:inline-flex">
              <FolderOutlined className="mr-1" />
              {doc.folderName}
            </Tag>
          )}
        </div>

        <p className="mt-0.5 line-clamp-1 text-xs text-muted">
          {doc.description || t("document.empty.no_description")}
        </p>
      </div>

      <div className="hidden shrink-0 flex-wrap items-center gap-1.5 lg:flex">
        <Tag className="m-0 rounded-md text-[11px] leading-5">{fileExt}</Tag>

        <Tag
          color={isEditorDoc(doc) ? "purple" : "blue"}
          className="m-0 rounded-md text-[11px] leading-5"
        >
          {typeLabel}
        </Tag>

        <Tag
          color={statusTag.color}
          className="m-0 rounded-md text-[11px] leading-5"
        >
          {statusTag.labelKey ? t(statusTag.labelKey) : status}
        </Tag>
      </div>

      {updatedAt && (
        <span className="hidden w-24 shrink-0 text-right text-[11px] text-muted md:block">
          {dayjs(updatedAt).fromNow()}
        </span>
      )}

      <div className="flex shrink-0 items-center gap-1.5">
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
    </article>
  );
}