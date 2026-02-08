import { apiSearchWarehouse } from '@/api/category.api';
import { apiSearchInventory, apiSearchWarehouseConfig } from '@/api/logistics.api';
import { ParamsGetList } from '@/api/request';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import { useLocale } from '@/i18n';
import { EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Tooltip, Typography } from 'antd';
import { useState } from 'react';

import Search from '@/components/search';
import InventoryTable from '@/components/table';

import { InputHelper } from '@/utils/helpers';

import { IAddEditWarehouseConfig } from '@/interface/logistics';

import ViewEnterWarehouseModal from './ViewEnterWarehouseModal';
import ViewExportWarehouseModal from './ViewExportWarehouseModal';
import ViewWarehouseModal from './ViewWarehouseModal';

const { Text } = Typography;

const { Column } = InventoryTable;

const DEFAULT_VALUE_MODAL = {
    receipt: '',
    issue: '',
    warehouse: null,
};

export type WarehouseInventory = {
    warehouseId: string;
    warehouseName: string;
    warehouseCode: string;
    baremTotal: number;
    quantityTotal: number;
};

interface ColumnType {
    productId: string;
    productName: string;
    productCode: string;
    productNameView: string;
    quantity: {
        goodsIssueTotal: 0;
        goodsReceiptTotal: 0;
        quotationTotal: 0;
        quantityTotal: 0;
    };
    warehouses: WarehouseInventory[];
    warning: {
        warehouseSettingId: string;
        name: string;
        colorCode: string;
        description: string;
        miniumQuantity: number;
    };
}

