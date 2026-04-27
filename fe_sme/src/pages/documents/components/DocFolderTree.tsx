import { useState } from "react";
import { Dropdown, Spin } from "antd";
import type { MenuProps } from "antd";
import {
  FolderOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useLocale } from "@/i18n";
import type { DocFolderNode } from "@/interface/document/editor";

function countDocsInFolder(node: DocFolderNode): number {
  return node.documents.length + node.children.reduce((s, c) => s + countDocsInFolder(c), 0);
}

function FolderNode({
  node,
  depth,
  selectedId,
  onSelect,
  canManage,
  onCreateChild,
  onRename,
  onDelete,
  defaultExpanded,
}: {
  node: DocFolderNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  canManage: boolean;
  onCreateChild: (parentId: string) => void;
  onRename: (folderId: string, currentName: string) => void;
  onDelete: (folderId: string) => void;
  defaultExpanded: boolean;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(defaultExpanded);
  const isActive = selectedId === node.folderId;
  const hasChildren = node.children.length > 0;
  const docCount = countDocsInFolder(node);

  const menuItems: MenuProps["items"] = canManage
    ? [
        { key: "sub", label: t("document.folder.new_sub"), icon: <PlusOutlined /> },
        { key: "rename", label: t("document.folder.rename"), icon: <EditOutlined /> },
        { type: "divider" },
        { key: "delete", label: t("document.folder.delete"), icon: <DeleteOutlined />, danger: true },
      ]
    : [];

  const handleMenu: MenuProps["onClick"] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    if (key === "sub") onCreateChild(node.folderId);
    if (key === "rename") onRename(node.folderId, node.name);
    if (key === "delete") onDelete(node.folderId);
  };

  return (
    <div>
      <div
        className={`group flex cursor-pointer items-center gap-1.5 rounded-lg py-1.5 pr-1 text-sm transition select-none ${
          isActive
            ? "bg-brand/10 font-semibold text-brand"
            : "text-ink hover:bg-slate-100"
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => {
          onSelect(node.folderId);
          if (hasChildren) setOpen((v) => !v);
        }}>
        <span className="flex shrink-0 items-center text-base">
          {hasChildren && open ? (
            <FolderOpenOutlined className={isActive ? "text-brand" : "text-amber-500"} />
          ) : (
            <FolderOutlined className={isActive ? "text-brand" : "text-amber-400"} />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${
            isActive ? "bg-brand/10 text-brand" : "bg-slate-100 text-muted"
          }`}>
          {docCount}
        </span>
        {canManage && menuItems.length > 0 && (
          <Dropdown menu={{ items: menuItems, onClick: handleMenu }} trigger={["click"]}>
            <button
              className={`ml-0.5 shrink-0 rounded p-0.5 opacity-0 transition group-hover:opacity-100 ${
                isActive ? "text-brand hover:bg-brand/10" : "text-muted hover:bg-slate-200"
              }`}
              onClick={(e) => e.stopPropagation()}>
              <MoreOutlined />
            </button>
          </Dropdown>
        )}
      </div>
      {open &&
        node.children.map((child) => (
          <FolderNode
            key={child.folderId}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            canManage={canManage}
            onCreateChild={onCreateChild}
            onRename={onRename}
            onDelete={onDelete}
            defaultExpanded={false}
          />
        ))}
    </div>
  );
}

interface DocFolderTreeProps {
  roots: DocFolderNode[];
  loading: boolean;
  selectedId: string | null;
  totalCount: number;
  onSelect: (id: string | null) => void;
  canManage: boolean;
  onCreateRoot: () => void;
  onCreateChild: (parentId: string) => void;
  onRename: (folderId: string, currentName: string) => void;
  onDelete: (folderId: string) => void;
}

const DocFolderTree = ({
  roots,
  loading,
  selectedId,
  totalCount,
  onSelect,
  canManage,
  onCreateRoot,
  onCreateChild,
  onRename,
  onDelete,
}: DocFolderTreeProps) => {
  const { t } = useLocale();

  return (
    <div className="flex h-full flex-col gap-1">
      {/* All documents */}
      <button
        className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
          selectedId === null
            ? "bg-brand/10 font-semibold text-brand"
            : "text-ink hover:bg-slate-100"
        }`}
        onClick={() => onSelect(null)}>
        <FolderOpenOutlined
          className={`text-base ${selectedId === null ? "text-brand" : "text-slate-400"}`}
        />
        <span className="flex-1 truncate text-left">{t("document.folder.all_documents")}</span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
            selectedId === null ? "bg-brand/10 text-brand" : "bg-slate-100 text-muted"
          }`}>
          {totalCount}
        </span>
      </button>

      <div className="my-1 h-px bg-stroke" />

      {/* Folder list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Spin size="small" />
        </div>
      ) : roots.length === 0 ? (
        <p className="px-2 py-2 text-xs text-muted">
          {canManage ? (
            <button className="text-brand hover:underline" onClick={onCreateRoot}>
              + {t("document.folder.new")}
            </button>
          ) : (
            "Chưa có thư mục"
          )}
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {roots.map((node) => (
            <FolderNode
              key={node.folderId}
              node={node}
              depth={0}
              selectedId={selectedId}
              onSelect={onSelect}
              canManage={canManage}
              onCreateChild={onCreateChild}
              onRename={onRename}
              onDelete={onDelete}
              defaultExpanded={true}
            />
          ))}
        </div>
      )}

      {/* New folder button */}
      {canManage && roots.length > 0 && (
        <button
          className="mt-auto flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted transition hover:bg-slate-100 hover:text-brand"
          onClick={onCreateRoot}>
          <PlusOutlined />
          {t("document.folder.new")}
        </button>
      )}
    </div>
  );
};

export default DocFolderTree;
export { countDocsInFolder };
