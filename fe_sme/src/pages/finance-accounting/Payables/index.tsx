import { apiSearchDebtPayables, apiSearchPayables } from '@/api/finance-accounting.api';
import { ParamsGetList } from '@/api/request';
import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DateRangeFilter from '@/components/custom-range-picker';
import Search from '@/components/search';
import PayablesTable from '@/components/table';

import { formatDateTime } from '@/utils/format-datetime';
import { formatMoney, saveDebtInfoLocalStorage } from '@/utils/helpers';

const { Column } = PayablesTable;

interface ColumnType {
    id: string;
    customerId: string;
    documentNumber: string;
    documentDate: string;
    debtType: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
}

interface IProps {
    customerId?: string;
}

const Payables = ({ customerId }: IProps) => {
    const { t } = useLocale();
    const navigate = useNavigate();

    const [filter, setFilter] = useState<ParamsGetList>({
        pageSize: 10,
        pageNumber: 1,
        filter: {
            searchValue: '',
        },
        ...(customerId && { customerId }),
    });

    const { data } = useQuery({
        queryKey: ['getListPayables', filter],
        queryFn: async () => {
            const res = customerId ? await apiSearchDebtPayables(filter, { loading: false }) : await apiSearchPayables(filter, { loading: false });
            return res;
        },
    });

    return (
        <div
            className={clsx('h-full flex flex-col p-4', {
                '!p-0': !!customerId,
            })}
        >
            <div className="flex gap-2 justify-end mb-2 mx-2">
                <DateRangeFilter
                    onChange={({ fromDate, toDate }) => {
                        setFilter({
                            ...filter,
                            pageNumber: 1,
                            filter: {
                                ...filter.filter,
                                ...(fromDate ? { range: { from: fromDate.toISOString(), to: toDate?.toISOString() } } : { range: undefined }),
                            },
                        });
                    }}
                />
                <Search
                    placeholder={t('global.search_table')}
                    allowClear
                    className="btn-search-table"
                    onSearch={value => {
                        setFilter({ ...filter, pageNumber: 1, filter: { ...filter.filter, searchValue: value } });
                    }}
                />
            </div>

            <PayablesTable<ColumnType>
                dataSource={data?.data || []}
                rowKey={record => record.id}
                pagination={{
                    current: filter.pageNumber,
                    pageSize: filter.pageSize,
                    total: data?.totalItems,
                    onChange: (page, pageSize) => {
                        setFilter({ ...filter, pageNumber: page, pageSize });
                    },
                }}
            >
                <Column
                    title={<div className="flex justify-center items-center">{t('category.list.index')}</div>}
                    dataIndex="index"
                    width={50}
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('expense_ticket.invoice_number')}
                    dataIndex="documentNumber"
                    onCell={() => ({ width: 160 })}
                    onHeaderCell={() => ({ style: { width: 160, minWidth: 160 } })}
                    key="documentNumber"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span
                                    className="cursor-pointer"
                                    onClick={() => {
                                        saveDebtInfoLocalStorage(
                                            {
                                                totalAmount: record.totalAmount,
                                                paidAmount: record.paidAmount,
                                                remainingAmount: record.remainingAmount,
                                            },
                                            record.id,
                                        );
                                        navigate(customerId ? `${AppRouters.DEBT_TRANSACTION}/${record.id}` : `${AppRouters.PAYABLES}/${record.id}`);
                                    }}
                                >
                                    {record?.documentNumber}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    ellipsis
                    title={t('expense_ticket.invoice_date')}
                    dataIndex="documentDate"
                    key="documentDate"
                    onCell={() => ({ width: 160 })}
                    onHeaderCell={() => ({ style: { width: 160, minWidth: 160 } })}
                    render={(_, record: ColumnType) => formatDateTime(record?.documentDate, 'DD-MM-YYYY')}
                />
                <Column
                    title={t('order.list.total_amount')}
                    ellipsis
                    dataIndex="totalAmount"
                    align="right"
                    onCell={() => ({ width: 160 })}
                    onHeaderCell={() => ({ style: { width: 160, minWidth: 160 } })}
                    key="totalAmount"
                    render={(_, record: ColumnType) => formatMoney(record?.totalAmount)}
                />
                <Column
                    title={t('finance_accounting.collected')}
                    ellipsis
                    dataIndex="paidAmount"
                    align="right"
                    onCell={() => ({ width: 160 })}
                    onHeaderCell={() => ({ style: { width: 160, minWidth: 160 } })}
                    key="paidAmount"
                    render={(_, record: ColumnType) => formatMoney(record?.paidAmount)}
                />
                <Column
                    title={t('finance_accounting.owed')}
                    ellipsis
                    onCell={() => ({ width: 160 })}
                    onHeaderCell={() => ({ style: { width: 160, minWidth: 160 } })}
                    dataIndex="remainingAmount"
                    align="right"
                    key="remainingAmount"
                    render={(_, record: ColumnType) => formatMoney(record?.remainingAmount)}
                />
            </PayablesTable>
        </div>
    );
};

export default Payables;
