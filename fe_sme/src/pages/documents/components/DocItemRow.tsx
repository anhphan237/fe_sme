import { Tag, Tooltip, Badge, Checkbox } from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  FileTextFilled,
  FolderOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useLocale } from "@/i18n";
import type { UnifiedDoc } from "./types";
import { getFileExt, getExtColor, formatRelativeTime } from "./DocItemCard";

// Re-export a lightweight version of the file icon for rows
function RowIcon({ doc }: { doc: UnifiedDoc }) {
  if (doc.kind === "EDITOR") {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
        <FileTextFilled className="text-violet-500" />
      </div>
    );
  }
  const ext = getFileExt(doc.fileUrl);
  const color = getExtColor(doc.fileUrl);
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${color}15` }}>
      <span style={{ color }} className="text-base font-bold uppercase leading-none tracking-tight">
        {ext ? ext.slice(0, 3) : "?"}
      </span>
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "green",
  INACTIVE: "default",
  DRAFT: "gold",
};

interface DocItemRowProps {
  doc: UnifiedDoc;
  onOpen: (doc: UnifiedDoc) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const DocItemRow = ({ doc, onOpen, selectable, selected, onToggleSelect }: DocItemRowProps) => {
  const { t } = useLocale();
  const isFile = doc.kind === "FILE";
  const ext = isFile ? getFileExt(doc.fileUrl) : "";
  const accentColor = isFile ? getExtColor(doc.fileUrl) : "#7c3aed";

  return (
    <div
      className={`group flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 transition hover:border-brand/30 hover:shadow-sm ${
        selected ? "border-brand ring-1 ring-brand/20" : "border-stroke"
      }`}
      onClick={() => onOpen(doc)}>
      {/* Checkbox for batch select */}
      {selectable && (
        <div
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(doc.id); }}>
          <Checkbox checked={selected} />
        </div>
      )}

      <RowIcon doc={doc} />

      {/* Title + desc */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink transition group-hover:text-brand">
          {doc.title || t("document.editor.title_default")}
        </p>
        {doc.description && (
          <p className="truncate text-xs text-muted">{doc.description}</p>
        )}
      </div>

      {/* Tags */}
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        {isFile ? (
          ext && (
            <Badge
              count={ext.toUpperCase()}
              style={{ backgroundColor: accentColor, fontSize: 10, height: 18, lineHeight: "18px" }}
            />
          )
        ) : (
          <Tag className="m-0 border-violet-200 bg-violet-50 text-xs text-violet-600">
            {t("document.type.editor")}
          </Tag>
        )}
        <Tag color={STATUS_COLOR[doc.status] ?? "default"} className="m-0 text-xs">
          {doc.status}
        </Tag>
        {!isFile && doc.published && (
          <Tag color="blue" className="m-0 text-xs">
            {t("document.stat.published")}
          </Tag>
        )}
        {doc.folderName && (
          <Tooltip title={doc.folderName}>
            <Tag
              icon={<FolderOutlined />}
              className="m-0 max-w-[90px] truncate border-amber-200 bg-amber-50 text-xs text-amber-700">
              {doc.folderName}
            </Tag>
          </Tooltip>
        )}
        {doc.updatedAt && (
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <ClockCircleOutlined />
            {formatRelativeTime(doc.updatedAt)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Tooltip title={isFile ? t("document.action.view") : t("document.action.edit")}>
          <button
            className="rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-brand"
            onClick={(e) => { e.stopPropagation(); onOpen(doc); }}>
            {isFile ? <EyeOutlined /> : <EditOutlined />}
          </button>
        </Tooltip>
        {isFile && doc.fileUrl && (
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
};

export default DocItemRow;
