import { apiAddPaymentFund, apiDeletePaymentFund, apiSearchPaymentFund, apiUpdatePaymentFund } from '@/api/category.api';
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
import PaymentFundTable from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatDateTime } from '@/utils/format-datetime';
import { handleCommonError } from '@/utils/helpers';

import { IAddEditPaymentFund } from '@/interface/category';
import { PageFilter } from '@/interface/common';

const { Column } = PaymentFundTable;

interface ColumnType {
    id: string;
    code: string;
    name: string;
    created: string;
    lastModified: string;
}

const PaymentFund = () => {
    const [formData, setFormData] = useState<IAddEditPaymentFund | null>(null);
    const [filter, setFilter] = useState<PageFilter>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
    });
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.PAYMENT_FUND]);
    const { t } = useLocale();

    const { data, refetch } = useQuery({
        queryKey: ['getListPaymentFund', filter],
        queryFn: async () => {
            const res = await apiSearchPaymentFund(filter);
            return res;
        },
    });

    const handleAddEdit = async (data: IAddEditPaymentFund) => {
        const isEdit = !!formData?.id;
        const params = isEdit ? { id: formData?.id, name: data?.name } : data;
        const res = isEdit ? await apiUpdatePaymentFund(params) : await apiAddPaymentFund(params);
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
        const res = await apiDeletePaymentFund(recordId);
        if (res.succeeded) {
            notify.success(t('message.delete_success'));
            refetch();
        } else handleCommonError(res, t);
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
                title={t(formData?.id ? 'payment_fund.update_title' : 'payment_fund.create_title')}
                open={!!formData}
                onCancel={handleClose}
                centered={true}
                footer={false}
                destroyOnClose
            >
                <Form
                    name="form-payment-fund"
                    layout="vertical"
                    className="w-full space-y-4"
                    onFinish={handleAddEdit}
                    autoComplete="off"
                    initialValues={formData || {}}
                    disabled={!isFullPermission}
                >
                    {!formData?.id && (
                        <Form.Item label={t('payment_fund.code')} name="code">
                            <Input placeholder={t('payment_fund.code')} />
                        </Form.Item>
                    )}
                    <Form.Item
                        label={t('payment_fund.name')}
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: t('global.message.required_field'),
                            },
                        ]}
                    >
                        <Input placeholder={t('payment_fund.name')} />
                    </Form.Item>
                    <Form.Item className="flex justify-end items-center !mb-0">
                        <BaseButton label={t('global.popup.reject')} onClick={handleClose} className="mr-2" disabled={false} />
                        <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" />
                    </Form.Item>
                </Form>
            </BaseModal>

            <PaymentFundTable<ColumnType>
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
                    title={t('payment_fund.code')}
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
                    onCell={() => ({ width: 400 })}
                    onHeaderCell={() => ({ style: { width: 400, minWidth: 400 } })}
                    title={t('payment_fund.name')}
                    dataIndex="name"
                    key="name"
                    className="max-w-96"
                />
                <Column
                    title={t('global.created_at')}
                    onCell={() => ({ width: 180 })}
                    onHeaderCell={() => ({ style: { width: 180, minWidth: 180 } })}
                    dataIndex="created"
                    key="created"
                    render={(_, record: ColumnType) => <div className="flex items-center justify-center mb-0">{formatDateTime(record?.created)}</div>}
                />
                <Column
                    title={t('global.updated_at')}
                    onCell={() => ({ width: 180 })}
                    onHeaderCell={() => ({ style: { width: 180, minWidth: 180 } })}
                    dataIndex="lastModified"
                    key="lastModified"
                    render={(_, record: ColumnType) => (
                        <div className="flex items-center justify-center mb-0">{formatDateTime(record?.lastModified)}</div>
                    )}
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
            </PaymentFundTable>
        </div>
    );
};

export default PaymentFund;
