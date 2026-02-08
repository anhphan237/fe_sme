import { apiSearchPurchaseContractFromGoodSearch, apiSearchSalesContractFromIssue } from '@/api/contract.api';
import { ParamsGetList } from '@/api/request';
import { AppRouters } from '@/constants';
import BaseSelect from '@/core/components/Select/BaseSelect';
import WarehouseTag from '@/core/components/Status/WarehouseTag';
import { WarehouseStatus } from '@/enums/Warehouse';
import { useLocale } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { Checkbox, DatePicker } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Search from '@/components/search';
import ProductTable from '@/components/table';

import { formatDateTime } from '@/utils/format-datetime';
import { InputHelper, getWarehouseExportStatusLabel, getWarehouseStatus, saveWarehouseTransactionInfo } from '@/utils/helpers';

const { Column } = ProductTable;
const { RangePicker } = DatePicker;

interface ColumnType {
    id: string;
    invoice: string;
    totalQuantity: number;
    receiptDate: string;
    deliveryDate: string;
    customerName: string;
    customerContactPerson: string;
    customerContactPersonPhone: string;
    invoiceDate: string;
    quantityReceive: number;
    quantityPending: number;
    goodsTransactionStatus: number;
}

interface IFilter extends ParamsGetList {
    hasIssueReturn: boolean;
}

