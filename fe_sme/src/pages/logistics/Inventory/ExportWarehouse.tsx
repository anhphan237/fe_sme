import { apiSearchInventoryIssue } from '@/api/logistics.api';
import { ParamsGetList } from '@/api/request';
import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { FileAddOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { DatePicker } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import ProductTable, { MyTableProps } from '@/components/table';

import { formatDateTime } from '@/utils/format-datetime';
import { InputHelper, removeViDiacritics } from '@/utils/helpers';

const { Column } = ProductTable;
const { RangePicker } = DatePicker;

interface ColumnType {
    id: string;
    contractId: string;
    name: string;
    code: string;
    invoice: string;
    totalAmount: number;
    invoiceDate: string;
    warehouse: {
        warehouseName: string;
    };
    customer: {
        customerTaxCode: string;
        customerContactPerson: string;
        customerWarehouseName: string;
        customerName: string;
        customerContactPersonPhone: string;
    };
    description?: string;
}

interface IProps<T extends Object = any> {
    tableProps?: Omit<MyTableProps<T>, 'rowKey' | 'dataSource' | 'pagination'>;
    productId: string;
}

const ExportWarehouse = ({ productId, tableProps }: IProps) => {
    const { t } = useLocale();
    const navigate = useNavigate();

    const [filter, setFilter] = useState<ParamsGetList>({
        pageSize: 10,
        pageNumber: 1,
        search: '',
        range: {
            from: undefined,
            to: undefined,
        },
    });

    const { data } = useQuery({
        queryKey: ['getListGoodsIssue', productId],
        queryFn: async () => {
            const res = await apiSearchInventoryIssue(productId);
            return res;
        },
    });

    const dataTable = useMemo(() => {
        if (!data) return [];
        return data?.data?.filter((item: ColumnType) => {
            const normalizedSearchKey = removeViDiacritics(filter.search ?? '');
            const normalizedName = removeViDiacritics(item.customer.customerName ?? '');
            const normalizedDescription = removeViDiacritics(item.description ?? '');
            const normalizedInvoice = removeViDiacritics(item.invoice ?? '');
            return (
                normalizedName.toLowerCase().includes(normalizedSearchKey.toLowerCase()) ||
                normalizedDescription.toLowerCase().includes(normalizedSearchKey.toLowerCase()) ||
                normalizedInvoice.toLowerCase().includes(normalizedSearchKey.toLowerCase())
            );
        });
    }, [data, productId, filter.search]);

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between mb-2 mx-2 gap-2">
                <div>
                    {!productId && (
                        <BaseButton
                            className="mb-2"
                            onClick={() => navigate(AppRouters.ADD_EXPORT_WAREHOUSE)}
                            icon={<FileAddOutlined />}
                            label="Add new"
                        />
                    )}
                </div>
                <div className="flex justify-end mb-2 px-2">
                    <Search
                        placeholder={t('global.search_table')}
                        allowClear
                        className="btn-search-table"
                        onSearch={value => {
                            setFilter({ ...filter, pageNumber: 1, search: value });
                        }}
                    />
                </div>
            </div>

            <ProductTable<ColumnType>
                dataSource={dataTable}
                rowKey={record => record.id}
                pagination={{
                    current: filter.pageNumber,
                    pageSize: filter.pageSize,
                    total: data?.totalItems,
                    onChange: (page, pageSize) => {
                        setFilter({ ...filter, pageNumber: page, pageSize });
                    },
                }}
                {...tableProps}
            >
                <Column
                    title={<div className="flex justify-center items-center">{t('category.list.index')}</div>}
                    dataIndex="index"
                    width={50}
                    fixed="left"
                    onCell={() => ({ style: { width: 50, maxWidth: 50 } })}
                    onHeaderCell={() => ({ style: { width: 50 } })}
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('sales.contract_number')}
                    dataIndex="invoice"
                    width={140}
                    fixed="left"
                    onCell={() => ({ style: { width: 140, maxWidth: 140 } })}
                    onHeaderCell={() => ({ style: { width: 140 } })}
                    key="invoice"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span
                                    className="cursor-pointer"
                                    onClick={() => {
                                        navigate(`${AppRouters.EXPORT_WAREHOUSE}/${record.contractId}/${record.id}`);
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
                    title={t('logistics.enter_warehouse.document_date')}
                    width={160}
                    onCell={() => ({ style: { width: 160, maxWidth: 160 } })}
                    onHeaderCell={() => ({ style: { width: 160 } })}
                    dataIndex="invoiceDate"
                    key="invoiceDate"
                    render={(_, record: ColumnType) => formatDateTime(record?.invoiceDate, 'DD-MM-YYYY')}
                />
                <Column
                    title={t('sales.customer')}
                    ellipsis
                    width={250}
                    onCell={() => ({ style: { width: 250, maxWidth: 400 } })}
                    onHeaderCell={() => ({ style: { width: 250 } })}
                    dataIndex="customerName"
                    key="customerName"
                    render={(_, record: ColumnType) => record?.customer?.customerName}
                />
                <Column
                    width={180}
                    onCell={() => ({ style: { width: 180 } })}
                    onHeaderCell={() => ({ style: { width: 180 } })}
                    title={t('logistics.enter_warehouse.total_quantity')}
                    dataIndex="totalQuantity"
                    key="totalQuantity"
                    align="right"
                    render={val => {
                        return val ? InputHelper.formatNumber(val) : '-';
                    }}
                />
            </ProductTable>
        </div>
    );
};

export default ExportWarehouse;
