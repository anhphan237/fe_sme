import { apiDeleteWarehouse, apiSearchWarehouse } from '@/api/category.api';
import { useLocale } from '@/i18n';
import { DeleteOutlined, FileAddOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import Popconfirm from 'antd/es/popconfirm';
import { useState } from 'react';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import WarehouseTable from '@/components/table';
import { notify } from '@/components/toast-message';

import { formatDateTime } from '@/utils/format-datetime';

import { IAddEditWarehouse } from '@/interface/category';
import { PageFilter } from '@/interface/common';

import { Tooltip } from 'antd';
import ModalAddEditWarehouse from './ModalAddEditWarehouse';

const { Column } = WarehouseTable;

interface ColumnType {
    id: string;
    name: string;
    code: string;
    administrativeDivision: string;
    created: string;
    lastModified: string;
}

const WareHouse = () => {
    const [formData, setFormData] = useState<IAddEditWarehouse | null>(null);
    const [filter, setFilter] = useState<PageFilter>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
    });

    const { t } = useLocale();

    const { data, refetch } = useQuery({
        queryKey: ['getListWarehouse', filter],
        queryFn: async () => {
            const res = await apiSearchWarehouse(filter);
            return res;
        },
    });

    const handleClose = () => {
        setFormData(null);
        refetch();
    };

    const handleDelete = async (recordId: string) => {
        const res = await apiDeleteWarehouse(recordId);
        if (res.succeeded) {
            notify.success(t('message.delete_success'));
            refetch();
        } else notify.error(t('message.delete_failed'));
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between mb-2 mx-2 gap-2">
                <div>
                    <BaseButton
                        className="mb-2"
                        onClick={() => {
                            setFormData({});
                        }}
                        icon={<FileAddOutlined />}
                        label="Add new"
                    />
                </div>
                <Search
                    placeholder={t('global.search_table')}
                    allowClear
                    className="btn-search-table"
                    onSearch={value => {
                        setFilter({ ...filter, pageNumber: 1, search: value });
                    }}
                />
            </div>

            <WarehouseTable<ColumnType>
                dataSource={data?.data || []}
                rowKey={record => record.id}
                wrapClassName="!h-full w-full"
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
                    title={<div className="flex items-center justify-center">{t('category.list.index')}</div>}
                    dataIndex="index"
                    width={50}
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('Warehouse code')}
                    dataIndex="code"
                    width={130}
                    ellipsis
                    key="code"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span className="cursor-pointer" onClick={() => setFormData(record)}>
                                    {record.code}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    ellipsis
                    onCell={() => ({ width: 450 })}
                    onHeaderCell={() => ({ style: { width: 450, minWidth: 450 } })}
                    title={t('Warehouse name')}
                    dataIndex="name"
                    key="name"
                    className="max-w-96"
                />
                <Column
                    ellipsis
                    onCell={() => ({ width: 160 })}
                    onHeaderCell={() => ({ style: { width: 160, minWidth: 160 } })}
                    title={t('Warehouse type name')}
                    dataIndex="warehouseTypeName"
                    key="warehouseTypeName"
                />
                <Column
                    title={t('Warehouse address')}
                    onCell={() => ({ width: 250 })}
                    onHeaderCell={() => ({ style: { width: 250, minWidth: 250 } })}
                    ellipsis
                    key="address"
                    render={(_, record: ColumnType) => {
                        return record?.administrativeDivision ? JSON.parse(record?.administrativeDivision)?.address : '';
                    }}
                />
                <Column
                    title={t('Created at')}
                    dataIndex="created"
                    width={160}
                    ellipsis
                    key="created"
                    render={(_, record: ColumnType) => <div>{formatDateTime(record.created)}</div>}
                />
                <Column
                    title={t('Updated at')}
                    dataIndex="lastModified"
                    width={160}
                    ellipsis
                    key="lastModified"
                    render={(_, record: ColumnType) => <div>{formatDateTime(record.lastModified)}</div>}
                />
                <Column
                    // title={t('Action')}
                    width={120}
                    align="center"
                    render={(_, record: ColumnType) => (
                        <div className="flex justify-center">
                            <Popconfirm
                                title={t('global.popup.confirm_delete')}
                                onConfirm={() => handleDelete(record.id)}
                                okText={t('global.popup.ok')}
                                cancelText={t('global.popup.reject')}
                                placement="left"
                            >
                                <Tooltip placement="topRight" title={t('global.popup.delete.text')}>
                                    <BaseButton icon={<DeleteOutlined className="text-red-600" />} className="w-fit !px-2 !py-0" type="text" />
                                </Tooltip>
                            </Popconfirm>
                        </div>
                    )}
                />
            </WarehouseTable>
            <ModalAddEditWarehouse formData={formData} handleClose={handleClose} />
        </div>
    );
};

export default WareHouse;