const ExportWarehouse = () => {
    const { t } = useLocale();
    const navigate = useNavigate();

    const [filter, setFilter] = useState<IFilter>({
        pageSize: 10,
        pageNumber: 1,
        search: '',
        range: {
            from: undefined,
            to: undefined,
        },
        hasIssueReturn: false,
        filters: [
            {
                key: 'goodsTransactionStatus',
                value: [WarehouseStatus.NOT_PROCESSED, WarehouseStatus.PARTIALLY_PROCESSED],
            },
        ],
    });

    const { data } = useQuery({
        queryKey: ['getListGoodsIssue', filter],
        queryFn: async () => {
            const cleanFilter = { ...filter };
            if (!cleanFilter.range?.from || !cleanFilter.range?.to) {
                delete cleanFilter.range;
            }
            const res = !filter.hasIssueReturn
                ? await apiSearchSalesContractFromIssue(cleanFilter)
                : await apiSearchPurchaseContractFromGoodSearch(cleanFilter);
            return res;
        },
    });

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-end items-center flex-wrap mb-2 mx-2 gap-2">
                <Checkbox
                    className="w-32"
                    checked={filter.hasIssueReturn}
                    value={filter.hasIssueReturn}
                    onChange={e => {
                        setFilter({ ...filter, pageNumber: 1, hasIssueReturn: e.target.checked });
                    }}
                >
                    {t('logistics.export_and_return')}
                </Checkbox>
                <RangePicker
                    onChange={dates => {
                        if (!dates || !dates[0] || !dates[1]) {
                            setFilter(prev => {
                                const { range, ...rest } = prev;
                                return rest;
                            });
                            return;
                        }

                        setFilter(prev => ({
                            ...prev,
                            pageNumber: 1,
                            range: {
                                from: dates[0]?.startOf('day')?.toISOString(),
                                to: dates[1]?.endOf('day')?.toISOString(),
                            },
                        }));
                    }}
                    allowClear
                    className="min-w-72"
                    placeholder={[t('global.from_date'), t('global.to_date')]}
                />
                <BaseSelect
                    name=""
                    mode="multiple"
                    className="w-72 min-w-72"
                    placeholder={t('global.status')}
                    maxTagCount="responsive"
                    value={filter.filters?.[0]?.value || []}
                    onChange={val => setFilter({ ...filter, pageNumber: 1, filters: [{ key: 'goodsTransactionStatus', value: val }] })}
                    options={[
                        { value: WarehouseStatus.NOT_PROCESSED, label: getWarehouseExportStatusLabel(WarehouseStatus.NOT_PROCESSED, t) },
                        { value: WarehouseStatus.PARTIALLY_PROCESSED, label: getWarehouseExportStatusLabel(WarehouseStatus.PARTIALLY_PROCESSED, t) },
                        { value: WarehouseStatus.COMPLETED, label: getWarehouseExportStatusLabel(WarehouseStatus.COMPLETED, t) },
                        { value: WarehouseStatus.CANCELED, label: getWarehouseExportStatusLabel(WarehouseStatus.CANCELED, t) },
                    ]}
                    allowClear
                    defaultValue={[WarehouseStatus.NOT_PROCESSED, WarehouseStatus.PARTIALLY_PROCESSED]}
                    showSearch={false}
                />
                <Search
                    placeholder={t('global.search_table')}
                    allowClear
                    className="btn-search-table min-w-72"
                    onSearch={value => {
                        setFilter({ ...filter, pageNumber: 1, search: value });
                    }}
                />
            </div>

            <ProductTable<ColumnType>
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
                    onCell={() => ({ style: { width: 50, maxWidth: 50 } })}
                    onHeaderCell={() => ({ style: { width: 50 } })}
                    fixed="left"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={filter.hasIssueReturn ? t('contract.sales') : t('menu.order')}
                    dataIndex="invoice"
                    width={140}
                    onCell={() => ({ style: { width: 140, maxWidth: 140 } })}
                    onHeaderCell={() => ({ style: { width: 140 } })}
                    key="invoice"
                    fixed="left"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span
                                    className="cursor-pointer"
                                    onClick={() => {
                                        saveWarehouseTransactionInfo(
                                            {
                                                orderName: record.invoice,
                                                totalQuantity: record.totalQuantity,
                                                remainingQuantity: record.quantityPending || 0,
                                                processedQuantity: record.quantityReceive || 0,
                                            },
                                            record.id,
                                        );
                                        navigate(`${AppRouters.EXPORT_WAREHOUSE}/${record.id}`);
                                    }}
                                >
                                    {record?.invoice}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    ellipsis
                    title={t('logistics.enter_warehouse.export_date')}
                    dataIndex="invoiceDate"
                    width={160}
                    onCell={() => ({ style: { width: 160, maxWidth: 160 } })}
                    onHeaderCell={() => ({ style: { width: 160 } })}
                    key="invoiceDate"
                    align="center"
                    render={(_, record: ColumnType) => formatDateTime(record?.invoiceDate, 'DD-MM-YYYY')}
                />
                <Column
                    title={<div>{t('global.partner')}</div>}
                    dataIndex="invoice"
                    width={160}
                    onCell={() => ({ style: { width: 160, maxWidth: 160 } })}
                    onHeaderCell={() => ({ style: { width: 160 } })}
                    key="invoice"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="font-medium flex flex-col gap-2">
                                <p>{record?.customerName}</p>
                            </div>
                        );
                    }}
                />
                <Column
                    title={<div>{t('supplier.contact_person')} / SĐT</div>}
                    dataIndex="invoice"
                    width={180}
                    onCell={() => ({ style: { width: 180, maxWidth: 180 } })}
                    onHeaderCell={() => ({ style: { width: 180 } })}
                    key="invoice"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="font-medium flex flex-col gap-2">
                                <p>
                                    {record?.customerContactPerson} <br /> {record?.customerContactPersonPhone}
                                </p>
                            </div>
                        );
                    }}
                />
                <Column
                    title={t('logistics.enter_warehouse.total_quantity')}
                    ellipsis
                    dataIndex="totalQuantity"
                    width={170}
                    onCell={() => ({ style: { width: 170, maxWidth: 170 } })}
                    onHeaderCell={() => ({ style: { width: 170 } })}
                    key="totalQuantity"
                    align="right"
                    render={val => {
                        return val ? InputHelper.formatNumber(val) : '-';
                    }}
                />
                <Column
                    width={180}
                    title={t('logistics.exit_warehouse.exported')}
                    dataIndex="quantityReceive"
                    key="quantityReceive"
                    align="right"
                    onCell={() => ({ style: { width: 180 } })}
                    onHeaderCell={() => ({ style: { width: 180 } })}
                    render={val => {
                        return val ? InputHelper.formatNumber(val) : '-';
                    }}
                />
                <Column
                    width={180}
                    title={t('logistics.exit_warehouse.unexported')}
                    dataIndex="quantityPending"
                    key="quantityPending"
                    align="right"
                    onCell={() => ({ style: { width: 180 } })}
                    onHeaderCell={() => ({ style: { width: 180 } })}
                    render={val => {
                        return val ? InputHelper.formatNumber(val) : '-';
                    }}
                />
                <Column
                    title={t('global.status')}
                    ellipsis
                    width={160}
                    onCell={() => ({ style: { width: 160 } })}
                    onHeaderCell={() => ({ style: { width: 160 } })}
                    dataIndex="status"
                    align="center"
                    fixed="right"
                    key="status"
                    render={(_, record) => {
                        const status = getWarehouseStatus(record.quantityReceive, record.quantityPending);
                        return <WarehouseTag value={status} type={1} />;
                    }}
                />
            </ProductTable>
        </div>
    );
};

export default ExportWarehouse;
