import { apiSearchDebtPayablesSupplier } from '@/api/finance-accounting.api';
import { ParamsGetList } from '@/api/request';
import { AppRouters, DefaultMappingPermission } from '@/constants';
import ExportModal, { ExportModalRef } from '@/core/components/FileManager/ExportModal';
import { useLocale } from '@/i18n';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Checkbox, Tag } from 'antd';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import DebtTrackingPayablesTable from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { FileHelper, formatMoney } from '@/utils/helpers';

const { Column } = DebtTrackingPayablesTable;

interface ColumnType {
    supplierId: string;
    supplierName: string;
    supplierCode: string;
    supplierTypeName: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    totalRefund: number;
    type: number;
}

const DebtTrackingPayables = () => {
    const { t } = useLocale();
    const navigate = useNavigate();
    const [filter, setFilter] = useState<ParamsGetList>({
        pageSize: 10,
        pageNumber: 1,
        filter: {
            searchValue: '',
        },
        isChecked: true,
    });
    const exportRef = useRef<ExportModalRef>(null);
    const canExport = useCheckIsFullPermission(DefaultMappingPermission['FinanceReport']);

    const { data } = useQuery({
        queryKey: ['getListDebtPayablesSupplier', filter],
        queryFn: async () => {
            const res = await apiSearchDebtPayablesSupplier(filter);
            return res;
        },
    });
    const handleExportDebt = async () => {
        try {
            const response = await exportRef.current?.open([]);
            FileHelper.downloadFileFromResponse(response as any);
            notify.success(t('global.message.export_success'));
        } catch {}
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between items-center gap-2 mb-3 mx-2">
                <div className="flex gap-4 items-center ">
                    <div className="relative flex flex-col items-center p-2 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-2 py-1 bg-white shadow text-center font-medium rounded-lg mb-4 absolute top-[-15px] right-4 ">
                            <span className="text-xs whitespace-normal text-center ">{t('finance_accounting.payment_slip.totalAmount')}</span>
                        </div>
                        <strong className="text-black text-base my-2">{formatMoney(data?.totalAmount || 0)}</strong>
                    </div>

                    <div className="relative flex flex-col items-center p-2 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-2 py-1 bg-white shadow text-center font-medium rounded-lg mb-4 absolute top-[-15px] right-4">
                            <span className="text-xs whitespace-normal text-center ">{t('finance_accounting.payables.paid')}</span>
                        </div>
                        <strong className="text-black text-base my-2">{formatMoney(data?.totalPaidAmount || 0)}</strong>
                    </div>

                    <div className="relative flex flex-col items-center p-2 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-2 py-1 bg-white shadow text-center font-medium rounded-lg mb-4 absolute top-[-15px] right-4">
                            <span className="text-xs whitespace-normal text-center ">{t('finance_accounting.payables.owedAmount')}</span>
                        </div>
                        <strong className="text-green-600 text-base my-2">{formatMoney(data?.totalRemainingAmount || 0)}</strong>
                    </div>

                    <div className="relative flex flex-col items-center p-2 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="px-2 py-1 bg-white shadow text-center font-medium rounded-lg mb-4 absolute top-[-15px] right-4">
                            <span className="text-xs whitespace-normal text-center ">{t('finance_accounting.refund')}</span>
                        </div>
                        <strong className="text-black text-base my-2">{formatMoney(data?.totalRefund || 0)}</strong>
                    </div>
                </div>

                <div className="flex items-center gap-2 ">
                    <Checkbox
                        className="w-36"
                        checked={filter.isChecked}
                        onChange={e => setFilter({ ...filter, pageNumber: 1, isChecked: e.target.checked })}
                    >
                        <strong>{t('finance_accounting.payables.owedAmount')}</strong>
                    </Checkbox>
                    <BaseButton
                        onClick={handleExportDebt}
                        label={t('export.title')}
                        icon={<FontAwesomeIcon icon={faDownload} />}
                        disabled={!canExport}
                    />
                    <Search
                        placeholder={t('global.search_table')}
                        allowClear
                        className="btn-search-table "
                        onSearch={value => setFilter({ ...filter, pageNumber: 1, filter: { searchValue: value } })}
                    />
                </div>
            </div>

            <DebtTrackingPayablesTable<ColumnType>
                dataSource={data?.data || []}
                rowKey={record => record.supplierId}
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
                    onCell={() => ({ width: 50 })}
                    onHeaderCell={() => ({ style: { width: 50 } })}
                    fixed="left"
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('finance_accounting.partner')}
                    dataIndex="supplierName"
                    key="supplierName"
                    fixed="left"
                    width={400}
                    render={(_, record: ColumnType) => {
                        return (
                            <div
                                className="text-blue-500 font-medium truncate max-w-[600px] cursor-pointer"
                                onClick={() =>
                                    navigate(`${AppRouters.DEBT_TRACKING_PAYABLE}/${record.supplierId}`, {
                                        state: { type: record.type },
                                    })
                                }
                            >
                                {record?.supplierName}
                            </div>
                        );
                    }}
                />
                <Column
                    title={t('finance_accounting.type')}
                    dataIndex="type"
                    key="type"
                    width={150}
                    align="center"
                    render={(_, record: ColumnType) => {
                        return (
                            <Tag color={record.type === 0 ? 'blue' : 'orange'}>
                                {record.type === 0 ? t('finance_accounting.customer') : t('finance_accounting.supplier')}
                            </Tag>
                        );
                    }}
                />
                <Column
                    ellipsis
                    width={200}
                    title={t('finance_accounting.group')}
                    dataIndex="supplierTypeName"
                    key="supplierTypeName"
                    className="max-w-96"
                />
                <Column
                    title={t('finance_accounting.payment_slip.totalAmount')}
                    ellipsis
                    width={200}
                    align="right"
                    dataIndex="totalAmount"
                    key="totalAmount"
                    render={(_, record: ColumnType) => formatMoney(record?.totalAmount)}
                />
                <Column
                    title={t('finance_accounting.payables.paid')}
                    ellipsis
                    width={200}
                    align="right"
                    dataIndex="paidAmount"
                    key="paidAmount"
                    render={(_, record: ColumnType) => formatMoney(record?.paidAmount)}
                />
                <Column
                    title={t('finance_accounting.payables.owedAmount')}
                    ellipsis
                    width={200}
                    align="right"
                    dataIndex="remainingAmount"
                    key="remainingAmount"
                    render={(_, record: ColumnType) => <span className="font-semibold text-green-600">{formatMoney(record?.remainingAmount)}</span>}
                />

                <Column
                    title={t('finance_accounting.receivables.totalRefund')}
                    ellipsis
                    width={160}
                    minWidth={160}
                    dataIndex="totalRefund"
                    align="right"
                    key="totalRefund"
                    render={(_, record: ColumnType) => formatMoney(record?.totalRefund)}
                />
            </DebtTrackingPayablesTable>
            <ExportModal
                ref={exportRef}
                submitLabel={t('global.download')}
                title={t('export.title')}
                urlPath="debt-tracking"
                showDateFilter={false}
                showStatusFilter={false}
                showCheckboxFilter={true}
                checkboxLabel={t('finance_accounting.payables.owedAmount')}
                defaultChecked={filter.isChecked}
                additionalParams={{ isPurchase: true }}
            />
        </div>
    );
};

export default DebtTrackingPayables;
