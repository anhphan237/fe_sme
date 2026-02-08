import { apiDeleteCustomerInfo, apiSearchCustomerInfo } from '@/api/customer.api';
import { AppRouters, DefaultMappingPermission } from '@/constants';
import { useLocale } from '@/i18n';
import { DeleteOutlined, FileAddOutlined, FileTextOutlined, FrownOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { AutoComplete, Button, Spin, Tooltip } from 'antd';
import Popconfirm from 'antd/es/popconfirm';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';
import CustomerInfoTable from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';
import { useDebounce } from '@/hooks/useDebounce';

import { handleCommonError } from '@/utils/helpers';

import { PageFilter } from '@/interface/common';

const { Column } = CustomerInfoTable;

interface ColumnType {
    id: string;
    customerTypeId: string;
    customerTypeCode?: string;
    customerTypeName?: string;
    name: string;
    nameShort?: string;
    code?: string;
    phone?: string;
    email?: string;
    address?: string;
    description?: string;
    supplier?: boolean;
    taxCode?: string;
    created: string;
    createdBy?: string;
    createdByName?: string;
    lastModified?: string;
    lastModifiedBy?: string;
    lastModifiedByName?: string;
    customerPersonInCharge?: {
        id?: string;
        customerId?: string;
        userId: string;
        userCode?: string;
        userName?: string;
        userPhone?: string;
        userEmail?: string;
        userPosition?: string;
    };
    customerContactPersons?: Array<{
        id?: string;
        customerId?: string;
        name: string;
        phone: string;
        position?: string;
        description?: string;
        number?: number;
        created?: string;
        lastModified?: string;
    }>;
    customerBankAccounts?: Array<{
        id?: string;
        customerId?: string;
        bankAccountName: string;
        bankAccountNumber: string;
        bankName: string;
        bankBranch?: string;
        description?: string;
        number?: number;
        created?: string;
        lastModified?: string;
    }>;
}

const CustomerInfo = () => {
    const { t } = useLocale();
    const navigate = useNavigate();
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.CUSTOMER_INFO]);
    const [filter, setFilter] = useState<PageFilter>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
    });
    const [searchValue, setSearchValue] = useState<string>('');
    const debouncedSearchValue = useDebounce(searchValue, 500);

    useEffect(() => {
        setFilter(prev => {
            const newSearch = debouncedSearchValue.trim() || undefined;

            if (prev.search === newSearch) {
                return prev;
            }

            return {
                ...prev,
                pageNumber: 1,
                search: newSearch,
            };
        });
    }, [debouncedSearchValue]);

    const { data, refetch, isFetching } = useQuery({
        queryKey: ['getListCustomerInfo', filter],
        queryFn: async () => {
            const res = await apiSearchCustomerInfo(filter);
            return res;
        },
    });

    const suggestions = data?.data || [];
    const showSuggestions = searchValue.trim().length > 0;

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
    };

    const handleSelectSuggestion = (value: string) => {
        const selectedCustomer = suggestions.find((item: ColumnType) => item.id === value);
        if (selectedCustomer) {
            navigate(`/customers/infomation/${selectedCustomer.id}`);
        }
    };

    const handleClear = () => {
        setSearchValue('');
    };

    const handleDelete = async (recordId: string) => {
        try {
            const res = await apiDeleteCustomerInfo(recordId);
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
                        onClick={() => navigate(AppRouters.ADD_CUSTOMER_INFO)}
                        icon={<FileAddOutlined />}
                        label={t('Add new')}
                        disabled={!isFullPermission}
                    />
                </div>
                <AutoComplete
                    value={searchValue}
                    onChange={handleSearchChange}
                    onSelect={handleSelectSuggestion}
                    placeholder={t('global.search_table')}
                    allowClear
                    onClear={handleClear}
                    className="btn-search-table"
                    style={{ width: 300 }}
                    notFoundContent={
                        isFetching ? (
                            <div className="text-center py-2 flex items-center justify-center gap-2">
                                <Spin size="small" className="text-primary" />
                                <span className="text-gray-500">{t('global.loading')}</span>
                            </div>
                        ) : showSuggestions && suggestions.length === 0 ? (
                            <div className="text-center py-2 flex items-center justify-center gap-2 text-gray-400">
                                <FrownOutlined style={{ fontSize: 20 }} />
                                <span>{t('title.notFount')}</span>
                            </div>
                        ) : null
                    }
                    options={
                        showSuggestions
                            ? suggestions.map((customer: ColumnType) => ({
                                  value: customer.id,
                                  label: (
                                      <div className="py-1">
                                          <div className="flex items-center justify-between gap-2">
                                              <span className="text-blue-600 font-medium text-sm">{customer.code}</span>
                                              <span className="text-gray-500 text-xs">{customer.phone}</span>
                                          </div>
                                          <div className="text-gray-700 text-sm mt-1 font-normal">{customer.name}</div>
                                          {customer.nameShort && <div className="text-gray-400 text-xs italic">({customer.nameShort})</div>}
                                      </div>
                                  ),
                              }))
                            : []
                    }
                />
            </div>

            <CustomerInfoTable<ColumnType>
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
                    title={t('customer.code')}
                    dataIndex="code"
                    key="code"
                    fixed="left"
                    onCell={() => ({ width: 230 })}
                    onHeaderCell={() => ({ style: { width: 230, minWidth: 230 } })}
                    align="center"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span className="cursor-pointer" onClick={() => navigate(`/customers/infomation/${record.id}`)}>
                                    {record.code || '-'}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    ellipsis
                    onCell={() => ({ width: 500 })}
                    onHeaderCell={() => ({ style: { width: 500, minWidth: 500 } })}
                    title={t('customer.name')}
                    dataIndex="name"
                    key="name"
                    fixed="left"
                    className="max-w-96"
                />
                <Column
                    ellipsis
                    onCell={() => ({ width: 250 })}
                    onHeaderCell={() => ({ style: { width: 250, minWidth: 250 } })}
                    title={t('customer.abbreviated_name')}
                    dataIndex="nameShort"
                    key="nameShort"
                    className="max-w-96"
                    render={value => value || '-'}
                />
                <Column
                    width={150}
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150, minWidth: 150 } })}
                    title={t('customer.phone')}
                    dataIndex="phone"
                    key="phone"
                    render={value => value || '-'}
                />
                <Column
                    ellipsis
                    onCell={() => ({ width: 250 })}
                    onHeaderCell={() => ({ style: { width: 250, minWidth: 250 } })}
                    title={t('customer.person_in_charge')}
                    dataIndex="customerPersonInCharge"
                    key="customerPersonInCharge"
                    render={(_, record: ColumnType) => {
                        const personInCharge = record.customerPersonInCharge;
                        if (personInCharge && personInCharge.userName) {
                            return <span className="text-gray-700 text-sm">{personInCharge.userName}</span>;
                        }
                        return <span className="text-gray-400 italic">-</span>;
                    }}
                />
                <Column
                    onCell={() => ({ width: 80 })}
                    fixed="right"
                    onHeaderCell={() => ({ style: { width: 80, minWidth: 80 } })}
                    align="center"
                    render={(_, record: ColumnType) => (
                        <div className="flex justify-center gap-2">
                            <Tooltip placement="topRight" title={t('history.view')}>
                                <Button
                                    shape="circle"
                                    icon={<FileTextOutlined />}
                                    onClick={() => navigate(`${AppRouters.CUSTOMER_HISTORY}/${record.id}`)}
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
            </CustomerInfoTable>
        </div>
    );
};

export default CustomerInfo;
