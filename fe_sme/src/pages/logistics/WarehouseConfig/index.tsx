import { apiAddWarehouseConfig, apiDeleteWarehouseConfig, apiSearchWarehouseConfig, apiUpdateWarehouseConfig } from '@/api/logistics.api';
import { ParamsGetList } from '@/api/request';
import BaseColorPicker from '@/core/components/ColorPicker';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseModal from '@/core/components/Modal/BaseModal';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { DeleteOutlined, FileAddOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { ColorPicker, Form, Popconfirm } from 'antd';
import { useState } from 'react';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import WarehouseConfigTable from '@/components/table';
import { notify } from '@/components/toast-message';

import { formatDateTime } from '@/utils/format-datetime';

import { IAddEditWarehouseConfig } from '@/interface/logistics';

const { Column } = WarehouseConfigTable;

const WarehouseConfig = () => {
    const { t } = useLocale();
    const [formData, setFormData] = useState<IAddEditWarehouseConfig | null>(null);
    const [filter, setFilter] = useState<ParamsGetList>({
        pageSize: 10,
        pageNumber: 1,
        search: '',
    });

    const { data, refetch } = useQuery({
        queryKey: ['getListProduct', filter],
        queryFn: async () => {
            const res = await apiSearchWarehouseConfig(filter, { loading: false });
            return res;
        },
    });

    const handleDelete = async (recordId: string) => {
        const res = await apiDeleteWarehouseConfig(recordId);
        if (res.succeeded) {
            notify.success(t('message.delete_success'));
            refetch();
        } else notify.error(t('message.delete_failed'));
    };

    const handleAddEdit = async (data: IAddEditWarehouseConfig) => {
        const isEdit = !!formData?.id;
        const params = {
            ...(isEdit && { id: formData?.id }),
            ...data,
        };
        const res = isEdit ? await apiUpdateWarehouseConfig(params) : await apiAddWarehouseConfig(params);
        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
            setFormData(null);
            refetch();
        } else notify.error(t('message.failed'));
    };

    const handleClose = () => {
        setFormData(null);
    };

    return (
        <div className="h-full flex flex-col gap-4 p-4">
            <div className="flex gap-2 w-full justify-between">
                <BaseButton className="mb-2" onClick={() => setFormData({})} icon={<FileAddOutlined />} label="Add new" />
                <Search
                    placeholder={t('global.search_table')}
                    allowClear
                    className="btn-search-table"
                    onSearch={value => {
                        setFilter({ ...filter, pageNumber: 1, search: value });
                    }}
                />
            </div>

            <WarehouseConfigTable<IAddEditWarehouseConfig>
                dataSource={data?.data || []}
                rowKey={record => record.id || 'id'}
                wrapClassName="!h-full w-full !px-0"
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
                    onCell={() => ({ style: { width: 50, maxWidth: 50 } })}
                    onHeaderCell={() => ({ width: 50 })}
                    key="index"
                    fixed="left"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    ellipsis
                    title={t('logistics.warehouse_config.code')}
                    key="code"
                    width={250}
                    fixed="left"
                    onCell={() => ({ style: { width: 250, maxWidth: 450 } })}
                    onHeaderCell={() => ({ width: 250 })}
                    align="start"
                    render={(_, record: IAddEditWarehouseConfig) => {
                        return (
                            <div
                                className="inline-block !text-base whitespace-nowrap truncate max-w-full text-blue-500 font-medium cursor-pointer"
                                title={record.code}
                                onClick={() => setFormData(record)}
                            >
                                {record.code}
                            </div>
                        );
                    }}
                />
                <Column
                    ellipsis
                    title={t('logistics.warehouse_config.name')}
                    key="name"
                    width={250}
                    onCell={() => ({ style: { width: 250, maxWidth: 450 } })}
                    onHeaderCell={() => ({ width: 250 })}
                    align="start"
                    render={(_, record: IAddEditWarehouseConfig) => {
                        return (
                            <div
                                className="inline-block !text-base whitespace-nowrap truncate max-w-full font-medium cursor-pointer"
                                title={record.name}
                            >
                                {record.name}
                            </div>
                        );
                    }}
                />
                <Column
                    title={t('logistics.warehouse_config.deviation_threshold')}
                    ellipsis
                    width={180}
                    onCell={() => ({ style: { width: 180, maxWidth: 180 } })}
                    onHeaderCell={() => ({ style: { width: 180 } })}
                    key="deviation_threshold"
                    align="center"
                    render={(_, record: IAddEditWarehouseConfig) => record?.miniumQuantity}
                />

                <Column
                    title={t('logistics.warehouse_config.display_color')}
                    align="center"
                    width={120}
                    onCell={() => ({ style: { width: 120, maxWidth: 120 } })}
                    onHeaderCell={() => ({ style: { width: 120 } })}
                    key="colorCode"
                    render={(_, record: IAddEditWarehouseConfig) => <ColorPicker value={record.colorCode} disabled showText />}
                />
                <Column
                    title={t('global.description')}
                    width={200}
                    onCell={() => ({ style: { width: 200, maxWidth: 350 } })}
                    onHeaderCell={() => ({ style: { width: 200 } })}
                    ellipsis
                    key="description"
                    dataIndex="description"
                    render={val => <div title={val || ''}>{val || '-'}</div>}
                />
                <Column
                    title={t('Created at')}
                    width={150}
                    onCell={() => ({ style: { width: 150, maxWidth: 150 } })}
                    onHeaderCell={() => ({ style: { width: 150 } })}
                    dataIndex="created"
                    key="created"
                    render={(_, record: IAddEditWarehouseConfig) => <div>{record?.created ? formatDateTime(record.created) : '-'}</div>}
                />
                <Column
                    width={150}
                    onCell={() => ({ style: { width: 150, maxWidth: 150 } })}
                    onHeaderCell={() => ({ style: { width: 150 } })}
                    title={t('Updated at')}
                    dataIndex="lastModified"
                    key="lastModified"
                    render={(_, record: IAddEditWarehouseConfig) => <div>{record?.lastModified ? formatDateTime(record.lastModified) : '-'}</div>}
                />
                <Column
                    fixed="right"
                    width={100}
                    onCell={() => ({ style: { width: 100, maxWidth: 100 } })}
                    onHeaderCell={() => ({ width: 100 })}
                    align="center"
                    render={(_, record: IAddEditWarehouseConfig) => (
                        <div className="flex justify-center">
                            <Popconfirm
                                title={t('global.popup.confirm_delete')}
                                onConfirm={() => handleDelete(record.id || '')}
                                okText={t('global.popup.ok')}
                                cancelText={t('global.popup.reject')}
                                placement="left"
                            >
                                <div className="cursor-pointer text-red-600 flex gap-1">
                                    <DeleteOutlined />
                                </div>
                            </Popconfirm>
                        </div>
                    )}
                />
            </WarehouseConfigTable>
            <BaseModal
                title={t(formData?.id ? 'logistics.warehouse_config.update' : 'logistics.warehouse_config.add')}
                open={!!formData}
                onCancel={handleClose}
                centered={true}
                footer={false}
                destroyOnClose
            >
                <Form
                    name="form-warehouse-config"
                    layout="vertical"
                    className="w-full space-y-4"
                    onFinish={handleAddEdit}
                    autoComplete="off"
                    initialValues={formData || {}}
                    onKeyDown={e => {
                        if (e.key === 'Enter') e.preventDefault();
                    }}
                >
                    <BaseInput
                        label={t('logistics.warehouse_config.code')}
                        formItemProps={{ rules: [{ message: t('logistics.warehouse_config.code.required'), required: true }] }}
                        name="code"
                    />
                    <BaseInput
                        label={t('logistics.warehouse_config.name')}
                        formItemProps={{ rules: [{ message: t('logistics.warehouse_config.name.required'), required: true }] }}
                        name="name"
                    />
                    <BaseInputNumber
                        label={t('logistics.warehouse_config.deviation_threshold')}
                        formItemProps={{ rules: [{ message: t('logistics.warehouse_config.deviation_threshold.required'), required: true }] }}
                        name="miniumQuantity"
                    />
                    <BaseColorPicker
                        label={t('logistics.warehouse_config.display_color')}
                        name="colorCode"
                        showText
                        className="w-full"
                        formItemProps={{
                            rules: [{ message: t('logistics.warehouse_config.display_color.required'), required: true }],
                            vertical: true,
                        }}
                    />
                    <BaseTextArea
                        name="description"
                        label={t('product.add_edit.description')}
                        placeholder={t('product.add_edit.description')}
                        rows={4}
                    />
                    <Form.Item className="flex justify-end items-center !mb-0">
                        <BaseButton label={t('global.popup.reject')} onClick={handleClose} className="mr-2" />
                        <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" />
                    </Form.Item>
                </Form>
            </BaseModal>
        </div>
    );
};

export default WarehouseConfig;
