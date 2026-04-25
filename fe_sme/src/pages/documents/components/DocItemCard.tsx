import { Tag, Tooltip, Badge } from "antd";
import {
  FilePdfOutlined,
  FileWordOutlined,
  FileTextOutlined,
  FileOutlined,
  FilePptOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  FileTextFilled,
} from "@ant-design/icons";
import { useLocale } from "@/i18n";
import type { UnifiedDoc } from "./types";

// ── File helpers ───────────────────────────────────────────────────────────────

export function getFileExt(url?: string): string {
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

export function getExtColor(url?: string): string {
  return EXT_COLOR[getFileExt(url)] ?? "#94a3b8";
}

function FileTypeIcon({ url, className = "text-xl" }: { url?: string; className?: string }) {
  const ext = getFileExt(url);
  if (ext === "pdf") return <FilePdfOutlined className={`${className} text-red-500`} />;
  if (["doc", "docx"].includes(ext)) return <FileWordOutlined className={`${className} text-blue-600`} />;
  if (["ppt", "pptx"].includes(ext)) return <FilePptOutlined className={`${className} text-orange-500`} />;
  if (["xls", "xlsx"].includes(ext)) return <FileExcelOutlined className={`${className} text-green-600`} />;
  if (["txt", "md"].includes(ext)) return <FileTextOutlined className={`${className} text-slate-500`} />;
  return <FileOutlined className={`${className} text-slate-400`} />;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "green",
  INACTIVE: "default",
  DRAFT: "gold",
};

// ── DocItemCard (grid card) ───────────────────────────────────────────────────

interface DocItemCardProps {
  doc: UnifiedDoc;
  onOpen: (doc: UnifiedDoc) => void;
}

const DocItemCard = ({ doc, onOpen }: DocItemCardProps) => {
  const { t } = useLocale();
  const isFile = doc.kind === "FILE";
  const accentColor = isFile ? getExtColor(doc.fileUrl) : "#7c3aed";
  const ext = isFile ? getFileExt(doc.fileUrl) : "";

  return (
    <div
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm transition hover:border-brand/30 hover:shadow-md"
      onClick={() => onOpen(doc)}>
      {/* Accent strip */}
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isFile ? "bg-slate-50" : "bg-violet-50"
            }`}>
            {isFile ? (
              <FileTypeIcon url={doc.fileUrl} />
            ) : (
              <FileTextFilled className="text-xl text-violet-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition group-hover:text-brand">
              {doc.title || t("document.editor.title_default")}
            </h4>
            {doc.description ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">{doc.description}</p>
            ) : (
              <p className="mt-0.5 text-xs italic text-slate-300">{t("document.empty.no_description")}</p>
            )}
          </div>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Kind badge */}
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

          {/* Status */}
          <Tag color={STATUS_COLOR[doc.status] ?? "default"} className="m-0 text-xs">
            {doc.status}
          </Tag>

          {/* Published badge for EDITOR */}
          {!isFile && doc.published && (
            <Tag color="blue" className="m-0 text-xs">
              {t("document.stat.published")}
            </Tag>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <button
            className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brandDark active:scale-95"
            onClick={(e) => { e.stopPropagation(); onOpen(doc); }}>
            {isFile ? <EyeOutlined /> : <EditOutlined />}
            {isFile ? t("document.action.view") : t("document.action.edit")}
          </button>

          {isFile && doc.fileUrl && (
            <Tooltip title={t("document.action.download")}>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-muted transition hover:border-slate-400 hover:text-ink"
                onClick={(e) => e.stopPropagation()}>
                <DownloadOutlined />
              </a>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocItemCard;
