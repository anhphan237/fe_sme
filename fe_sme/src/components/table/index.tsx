import { css } from '@emotion/react';
import Table, { TablePaginationConfig, TableProps } from 'antd/es/table';
import clsx from 'clsx';

import usePrevious from '@/hooks/usePrevious';

export interface MyTableProps<T extends object> extends TableProps<T> {
    height?: string;
    wrapClassName?: string;
}

const MyTable = <T extends object = object>({ height, pagination, wrapClassName = '', size = 'large', dataSource, ...rest }: MyTableProps<T>) => {
    const defaultPagination = {
        size: 'default',
        showQuickJumper: true,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        defaultPageSize: 20,
    };
    const isShowFullContent = (dataSource?.length || 0) > 7;
    const isEmpty = dataSource?.length === 0;
    const styles = css`
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .ant-table-wrapper,
        .ant-spin-nested-loading,
        .ant-spin-container,
        .ant-table-container {
            height: 100%;
        }
        .ant-table-wrapper .ant-table-thead > tr:not(:last-child) > th[colspan] {
            border-bottom: 1px solid #f0f0f0;
        }
        .ant-table-wrapper
            .ant-table-thead
            > tr
            > th:not(:last-child):not(.ant-table-selection-column):not(.ant-table-row-expand-icon-cell):not([colspan])::before,
        .ant-table-wrapper
            .ant-table-thead
            > tr
            > td:not(:last-child):not(.ant-table-selection-column):not(.ant-table-row-expand-icon-cell):not([colspan])::before {
            height: 100%;
        }
        .ant-table-wrapper .ant-table:not(.ant-table-ping-right) .ant-table-container table > thead > tr:first-child > *:last-child {
            border-left: 1px solid #f0f0f0;
        }
        .ant-spin-container {
            overflow: hidden;
            display: flex;
            flex-direction: column;

            .ant-table {
                flex: 1;
                overflow: hidden;
                border-bottom: 1px solid #eee;

                .ant-table-container {
                    display: flex;
                    flex-direction: column;
                    .ant-table-body {
                        flex: 1;
                        table {
                            height: ${isShowFullContent ? '100%' : 'auto !important'};
                        }
                    }
                }
            }

            .ant-pagination {
                padding: 0 10px;
            }
        }
    `;

    const previousPageSize = usePrevious<number>(pagination === false ? 0 : (pagination?.pageSize ?? 0));

    const handleChange = (page: number, pageSize: number) => {
        if (typeof pagination !== 'object') return;
        const { onChange } = (pagination as TablePaginationConfig) || {};
        if (previousPageSize && previousPageSize !== pageSize) {
            page = 1;
        }
        onChange?.(page, pageSize);
    };

    let combinedPagination: any = { ...defaultPagination };
    if (pagination === false) {
        combinedPagination = false;
    } else if (typeof pagination === 'object') {
        combinedPagination = { ...defaultPagination, ...pagination, onChange: handleChange };
    }
    return (
        <div style={{ height }} css={styles} className={clsx(wrapClassName, '!w-full !h-full px-2')}>
            <Table<T>
                pagination={combinedPagination as TablePaginationConfig}
                size={size}
                scroll={{ x: isEmpty ? undefined : 'max-content', y: isEmpty ? undefined : '100%' }}
                dataSource={dataSource}
                {...rest}
            />
        </div>
    );
};

MyTable.Column = Table.Column;
MyTable.ColumnGroup = Table.ColumnGroup;

export default MyTable;
