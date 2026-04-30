import { useMemo, useState } from "react";
import type { DragEvent } from "react";
import { Button, Dropdown, Empty, Skeleton, Tooltip, message } from "antd";
import type { MenuProps } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  HolderOutlined,
  MoreOutlined,
  PlusOutlined,
  RightOutlined,
} from "@ant-design/icons";

import { useLocale } from "@/i18n";
import type { DocFolderNode } from "@/interface/document/editor";

type FolderDocItem = {
  documentId: string;
  title?: string;
  name?: string;
  status?: string;
  type?: string;
  documentType?: string;
};

type DragPayload =
  | {
      kind: "folder";
      folderId: string;
      sourceParentFolderId?: string | null;
    }
  | {
      kind: "document";
      documentId: string;
      sourceFolderId: string;
    };

interface DocFolderTreeProps {
  roots: DocFolderNode[];
  loading?: boolean;
  selectedId: string | null;
  selectedDocumentId?: string | null;
  totalCount?: number;
  canManage?: boolean;
  onSelect: (folderId: string | null) => void;
  onSelectDocument?: (documentId: string, folderId: string) => void;
  onCreateRoot?: () => void;
  onCreateChild?: (parentId: string) => void;
  onRename?: (folderId: string, currentName: string) => void;
  onDelete?: (folderId: string) => void;
  onMoveFolder?: (
    sourceFolderId: string,
    targetParentFolderId: string | null,
  ) => Promise<void> | void;
  onMoveDocument?: (
    documentId: string,
    sourceFolderId: string,
    targetFolderId: string,
  ) => Promise<void> | void;
  showAllDocuments?: boolean;
}

const DND_MIME = "application/x-sme-document-tree";

