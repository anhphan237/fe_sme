/** @jsxImportSource @emotion/react */
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { css } from "@emotion/react";
import Table from "antd/es/table";
import Popover from "antd/es/popover";
import Checkbox from "antd/es/checkbox";
import type {
  TablePaginationConfig,
  TableProps,
  ColumnsType,
} from "antd/es/table";
import clsx from "clsx";
import { GripVertical, SlidersHorizontal, RotateCcw } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import usePrevious from "@/hooks/usePrevious";

// ── Draggable column header ─────────────────────────────────────────────────

const SortableHeaderCell = ({
  columnKey,
  children,
  style,
  ...rest
}: {
  columnKey: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  [key: string]: unknown;
}) => {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({ id: columnKey });

  return (
    <th
      ref={setNodeRef}
      style={{
        ...style,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        ...(isDragging ? { position: "relative", zIndex: 1 } : {}),
      }}
      {...rest}>
      <span
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        style={{
          display: "inline-flex",
          alignItems: "center",
          marginRight: 4,
          cursor: isDragging ? "grabbing" : "grab",
          color: "#d1d5db",
          lineHeight: 1,
          flexShrink: 0,
          verticalAlign: "middle",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "#6b7280";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "#d1d5db";
        }}>
        <GripVertical size={12} strokeWidth={2.5} />
      </span>
      {children}
    </th>
  );
};

const DraggableHeaderCell = ({
  "data-column-key": columnKey,
  children,
  style,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  "data-column-key"?: string;
}) => {
  if (!columnKey) {
    return (
      <th style={style} {...rest}>
        {children}
      </th>
    );
  }
  return (
    <SortableHeaderCell columnKey={columnKey} style={style} {...(rest as any)}>
      {children}
    </SortableHeaderCell>
  );
};

// ── Column visibility button ────────────────────────────────────────────────

const ColumnFilterButton = ({
  columns,
  hiddenKeys,
  onToggle,
  onReset,
}: {
  columns: { key: string; label: React.ReactNode }[];
  hiddenKeys: Set<string>;
  onToggle: (key: string) => void;
  onReset: () => void;
}) => {
  const hiddenCount = hiddenKeys.size;

  const content = (
    <div style={{ minWidth: 190 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: "1px solid #f3f4f6",
        }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
          {columns.length - hiddenCount} / {columns.length} hiển thị
        </span>
        <button
          onClick={onReset}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6b7280",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 3,
            padding: "2px 6px",
            borderRadius: 4,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "#111827")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.color = "#6b7280")
          }>
          <RotateCcw size={11} />
          Reset
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {columns.map((col) => (
          <Checkbox
            key={col.key}
            checked={!hiddenKeys.has(col.key)}
            onChange={() => onToggle(col.key)}
            style={{ fontSize: 13, color: "#374151" }}>
            {col.label}
          </Checkbox>
        ))}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      overlayInnerStyle={{ padding: "12px 14px" }}>
      <button
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          color: "#374151",
          cursor: "pointer",
          lineHeight: 1.5,
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.borderColor = "#9ca3af")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb")
        }>
        <SlidersHorizontal size={13} />
        Columns
        {hiddenCount > 0 && (
          <span
            style={{
              background: "#111827",
              color: "#fff",
              borderRadius: 20,
              padding: "1px 6px",
              fontSize: 10,
              lineHeight: 1.6,
              fontWeight: 600,
            }}>
            -{hiddenCount}
          </span>
        )}
      </button>
    </Popover>
  );
};

// ── MyTable ────────────────────────────────────────────────────────────────

export interface MyTableProps<T extends object> extends TableProps<T> {
  height?: string;
  wrapClassName?: string;
  /**
   * Enables drag-to-reorder column headers via @dnd-kit.
   * Columns must have a `key` prop set.
   */
  draggableColumns?: boolean;
  /**
   * Shows a column visibility toggle button above the table.
   * Columns must have a `key` prop set. `title` is used as the label.
   */
  columnFilter?: boolean;
}

