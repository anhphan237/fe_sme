import { apiAddShippingMethod, apiDeleteShippingMethod, apiSearchShippingMethod, apiUpdateShippingMethod } from '@/api/category.api';
import { AppRouters, DefaultMappingPermission } from '@/constants';
import BaseModal from '@/core/components/Modal/BaseModal';
import { useLocale } from '@/i18n';
import { DeleteOutlined, FileAddOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Input } from 'antd';
import Form from 'antd/es/form';
import Popconfirm from 'antd/es/popconfirm';
import { useState } from 'react';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import ShippingMethodTable from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatDateTime } from '@/utils/format-datetime';

import { IAddEditShippingMethod } from '@/interface/category';
import { PageFilter } from '@/interface/common';

const { Column } = ShippingMethodTable;

interface ColumnType {
    id: string;
    code: string;
    name: string;
    created: string;
    lastModified: string;
}

const ShippingMethod = () => {
    const [formData, setFormData] = useState<IAddEditShippingMethod | null>(null);
    const [filter, setFilter] = useState<PageFilter>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
    });
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.SHIPPING_METHOD]);
    const { t } = useLocale();

    const { data, refetch } = useQuery({
        queryKey: ['getListShippingMethod', filter],
        queryFn: async () => {
            const res = await apiSearchShippingMethod(filter);
            return res;
        },
    });

    const handleAddEdit = async (data: IAddEditShippingMethod) => {
        const isEdit = !!formData?.id;
        const params = isEdit ? { id: formData?.id, name: data?.name, code: formData?.code } : data;
        const res = isEdit ? await apiUpdateShippingMethod(params) : await apiAddShippingMethod(params);
        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
            setFormData(null);
            refetch();
        } else notify.error(t('message.failed'));
    };

    const handleClose = () => {
        setFormData(null);
    };

    const handleDelete = async (recordId: string) => {
        const res = await apiDeleteShippingMethod(recordId);
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
                        onClick={() => setFormData({})}
                        icon={<FileAddOutlined />}
                        label="Add new"
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

            <BaseModal
                title={t(formData?.id ? 'Update shipping method' : 'Create shipping method')}
                open={!!formData}
                onCancel={handleClose}
                centered={true}
                footer={false}
                destroyOnClose
            >
                <Form
                    name="form-shipping-method"
                    layout="vertical"
                    className="w-full"
                    onFinish={handleAddEdit}
                    autoComplete="off"
                    initialValues={formData || {}}
                    onKeyDown={e => {
                        if (e.key === 'Enter') e.preventDefault();
                    }}
                    disabled={!isFullPermission}
                    clearOnDestroy
                >
                    <Form.Item
                        label={t('Shipping method name')}
                        rules={[{ required: true, message: t('Shipping method name cannot be empty') }]}
                        required={true}
                        name={'name'}
                    >
                        <Input placeholder={t('Shipping method name')} />
                    </Form.Item>
                    <Form.Item className="flex justify-end items-center !mb-0">
                        <BaseButton label={t('global.popup.reject')} onClick={handleClose} className="mr-2" disabled={false} />
                        <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" />
                    </Form.Item>
                </Form>
            </BaseModal>

            <ShippingMethodTable<ColumnType>
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
                    title={t('Shipping method code')}
                    dataIndex="code"
                    width={200}
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
                    title={t('Shipping method name')}
                    dataIndex="name"
                    key="name"
                    className="max-w-96"
                />
                <Column
                    title={t('Created at')}
                    width={200}
                    ellipsis
                    dataIndex="created"
                    key="created"
                    render={(_, record: ColumnType) => <div>{formatDateTime(record.created)}</div>}
                />
                <Column
                    title={t('Updated at')}
                    width={200}
                    ellipsis
                    dataIndex="lastModified"
                    key="lastModified"
                    render={(_, record: ColumnType) => <div>{formatDateTime(record.lastModified)}</div>}
                />
                <Column
                    title={t('Action')}
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
                                <BaseButton
                                    disabled={!isFullPermission}
                                    label="global.popup.delete.text"
                                    className="text-red-500"
                                    type="text"
                                    size="small"
                                    icon={<DeleteOutlined />}
                                />
                            </Popconfirm>
                        </div>
                    )}
                />
            </ShippingMethodTable>
        </div>
    );
};

export default ShippingMethod;
