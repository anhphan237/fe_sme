import { Tag, Tooltip, Badge } from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  FileTextFilled,
} from "@ant-design/icons";
import { useLocale } from "@/i18n";
import type { UnifiedDoc } from "./types";
import { getFileExt, getExtColor } from "./DocItemCard";

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
}

const DocItemRow = ({ doc, onOpen }: DocItemRowProps) => {
  const { t } = useLocale();
  const isFile = doc.kind === "FILE";
  const ext = isFile ? getFileExt(doc.fileUrl) : "";
  const accentColor = isFile ? getExtColor(doc.fileUrl) : "#7c3aed";

  return (
    <div
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-stroke bg-white px-4 py-3 transition hover:border-brand/30 hover:shadow-sm"
      onClick={() => onOpen(doc)}>
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