const MyTable = <T extends object = object>({
  height,
  pagination,
  wrapClassName = "",
  size = "large",
  dataSource,
  columns: columnsProp,
  draggableColumns = false,
  columnFilter = false,
  components,
  ...rest
}: MyTableProps<T>) => {
  const defaultPagination: TablePaginationConfig = {
    showQuickJumper: true,
    showSizeChanger: true,
    pageSizeOptions: ["10", "20", "50", "100"],
    defaultPageSize: 20,
  };

  // ── Column keys derived from prop ─────────────────────────────────────
  const columnKeys = useMemo(
    () =>
      (columnsProp ?? [])
        .map((c) => String((c as any).key ?? ""))
        .filter(Boolean),
    [columnsProp],
  );

  // ── Drag: column order state ──────────────────────────────────────────
  const [columnOrder, setColumnOrder] = useState<string[]>(() => columnKeys);

  // Sync order when columns fundamentally change (different set of keys)
  const prevKeysSigRef = useRef(columnKeys.join(","));
  useEffect(() => {
    const current = columnKeys.join(",");
    if (prevKeysSigRef.current === current) return;
    const prevSet = new Set(prevKeysSigRef.current.split(",").filter(Boolean));
    const nextSet = new Set(columnKeys);
    const sameSet =
      prevSet.size === nextSet.size &&
      [...nextSet].every((k) => prevSet.has(k));
    prevKeysSigRef.current = current;
    if (!sameSet) setColumnOrder(columnKeys);
  }, [columnKeys]);

  // ── Filter: hidden column keys ────────────────────────────────────────
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

  const toggleKey = useCallback((key: string) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const resetKeys = useCallback(() => setHiddenKeys(new Set()), []);

  // ── DnD sensors ───────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setColumnOrder((prev) => {
        const from = prev.indexOf(String(active.id));
        const to = prev.indexOf(String(over.id));
        return from !== -1 && to !== -1 ? arrayMove(prev, from, to) : prev;
      });
    }
  }, []);

  // ── Derived columns (re-ordered + filtered + drag-wired) ─────────────
  const derivedColumns = useMemo((): ColumnsType<T> | undefined => {
    if (!columnsProp) return columnsProp as undefined;

    let cols = [...columnsProp];

    // 1. Re-order by drag state
    if (draggableColumns && columnOrder.length > 0) {
      cols = cols.sort((a, b) => {
        const ai = columnOrder.indexOf(String((a as any).key ?? ""));
        const bi = columnOrder.indexOf(String((b as any).key ?? ""));
        return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
      });
    }

    // 2. Hide invisible columns
    if (columnFilter && hiddenKeys.size > 0) {
      cols = cols.filter((c) => !hiddenKeys.has(String((c as any).key ?? "")));
    }

    // 3. Inject drag-id into onHeaderCell
    if (draggableColumns) {
      cols = cols.map((col) => ({
        ...col,
        onHeaderCell: (column: any) => {
          const base = (col as any).onHeaderCell?.(column) ?? {};
          const key = String((col as any).key ?? "");
          return { ...base, "data-column-key": key || undefined };
        },
      }));
    }

    return cols as ColumnsType<T>;
  }, [columnsProp, draggableColumns, columnFilter, columnOrder, hiddenKeys]);

  // ── Pagination ────────────────────────────────────────────────────────
  const isShowFullContent = (dataSource?.length ?? 0) > 7;
  const isEmpty = dataSource?.length === 0;

  const previousPageSize = usePrevious<number>(
    pagination === false
      ? 0
      : ((pagination as TablePaginationConfig)?.pageSize ?? 0),
  );

  const handlePageChange = (page: number, pageSize: number) => {
    if (typeof pagination !== "object") return;
    const { onChange } = (pagination as TablePaginationConfig) ?? {};
    const resolvedPage =
      previousPageSize && previousPageSize !== pageSize ? 1 : page;
    onChange?.(resolvedPage, pageSize);
  };

  let combinedPagination: TablePaginationConfig | false = {
    ...defaultPagination,
  };
  if (pagination === false) {
    combinedPagination = false;
  } else if (typeof pagination === "object") {
    combinedPagination = {
      ...defaultPagination,
      ...pagination,
      onChange: handlePageChange,
    };
  }

  // ── Column filter metadata (for popover labels) ───────────────────────
  const columnFilterMeta = useMemo(
    () =>
      (columnsProp ?? [])
        .map((col) => ({
          key: String((col as any).key ?? ""),
          label:
            ((col as any).title as React.ReactNode) ?? (col as any).key ?? "",
        }))
        .filter((c) => c.key),
    [columnsProp],
  );

  // ── Components override for drag ──────────────────────────────────────
  const tableComponents = draggableColumns
    ? {
        ...components,
        header: {
          ...(components as any)?.header,
          cell: DraggableHeaderCell,
        },
      }
    : components;

  // ── Styles ────────────────────────────────────────────────────────────
  const styles = css`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    background: #ffffff;

    .ant-table-wrapper,
    .ant-spin-nested-loading,
    .ant-spin-container,
    .ant-table-container {
      height: 100%;
    }

    /* ── Header ── */
    .ant-table-wrapper .ant-table-thead > tr > th,
    .ant-table-wrapper .ant-table-thead > tr > td {
      background: #fafafa !important;
      color: #111827 !important;
      font-weight: 600 !important;
      font-size: 12.5px !important;
      letter-spacing: 0.01em;
      border-bottom: 1px solid #e5e7eb !important;
      white-space: nowrap;
    }

    .ant-table-wrapper .ant-table-thead > tr:not(:last-child) > th[colspan] {
      border-bottom: 1px solid #e5e7eb !important;
    }

    .ant-table-wrapper
      .ant-table-thead
      > tr
      > th:not(:last-child):not(.ant-table-selection-column):not(
        .ant-table-row-expand-icon-cell
      ):not([colspan])::before,
    .ant-table-wrapper
      .ant-table-thead
      > tr
      > td:not(:last-child):not(.ant-table-selection-column):not(
        .ant-table-row-expand-icon-cell
      ):not([colspan])::before {
      height: 60% !important;
      background-color: #d1d5db !important;
    }

    .ant-table-wrapper
      .ant-table:not(.ant-table-ping-right)
      .ant-table-container
      table
      > thead
      > tr:first-child
      > *:last-child {
      border-left: 1px solid #f3f4f6;
    }

    /* Sort icons */
    .ant-table-wrapper .ant-table-column-sorter {
      color: #9ca3af !important;
    }
    .ant-table-wrapper .ant-table-column-sorter-up.active,
    .ant-table-wrapper .ant-table-column-sorter-down.active {
      color: #374151 !important;
    }

    /* Ant Data filter trigger */
    .ant-table-wrapper .ant-table-filter-trigger {
      color: #9ca3af !important;
    }
    .ant-table-wrapper .ant-table-filter-trigger:hover,
    .ant-table-wrapper .ant-table-filter-trigger.active {
      color: #374151 !important;
      background: #f3f4f6 !important;
    }

    /* Sorted column */
    .ant-table-wrapper .ant-table-column-sort {
      background: #f9fafb !important;
    }

    /* ── Body rows ── */
    .ant-table-wrapper .ant-table-tbody > tr > td {
      background: #ffffff;
      border-bottom: 1px solid #f3f4f6 !important;
      color: #374151;
      font-size: 13px;
      transition: background 0.12s ease;
    }

    /* Hover */
    .ant-table-wrapper .ant-table-tbody > tr:hover > td,
    .ant-table-wrapper .ant-table-tbody > tr.ant-table-row-hover > td {
      background: #f9fafb !important;
    }

    /* Selected row */
    .ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected > td {
      background: #f3f4f6 !important;
    }

    /* ── Scrollbar ── */
    .ant-table-body {
      &::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }
      &::-webkit-scrollbar-track {
        background: #f9fafb;
        border-radius: 3px;
      }
      &::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 3px;
        &:hover {
          background: #9ca3af;
        }
      }
    }

    .ant-spin-container {
      overflow: hidden;
      display: flex;
      flex-direction: column;

      .ant-table {
        flex: 1;
        overflow: hidden;

        .ant-table-container {
          display: flex;
          flex-direction: column;
          .ant-table-body {
            flex: 1;
            table {
              height: ${isShowFullContent ? "100%" : "auto !important"};
            }
          }
        }
      }

      .ant-pagination {
        padding: 10px 16px !important;
        margin: 0 !important;
        border-top: 1px solid #f3f4f6;
        background: #ffffff;
        border-radius: 0 0 8px 8px;
      }
    }
  `;

  // ── Table element ─────────────────────────────────────────────────────
  const tableNode = (
    <Table<T>
      pagination={combinedPagination}
      size={size}
      scroll={{
        x: isEmpty ? undefined : "max-content",
        y: isEmpty ? undefined : "100%",
      }}
      dataSource={dataSource}
      columns={derivedColumns}
      components={tableComponents}
      {...rest}
    />
  );

  return (
    <div
      style={{ height }}
      css={styles}
      className={clsx(wrapClassName, "!w-full !h-full")}>
      {columnFilter && columnFilterMeta.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "8px 12px",
            flexShrink: 0,
            borderBottom: "1px solid #f3f4f6",
          }}>
          <ColumnFilterButton
            columns={columnFilterMeta}
            hiddenKeys={hiddenKeys}
            onToggle={toggleKey}
            onReset={resetKeys}
          />
        </div>
      )}
      {draggableColumns ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}>
          <SortableContext
            items={columnOrder}
            strategy={horizontalListSortingStrategy}>
            {tableNode}
          </SortableContext>
        </DndContext>
      ) : (
        tableNode
      )}
    </div>
  );
};

MyTable.Column = Table.Column;
MyTable.ColumnGroup = Table.ColumnGroup;

export default MyTable;
