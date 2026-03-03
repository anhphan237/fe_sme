/**
 * DataTable - ported from PMS internal system
 * Ant Design Table wrapper with pagination defaults, empty state, auto-scroll
 *
 * @example
 * <DataTable
 *   dataSource={users}
 *   columns={columns}
 *   loading={isLoading}
 *   pagination={{
 *     current: page,
 *     pageSize: 20,
 *     total: totalCount,
 *     onChange: (page) => setPage(page),
 *   }}
 * />
 */
import Table from "antd/es/table";
import type { TablePaginationConfig, TableProps } from "antd/es/table";
import { clsx } from "clsx";
import usePrevious from "@/hooks/usePrevious";

export interface DataTableProps<T extends object> extends TableProps<T> {
  height?: string;
  wrapClassName?: string;
}

function DataTable<T extends object = object>({
  height,
  pagination,
  wrapClassName = "",
  size = "middle",
  dataSource,
  ...rest
}: DataTableProps<T>) {
  const currentPageSize =
    typeof pagination === "object"
      ? ((pagination as TablePaginationConfig).pageSize ?? 20)
      : 20;
  const prevPageSize = usePrevious(currentPageSize);

  const defaultPagination: TablePaginationConfig = {
    size: "small",
    showQuickJumper: true,
    showSizeChanger: true,
    pageSizeOptions: ["10", "20", "50", "100"],
    defaultPageSize: 20,
    showTotal: (total) => `Tổng ${total} bản ghi`,
  };

  const isEmpty = (dataSource?.length ?? 0) === 0;
  const isScrollable = (dataSource?.length ?? 0) > 7;

  const handlePageChange = (page: number, pageSize: number) => {
    if (typeof pagination !== "object") return;
    const { onChange } = (pagination as TablePaginationConfig) || {};
    // Reset to first page when pageSize changes
    const resolvedPage =
      prevPageSize !== undefined && prevPageSize !== pageSize ? 1 : page;
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

  return (
    <div style={{ height }} className={clsx(wrapClassName, "w-full")}>
      <Table<T>
        pagination={combinedPagination}
        size={size}
        scroll={{
          x: isEmpty ? undefined : "max-content",
          y: isScrollable && height ? "100%" : undefined,
        }}
        dataSource={dataSource}
        rowKey={(record: any) =>
          record?.id ?? record?.key ?? Math.random().toString()
        }
        {...rest}
      />
    </div>
  );
}

export default DataTable;