const Inventory = () => {
    const { t } = useLocale();

    const [filter, setFilter] = useState<
        ParamsGetList & {
            warehouseSettingIds?: string[];
            warehouseIds?: string[];
        }
    >({
        pageSize: 10,
        pageNumber: 1,
        search: '',
        warehouseIds: [],
        warehouseSettingIds: [],
    });

    const [openModal, setOpenModal] = useState<{ receipt: string; issue: string; warehouse: WarehouseInventory[] | null }>(DEFAULT_VALUE_MODAL);

    const { data } = useQuery({
        queryKey: ['getListInventory', filter],
        queryFn: async () => {
            const res = await apiSearchInventory(filter, { loading: false });
            return res;
        },
    });

    const { data: warehouseSettings } = useQuery<{ data: IAddEditWarehouseConfig[] }>({
        queryKey: ['warehouseList'],
        queryFn: async () => {
            const res = await apiSearchWarehouseConfig({ pageNumber: 1, pageSize: 500 }, { loading: false });
            return res as { data: IAddEditWarehouseConfig[] };
        },
    });

    return (
        <div className="h-full flex flex-col gap-4 p-4">
            <div className="flex gap-2 w-full justify-end">
                <InfiniteScrollSelect
                    mode="multiple"
                    placeholder={t('Warehouse')}
                    queryKey={['getListWarehouse']}
                    name=""
                    labelRender={value => value?.label}
                    value={filter.filters?.[0]?.value || []}
                    onChange={val => setFilter({ ...filter, pageNumber: 1, warehouseIds: val })}
                    formItemProps={{
                        className: 'w-72 min-w-72',
                    }}
                    allowClear
                    showSearch
                    fetchData={async ({ pageNumber, pageSize, search }) => {
                        const res = await apiSearchWarehouse({ pageNumber, pageSize, search }, { loading: false });
                        return res.data;
                    }}
                />
                <InfiniteScrollSelect
                    mode="multiple"
                    placeholder={t('global.status')}
                    queryKey={['warehouseSettings']}
                    name=""
                    labelRender={value => value?.label}
                    value={filter.warehouseSettingIds || []}
                    onChange={val => setFilter({ ...filter, pageNumber: 1, warehouseSettingIds: val })}
                    formItemProps={{
                        className: 'w-72 min-w-72',
                    }}
                    showSearch
                    fetchData={async ({ pageNumber, pageSize, search }) => {
                        const res = await apiSearchWarehouseConfig({ pageNumber, pageSize, search }, { loading: false });
                        return res.data;
                    }}
                />
                <Search
                    placeholder={t('global.search_table')}
                    allowClear
                    className="btn-search-table"
                    onSearch={value => {
                        setFilter({ ...filter, pageNumber: 1, search: value });
                    }}
                />
            </div>

            <InventoryTable<ColumnType>
                dataSource={data?.data || []}
                rowKey={record => record.productId}
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
                    width={40}
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    ellipsis
                    title={t('product.add_edit.name')}
                    dataIndex="name"
                    key="name"
                    width={400}
                    onCell={() => ({ width: 400 })}
                    onHeaderCell={() => ({ style: { width: 400, maxWidth: 450 } })}
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="flex flex-col gap-1 max-w-[350px]">
                                <span className="inline-block !text-base whitespace-nowrap truncate max-w-full" title={record.productName}>
                                    {record.productName}
                                </span>
                                <span
                                    className="!inline-block !font-semibold !text-red-600 !text-base whitespace-nowrap truncate"
                                    title={record.productNameView}
                                >
                                    {record.productNameView}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    title={t('GoodsReceipt')}
                    ellipsis
                    key="GoodsReceipt"
                    width="120"
                    align="right"
                    onCell={() => ({ style: { width: 120, maxWidth: 120 } })}
                    onHeaderCell={() => ({ style: { width: 120 } })}
                    render={(_, record: ColumnType) => (
                        <span
                            className="truncate font-bold text-blue-600 cursor-pointer"
                            onClick={() => setOpenModal({ ...DEFAULT_VALUE_MODAL, receipt: record.productId })}
                        >
                            {record?.quantity?.goodsReceiptTotal ? InputHelper.formatNumber(record?.quantity?.goodsReceiptTotal) : 0}
                        </span>
                    )}
                />
                <Column
                    title={t('logistics.export_warehouse')}
                    ellipsis
                    key="logistics.export_warehouse"
                    align="right"
                    width="100"
                    onCell={() => ({ style: { width: 100, maxWidth: 100 } })}
                    onHeaderCell={() => ({ style: { width: 100 } })}
                    render={(_, record: ColumnType) => (
                        <span
                            className="truncate font-bold text-blue-600 cursor-pointer"
                            onClick={() => setOpenModal({ ...DEFAULT_VALUE_MODAL, issue: record.productId })}
                        >
                            {record?.quantity?.goodsIssueTotal ? InputHelper.formatNumber(record?.quantity?.goodsIssueTotal) : 0}
                        </span>
                    )}
                />
                <Column
                    title={t('logistics.existing_quantity')}
                    ellipsis
                    key="logistics.existing_quantity"
                    className="truncate font-bold"
                    align="right"
                    width="120"
                    onCell={() => ({ style: { width: 120, maxWidth: 120 } })}
                    onHeaderCell={() => ({ style: { width: 120 } })}
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="flex flex-col gap-2">
                                <Text>{record?.quantity?.quantityTotal ? InputHelper.formatNumber(record?.quantity?.quantityTotal) : 0}</Text>
                                <p style={{ color: record?.warning?.colorCode }}>{record?.warning?.name}</p>
                            </div>
                        );
                    }}
                />

                <Column
                    title={t('Action')}
                    align="center"
                    width={120}
                    onCell={() => ({ style: { width: 120, maxWidth: 120 } })}
                    onHeaderCell={() => ({ style: { width: 120 } })}
                    render={(_, record: ColumnType) => (
                        <Tooltip title={t('customer.warehouse_info')}>
                            <EyeOutlined
                                className="text-colorPrimary cursor-pointer"
                                onClick={() => setOpenModal({ ...DEFAULT_VALUE_MODAL, warehouse: record?.warehouses })}
                            />
                        </Tooltip>
                    )}
                />
            </InventoryTable>
            {!!openModal.receipt && <ViewEnterWarehouseModal onClose={() => setOpenModal(DEFAULT_VALUE_MODAL)} productId={openModal.receipt} />}
            {!!openModal.issue && <ViewExportWarehouseModal onClose={() => setOpenModal(DEFAULT_VALUE_MODAL)} productId={openModal.issue} />}
            {!!openModal.warehouse && <ViewWarehouseModal onClose={() => setOpenModal(DEFAULT_VALUE_MODAL)} dataTable={openModal.warehouse} />}
        </div>
    );
};

export default Inventory;