const formatI18n = (
  template: string,
  values: Record<string, string | number>,
) => {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{{${key}}}`, String(value));
  }, template);
};

const normalizeDocuments = (node: DocFolderNode): FolderDocItem[] => {
  const raw = (node as { documents?: unknown[] }).documents;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const obj = item as Record<string, unknown>;

      const documentId =
        (obj.documentId as string) ||
        (obj.id as string) ||
        (obj.editorDocumentId as string);

      if (!documentId) return null;

      return {
        documentId,
        title:
          (obj.title as string) ||
          (obj.name as string) ||
          (obj.documentTitle as string) ||
          (obj.documentName as string),
        name:
          (obj.name as string) ||
          (obj.title as string) ||
          (obj.documentName as string),
        status: (obj.status as string) || undefined,
        type:
          (obj.type as string) ||
          (obj.documentType as string) ||
          (obj.kind as string),
        documentType: (obj.documentType as string) || undefined,
      } satisfies FolderDocItem;
    })
    .filter(Boolean) as FolderDocItem[];
};

const countDocuments = (node: DocFolderNode): number => {
  const ownCount = normalizeDocuments(node).length;
  const childCount = (node.children ?? []).reduce(
    (sum, child) => sum + countDocuments(child),
    0,
  );

  return ownCount + childCount;
};

const findPathToFolder = (
  nodes: DocFolderNode[],
  targetId: string | null,
  path: string[] = [],
): string[] => {
  if (!targetId) return [];

  for (const node of nodes) {
    const nextPath = [...path, node.folderId];

    if (node.folderId === targetId) return nextPath;

    const childPath = findPathToFolder(node.children ?? [], targetId, nextPath);
    if (childPath.length) return childPath;
  }

  return [];
};

const findFolderNode = (
  nodes: DocFolderNode[],
  folderId: string,
): DocFolderNode | null => {
  for (const node of nodes) {
    if (node.folderId === folderId) return node;

    const child = findFolderNode(node.children ?? [], folderId);
    if (child) return child;
  }

  return null;
};

const isDescendantFolder = (
  nodes: DocFolderNode[],
  sourceFolderId: string,
  targetFolderId: string,
): boolean => {
  const sourceNode = findFolderNode(nodes, sourceFolderId);
  if (!sourceNode) return false;

  const walk = (node: DocFolderNode): boolean => {
    for (const child of node.children ?? []) {
      if (child.folderId === targetFolderId) return true;
      if (walk(child)) return true;
    }

    return false;
  };

  return walk(sourceNode);
};

const writeDragPayload = (
  event: DragEvent<HTMLElement>,
  payload: DragPayload,
) => {
  const json = JSON.stringify(payload);

  event.dataTransfer.setData(DND_MIME, json);
  event.dataTransfer.setData("application/json", json);
  event.dataTransfer.setData("text/plain", json);
  event.dataTransfer.effectAllowed = "move";
};

const readDragPayload = (event: DragEvent<HTMLElement>): DragPayload | null => {
  const raw =
    event.dataTransfer.getData(DND_MIME) ||
    event.dataTransfer.getData("application/json") ||
    event.dataTransfer.getData("text/plain");

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as DragPayload;

    if (parsed.kind === "folder" && parsed.folderId) return parsed;
    if (
      parsed.kind === "document" &&
      parsed.documentId &&
      parsed.sourceFolderId
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
};

function FolderDocumentRow({
  doc,
  folderId,
  level,
  selectedDocumentId,
  canManage,
  onSelectDocument,
}: {
  doc: FolderDocItem;
  folderId: string;
  level: number;
  selectedDocumentId?: string | null;
  canManage: boolean;
  onSelectDocument?: (documentId: string, folderId: string) => void;
}) {
  const { t } = useLocale();

  const isSelected = selectedDocumentId === doc.documentId;
  const docTitle = doc.title || doc.name || doc.documentId;

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    if (!canManage) return;

    event.stopPropagation();

    writeDragPayload(event, {
      kind: "document",
      documentId: doc.documentId,
      sourceFolderId: folderId,
    });
  };

  return (
    <div
      draggable={canManage}
      onDragStart={handleDragStart}
      onClick={(event) => {
        event.stopPropagation();
        onSelectDocument?.(doc.documentId, folderId);
      }}
      className={[
        "group flex cursor-grab items-center gap-1 rounded-xl px-2 py-1.5 text-sm transition active:cursor-grabbing",
        isSelected
          ? "bg-brand/10 text-brand"
          : "text-ink hover:bg-slate-50 hover:text-brand",
      ].join(" ")}
      style={{ paddingLeft: 8 + (level + 1) * 18 }}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-300">
        {canManage ? <HolderOutlined /> : null}
      </span>

      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <FileTextOutlined />
      </span>

      <Tooltip title={docTitle}>
        <span className="min-w-0 flex-1 truncate">{docTitle}</span>
      </Tooltip>

      {doc.status && (
        <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-muted">
          {doc.status}
        </span>
      )}

      <span className="shrink-0 text-[11px] text-slate-400">
        {t("document.folder.item_document")}
      </span>
    </div>
  );
}

function TreeNodeItem({
  node,
  level,
  treeRoots,
  selectedId,
  selectedDocumentId,
  expandedIds,
  dragOverFolderId,
  canManage,
  onToggleExpand,
  onSelect,
  onSelectDocument,
  onCreateChild,
  onRename,
  onDelete,
  onMoveFolder,
  onMoveDocument,
  onSetDragOverFolder,
}: {
  node: DocFolderNode;
  level: number;
  treeRoots: DocFolderNode[];
  selectedId: string | null;
  selectedDocumentId?: string | null;
  expandedIds: Set<string>;
  dragOverFolderId: string | null;
  canManage: boolean;
  onToggleExpand: (folderId: string) => void;
  onSelect: (folderId: string) => void;
  onSelectDocument?: (documentId: string, folderId: string) => void;
  onCreateChild?: (parentId: string) => void;
  onRename?: (folderId: string, currentName: string) => void;
  onDelete?: (folderId: string) => void;
  onMoveFolder?: (
    sourceFolderId: string,
    targetParentFolderId: string | null,
  ) => Promise<void> | void;
  onMoveDocument?: (
    documentId: string,
    sourceFolderId: string,
    targetFolderId: string,
  ) => Promise<void> | void;
  onSetDragOverFolder: (folderId: string | null) => void;
}) {
  const { t } = useLocale();

  const children = node.children ?? [];
  const documents = normalizeDocuments(node);

  const hasChildren = children.length > 0;
  const hasDocuments = documents.length > 0;
  const canExpand = hasChildren || hasDocuments;
  const canDragFolder = canManage && Boolean(onMoveFolder);

  const isExpanded = expandedIds.has(node.folderId);
  const isSelected = selectedId === node.folderId;
  const isDragOver = dragOverFolderId === node.folderId;
  const documentCount = countDocuments(node);

  const menuItems: MenuProps["items"] = [
    {
      key: "create-child",
      icon: <FolderAddOutlined />,
      label: t("document.folder.new_sub"),
    },
    {
      key: "rename",
      icon: <EditOutlined />,
      label: t("document.folder.rename"),
    },
    {
      type: "divider",
    },
    {
      key: "delete",
      danger: true,
      icon: <DeleteOutlined />,
      label: t("document.folder.delete"),
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = ({ key, domEvent }) => {
    domEvent.stopPropagation();

    if (key === "create-child") {
      onCreateChild?.(node.folderId);
      return;
    }

    if (key === "rename") {
      onRename?.(node.folderId, node.name);
      return;
    }

    if (key === "delete") {
      onDelete?.(node.folderId);
    }
  };

  const handleFolderDragStart = (event: DragEvent<HTMLDivElement>) => {
    if (!canDragFolder) return;

    event.stopPropagation();

    writeDragPayload(event, {
      kind: "folder",
      folderId: node.folderId,
    });
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!canManage) return;

    event.preventDefault();
    event.stopPropagation();

    event.dataTransfer.dropEffect = "move";
    onSetDragOverFolder(node.folderId);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;

    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      onSetDragOverFolder(null);
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    if (!canManage) return;

    event.preventDefault();
    event.stopPropagation();

    onSetDragOverFolder(null);

    const payload = readDragPayload(event);
    if (!payload) return;

    if (payload.kind === "folder") {
      if (!onMoveFolder) return;
      if (payload.folderId === node.folderId) return;

      if (isDescendantFolder(treeRoots, payload.folderId, node.folderId)) {
        message.warning(t("document.folder.move_folder_invalid"));
        return;
      }

      await onMoveFolder(payload.folderId, node.folderId);
      return;
    }

    if (payload.kind === "document") {
      if (payload.sourceFolderId === node.folderId) return;

      await onMoveDocument?.(
        payload.documentId,
        payload.sourceFolderId,
        node.folderId,
      );
    }
  };

  return (
    <div>
      <div
        draggable={canDragFolder}
        onDragStart={handleFolderDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "group flex cursor-pointer items-center gap-1 rounded-xl px-2 py-1.5 text-sm transition",
          canDragFolder ? "cursor-grab active:cursor-grabbing" : "",
          isSelected
            ? "bg-brand/10 text-brand"
            : "text-ink hover:bg-slate-50 hover:text-brand",
          isDragOver ? "bg-brand/5 ring-2 ring-brand/30" : "",
        ].join(" ")}
        style={{ paddingLeft: 8 + level * 14 }}
        onClick={() => onSelect(node.folderId)}
      >
        <button
          type="button"
          className={[
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition",
            canExpand ? "hover:bg-slate-100" : "opacity-0",
          ].join(" ")}
          onClick={(event) => {
            event.stopPropagation();
            if (canExpand) onToggleExpand(node.folderId);
          }}
        >
          <RightOutlined
            className={[
              "text-[10px] text-muted transition-transform",
              isExpanded ? "rotate-90" : "",
            ].join(" ")}
          />
        </button>

        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-300">
          {canDragFolder ? <HolderOutlined /> : null}
        </span>

        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
          {isExpanded ? (
            <FolderOpenOutlined className="text-amber-500" />
          ) : (
            <FolderOutlined className="text-amber-500" />
          )}
        </span>

        <Tooltip title={node.name}>
          <span className="min-w-0 flex-1 truncate font-medium">
            {node.name}
          </span>
        </Tooltip>

        <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-muted">
          {documentCount}
        </span>

        {canManage && (
          <Dropdown
            trigger={["click"]}
            menu={{ items: menuItems, onClick: handleMenuClick }}
          >
            <Button
              size="small"
              type="text"
              icon={<MoreOutlined />}
              className="opacity-0 transition group-hover:opacity-100"
              onClick={(event) => event.stopPropagation()}
            />
          </Dropdown>
        )}
      </div>

      {isExpanded && (hasChildren || hasDocuments) && (
        <div className="mt-0.5 space-y-0.5">
          {children.map((child) => (
            <TreeNodeItem
              key={child.folderId}
              node={child}
              level={level + 1}
              treeRoots={treeRoots}
              selectedId={selectedId}
              selectedDocumentId={selectedDocumentId}
              expandedIds={expandedIds}
              dragOverFolderId={dragOverFolderId}
              canManage={canManage}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onSelectDocument={onSelectDocument}
              onCreateChild={onCreateChild}
              onRename={onRename}
              onDelete={onDelete}
              onMoveFolder={onMoveFolder}
              onMoveDocument={onMoveDocument}
              onSetDragOverFolder={onSetDragOverFolder}
            />
          ))}

          {documents.map((doc) => (
            <FolderDocumentRow
              key={doc.documentId}
              doc={doc}
              folderId={node.folderId}
              level={level}
              selectedDocumentId={selectedDocumentId}
              canManage={canManage && Boolean(onMoveDocument)}
              onSelectDocument={onSelectDocument}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocFolderTree({
  roots,
  loading = false,
  selectedId,
  selectedDocumentId = null,
  totalCount = 0,
  canManage = false,
  onSelect,
  onSelectDocument,
  onCreateRoot,
  onCreateChild,
  onRename,
  onDelete,
  onMoveFolder,
  onMoveDocument,
  showAllDocuments = true,
}: DocFolderTreeProps) {
  const { t } = useLocale();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const selectedPath = useMemo(
    () => findPathToFolder(roots, selectedId),
    [roots, selectedId],
  );

  const visibleExpandedIds = useMemo(() => {
    const next = new Set(expandedIds);

    selectedPath.forEach((folderId) => {
      next.add(folderId);
    });

    return next;
  }, [expandedIds, selectedPath]);

  const toggleExpand = (folderId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }

      return next;
    });
  };

  const handleDropToRoot = async (event: DragEvent<HTMLDivElement>) => {
    if (!canManage || !onMoveFolder) return;

    event.preventDefault();
    event.stopPropagation();

    setDragOverFolderId(null);

    const payload = readDragPayload(event);
    if (!payload || payload.kind !== "folder") return;

    await onMoveFolder(payload.folderId, null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("document.folder.sidebar_title")}
          </p>

          <p className="text-[11px] text-muted">
            {formatI18n(t("document.folder.sidebar_count"), {
              count: totalCount,
            })}
          </p>
        </div>

        {canManage && (
          <Tooltip title={t("document.folder.new")}>
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={onCreateRoot}
            />
          </Tooltip>
        )}
      </div>

      {showAllDocuments && (
        <div
          className={[
            "mb-2 flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm transition",
            selectedId === null
              ? "bg-brand/10 text-brand"
              : "text-ink hover:bg-slate-50 hover:text-brand",
          ].join(" ")}
          onClick={() => onSelect(null)}
          onDragOver={(event) => {
            if (!canManage || !onMoveFolder) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={handleDropToRoot}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <FileTextOutlined />
          </span>

          <span className="min-w-0 flex-1 truncate font-semibold">
            {t("document.folder.all_documents")}
          </span>

          <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-muted">
            {totalCount}
          </span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-2 px-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-stroke bg-white px-3 py-2"
              >
                <Skeleton
                  active
                  title={false}
                  paragraph={{ rows: 1, width: "80%" }}
                />
              </div>
            ))}
          </div>
        ) : roots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stroke bg-slate-50 px-3 py-6">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-xs text-muted">
                  {t("document.folder.empty")}
                </span>
              }
            />

            {canManage && (
              <div className="mt-3 flex justify-center">
                <Button
                  size="small"
                  type="dashed"
                  icon={<FolderAddOutlined />}
                  onClick={onCreateRoot}
                >
                  {t("document.folder.new")}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {roots.map((node) => (
              <TreeNodeItem
                key={node.folderId}
                node={node}
                level={0}
                treeRoots={roots}
                selectedId={selectedId}
                selectedDocumentId={selectedDocumentId}
                expandedIds={visibleExpandedIds}
                dragOverFolderId={dragOverFolderId}
                canManage={canManage}
                onToggleExpand={toggleExpand}
                onSelect={onSelect}
                onSelectDocument={onSelectDocument}
                onCreateChild={onCreateChild}
                onRename={onRename}
                onDelete={onDelete}
                onMoveFolder={onMoveFolder}
                onMoveDocument={onMoveDocument}
                onSetDragOverFolder={setDragOverFolderId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
