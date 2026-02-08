import { apiDeleteSupplierInfo, apiSearchSupplierInfo } from '@/api/supplier.api';
import { AppRouters, DefaultMappingPermission } from '@/constants';
import { useLocale } from '@/i18n';
import { DeleteOutlined, FileAddOutlined, FileTextOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Tooltip } from 'antd';
import Popconfirm from 'antd/es/popconfirm';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import SupplierInfoTable from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { handleCommonError } from '@/utils/helpers';

import { PageFilter } from '@/interface/common';

const { Column } = SupplierInfoTable;

interface ColumnType {
    id: string;
    code: string;
    name: string;
    nameShort?: string;
    email: string;
    phone?: string;
    phoneNumber?: string;
    address: string;
    isActive: boolean;
    created: string;
    lastModified: string;
    supplierPersonInCharge?:
        | {
              userId: string;
              userName: string;
              userPhone?: string;
              userEmail?: string;
              userPosition?: string;
          }
        | Array<{
              userId: string;
              userName: string;
              userPhone?: string;
              userEmail?: string;
              userPosition?: string;
          }>;
}

const SupplierInfo = () => {
    const { t } = useLocale();
    const navigate = useNavigate();
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.SUPPLIER_INFO]);
    const [filter, setFilter] = useState<PageFilter>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
    });

    const { data, refetch } = useQuery({
        queryKey: ['getListSupplierInfo', filter],
        queryFn: async () => {
            const res = await apiSearchSupplierInfo(filter);
            return res;
        },
    });

    const handleDelete = async (recordId: string) => {
        try {
            const res = await apiDeleteSupplierInfo(recordId);
            if (res.succeeded) {
                notify.success(t('message.delete_success'));
                refetch();
            } else throw res;
        } catch (error: any) {
            handleCommonError(error, t);
        }
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between mb-2 mx-2 gap-2">
                <div>
                    <BaseButton
                        className="mb-2"
                        onClick={() => navigate(AppRouters.ADD_SUPPLIER_INFO)}
                        icon={<FileAddOutlined />}
                        label={t('Add new')}
                        disabled={!isFullPermission}
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

            <SupplierInfoTable<ColumnType>
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
                    key="index"
                    fixed="left"
                    onCell={() => ({ width: 60 })}
                    onHeaderCell={() => ({ style: { width: 60, minWidth: 60 } })}
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('supplier.code')}
                    dataIndex="code"
                    key="code"
                    fixed="left"
                    onCell={() => ({ width: 230 })}
                    onHeaderCell={() => ({ style: { width: 230, minWidth: 230 } })}
                    align="center"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span className="cursor-pointer" onClick={() => navigate(`/suppliers/infomation/${record.id}`)}>
                                    {record.code}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    ellipsis
                    fixed="left"
                    onCell={() => ({ width: 500 })}
                    onHeaderCell={() => ({ style: { width: 500, minWidth: 500 } })}
                    title={t('supplier.name')}
                    dataIndex="name"
                    key="name"
                    className="max-w-96"
                />
                <Column
                    ellipsis
                    onCell={() => ({ width: 250 })}
                    onHeaderCell={() => ({ style: { width: 250, minWidth: 250 } })}
                    title={t('supplier.abbreviated_name')}
                    dataIndex="nameShort"
                    key="nameShort"
                    className="max-w-96"
                    render={value => value || '-'}
                />
                <Column
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150, minWidth: 150 } })}
                    title={t('supplier.phone')}
                    dataIndex="phone"
                    key="phone"
                    render={(_, record: any) => record.phone || record.phoneNumber || '-'}
                />
                <Column
                    ellipsis
                    onCell={() => ({ width: 250 })}
                    onHeaderCell={() => ({ style: { width: 250, minWidth: 250 } })}
                    title={t('supplier.person_in_charge')}
                    dataIndex="supplierPersonInCharge"
                    key="supplierPersonInCharge"
                    render={(_, record: any) => {
                        let personInCharge = record.supplierPersonInCharge;

                        if (Array.isArray(personInCharge) && personInCharge.length > 0) {
                            personInCharge = personInCharge[0];
                        }

                        if (personInCharge && personInCharge.userName) {
                            return <span className="text-gray-700 text-sm">{personInCharge.userName}</span>;
                        }

                        return <span className="text-gray-400 italic">-</span>;
                    }}
                />
                <Column
                    onCell={() => ({ width: 80 })}
                    onHeaderCell={() => ({ style: { width: 80, minWidth: 80 } })}
                    align="center"
                    fixed="right"
                    render={(_, record: ColumnType) => (
                        <div className="flex justify-center gap-2">
                            <Tooltip placement="topRight" title={t('history.view')}>
                                <Button
                                    shape="circle"
                                    icon={<FileTextOutlined />}
                                    onClick={() => navigate(`${AppRouters.SUPPLIER_VIEW_HISTORY}/${record.id}`)}
                                    className="items-center justify-center flex gap-1"
                                />
                            </Tooltip>
                            <Popconfirm
                                title={t('global.popup.confirm_delete')}
                                onConfirm={() => handleDelete(record.id)}
                                okText={t('global.popup.ok')}
                                cancelText={t('global.popup.reject')}
                                placement="left"
                            >
                                <Tooltip placement="topRight" title={t('global.popup.delete.text')}>
                                    <Button
                                        shape="circle"
                                        icon={<DeleteOutlined />}
                                        className="items-center justify-center text-red-600 flex gap-1"
                                        disabled={!isFullPermission}
                                    />
                                </Tooltip>
                            </Popconfirm>
                        </div>
                    )}
                />
            </SupplierInfoTable>
        </div>
    );
};

export default SupplierInfo;
