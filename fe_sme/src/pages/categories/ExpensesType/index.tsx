import { apiAddExpensesType, apiDeleteExpensesType, apiSearchExpensesType, apiUpdateExpensesType } from '@/api/category.api';
import { AppRouters, DefaultMappingPermission } from '@/constants';
import BaseModal from '@/core/components/Modal/BaseModal';
import { useLocale } from '@/i18n';
import { DeleteOutlined, FileAddOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Checkbox, Input, Select } from 'antd';
import Form from 'antd/es/form';
import Popconfirm from 'antd/es/popconfirm';
import { useState } from 'react';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import ExpensesTypeTable from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatDateTime } from '@/utils/format-datetime';
import { handleCommonError } from '@/utils/helpers';

import { IAddEditExpensesType } from '@/interface/category';
import { PageFilter } from '@/interface/common';

const { Column } = ExpensesTypeTable;

interface ColumnType {
    id: string;
    code: string;
    name: string;
    type?: number;
    created: string;
    lastModified: string;
}

const ExpensesType = () => {
    const [formData, setFormData] = useState<IAddEditExpensesType | null>(null);
    const [filter, setFilter] = useState<PageFilter & { type?: number[] }>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
        type: [2],
    });
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.EXPENSES_TYPE]);
    const { t } = useLocale();

    const { data, refetch } = useQuery({
        queryKey: ['getListExpensesType', filter],
        queryFn: async () => {
            const res = await apiSearchExpensesType(filter);
            return res;
        },
    });

    const handleAddEdit = async (data: IAddEditExpensesType) => {
        const isEdit = !!formData?.id;
        const params = isEdit ? { id: formData?.id, name: data?.name, isIncome: data?.isIncome } : data;
        const res = isEdit ? await apiUpdateExpensesType(params) : await apiAddExpensesType(params);
        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
            setFormData(null);
            refetch();
        } else handleCommonError(res, t);
    };

    const handleClose = () => {
        setFormData(null);
    };

    const handleDelete = async (recordId: string) => {
        const res = await apiDeleteExpensesType(recordId);
        if (res.succeeded) {
            notify.success(t('message.delete_success'));
            refetch();
        } else handleCommonError(res, t, t('message.delete_failed'));
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between mb-2 mx-2 gap-2">
                <div>
                    <BaseButton
                        className="mb-2"
                        onClick={() => setFormData({})}
                        icon={<FileAddOutlined />}
                        label={t('global.add_new')}
                        disabled={!isFullPermission}
                    />
                </div>
                <div className="flex gap-2">
                    <Select
                        className="w-40"
                        placeholder={t('expenses_type.filter_type')}
                        value={filter.type?.[0]}
                        onChange={value =>
                            setFilter({
                                ...filter,
                                pageNumber: 1,
                                type: value !== undefined ? [value] : undefined,
                            })
                        }
                        options={[
                            { value: 2, label: t('global.document_type.all') },
                            { value: 0, label: t('expenses_type.income') },
                            { value: 1, label: t('expenses_type.expense') },
                        ]}
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
            </div>

            <BaseModal
                title={t(formData?.id ? 'expenses_type.update_title' : 'expenses_type.create_title')}
                open={!!formData}
                onCancel={handleClose}
                centered={true}
                footer={false}
                destroyOnClose
            >
                <Form
                    name="form-expenses-type"
                    layout="vertical"
                    className="w-full space-y-4"
                    onFinish={handleAddEdit}
                    autoComplete="off"
                    initialValues={formData || { isIncome: false }}
                    disabled={!isFullPermission}
                >
                    {!formData?.id && (
                        <Form.Item label={t('expenses_type.code')} name="code">
                            <Input placeholder={t('expenses_type.code')} />
                        </Form.Item>
                    )}
                    <Form.Item
                        label={t('expenses_type.name')}
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: t('global.message.required_field'),
                            },
                        ]}
                    >
                        <Input placeholder={t('expenses_type.name')} />
                    </Form.Item>
                    <Form.Item name="isIncome" valuePropName="checked">
                        <Checkbox>{t('expenses_type.is_income_checkbox')}</Checkbox>
                    </Form.Item>
                    <Form.Item className="flex justify-end items-center !mb-0">
                        <BaseButton label={t('global.popup.reject')} onClick={handleClose} className="mr-2" disabled={false} />
                        <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" />
                    </Form.Item>
                </Form>
            </BaseModal>

            <ExpensesTypeTable<ColumnType>
                dataSource={data?.data || []}
                rowKey={record => record?.id}
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
                    title={t('expenses_type.code')}
                    dataIndex="code"
                    onCell={() => ({ width: 180 })}
                    onHeaderCell={() => ({ style: { width: 180, minWidth: 180 } })}
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
                    onCell={() => ({ width: 300 })}
                    onHeaderCell={() => ({ style: { width: 300, minWidth: 300 } })}
                    title={t('expenses_type.name')}
                    dataIndex="name"
                    key="name"
                />
                <Column
                    title={t('expenses_type.type')}
                    dataIndex="type"
                    onCell={() => ({ width: 120 })}
                    onHeaderCell={() => ({ style: { width: 120, minWidth: 120 } })}
                    key="type"
                    align="center"
                    render={(type: number | null) => {
                        const isIncome = type === 0;
                        return (
                            <span className={`px-2 py-1 rounded text-xs ${isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {isIncome ? t('expenses_type.income') : t('expenses_type.expense')}
                            </span>
                        );
                    }}
                />
                <Column
                    title={t('global.created_at')}
                    onCell={() => ({ width: 180 })}
                    onHeaderCell={() => ({ style: { width: 180, minWidth: 180 } })}
                    dataIndex="created"
                    align="left"
                    key="created"
                    render={(_, record: ColumnType) => <div>{formatDateTime(record?.created)}</div>}
                />
                <Column
                    title={t('global.updated_at')}
                    onCell={() => ({ width: 180 })}
                    onHeaderCell={() => ({ style: { width: 180, minWidth: 180 } })}
                    dataIndex="lastModified"
                    align="left"
                    key="lastModified"
                    render={(_, record: ColumnType) => <div>{formatDateTime(record?.lastModified)}</div>}
                />
                <Column
                    onCell={() => ({ width: 80 })}
                    onHeaderCell={() => ({ style: { width: 80, minWidth: 80 } })}
                    align="center"
                    render={(_, record: ColumnType) => (
                        <div className="flex justify-center">
                            <Popconfirm
                                title={t('global.popup.confirm_delete')}
                                onConfirm={() => handleDelete(record?.id)}
                                okText={t('global.popup.ok')}
                                cancelText={t('global.popup.reject')}
                                placement="left"
                            >
                                <BaseButton
                                    disabled={!isFullPermission}
                                    className="text-red-500"
                                    type="text"
                                    size="small"
                                    icon={<DeleteOutlined />}
                                />
                            </Popconfirm>
                        </div>
                    )}
                />
            </ExpensesTypeTable>
        </div>
    );
};

export default ExpensesType;
