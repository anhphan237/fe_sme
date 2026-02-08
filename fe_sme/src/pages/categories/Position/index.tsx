import { apiAddPosition, apiDeletePosition, apiSearchDepartment, apiSearchPosition, apiUpdatePosition } from '@/api/category.api';
import { AppRouters, DefaultMappingPermission } from '@/constants';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseModal from '@/core/components/Modal/BaseModal';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import { useLocale } from '@/i18n';
import { DeleteOutlined, FileAddOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import Form from 'antd/es/form';
import Popconfirm from 'antd/es/popconfirm';
import { useState } from 'react';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import PositionTable from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatDateTime } from '@/utils/format-datetime';

import { IAddEditPosition } from '@/interface/category';
import { PageFilter } from '@/interface/common';

const { Column } = PositionTable;

interface ColumnType {
    id: string;
    code: string;
    name: string;
    departmentName: string;
    created: string;
    lastModified: string;
}

const Position = () => {
    const [formData, setFormData] = useState<IAddEditPosition | null>(null);
    const [filter, setFilter] = useState<PageFilter>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
    });
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.POSITION]);
    const { t } = useLocale();

    const { data, refetch } = useQuery({
        queryKey: ['getListPosition', filter],
        queryFn: async () => {
            const res = await apiSearchPosition(filter);
            return res;
        },
    });

    const handleAddEdit = async (data: IAddEditPosition) => {
        const isEdit = !!formData?.id;
        const params = {
            ...(isEdit && { id: formData?.id, code: formData?.code }),
            ...data,
        };
        const res = isEdit ? await apiUpdatePosition(params) : await apiAddPosition(params);
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
        const res = await apiDeletePosition(recordId);
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
                title={t(formData?.id ? 'Update position' : 'Create position')}
                open={!!formData}
                onCancel={handleClose}
                centered={true}
                footer={false}
                destroyOnClose
            >
                <Form
                    name="form-position"
                    layout="vertical"
                    className="w-full space-y-4"
                    onFinish={handleAddEdit}
                    autoComplete="off"
                    initialValues={formData || {}}
                    onKeyDown={e => {
                        if (e.key === 'Enter') e.preventDefault();
                    }}
                >
                    <InfiniteScrollSelect
                        name="departmentId"
                        queryKey={['departmentFromPosition']}
                        label={t('user.add_edit.role.department')}
                        placeholder={t('user.add_edit.role.department')}
                        labelRender={value => value?.label ?? formData?.departmentName}
                        formItemProps={{
                            rules: [{ required: true, message: t('Department name cannot be empty') }],
                            required: true,
                        }}
                        showSearch
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const resp = await apiSearchDepartment({ pageNumber, pageSize, search }, { loading: false });
                            return resp.data;
                        }}
                    />
                    <BaseInput
                        label={t('Position name')}
                        placeholder={t('Position name')}
                        name="name"
                        formItemProps={{ required: true, rules: [{ required: true, message: t('Position name cannot be empty') }] }}
                    />
                    <Form.Item className="flex justify-end items-center !mb-0">
                        <BaseButton label={t('global.popup.reject')} onClick={handleClose} className="mr-2" />
                        <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" />
                    </Form.Item>
                </Form>
            </BaseModal>

            <PositionTable<ColumnType>
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
                    title={t('Position code')}
                    dataIndex="code"
                    width={150}
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
                    title={t('Position name')}
                    dataIndex="name"
                    key="name"
                    className="max-w-96"
                />
                <Column
                    ellipsis
                    onCell={() => ({ width: 200 })}
                    onHeaderCell={() => ({ style: { width: 200, minWidth: 200 } })}
                    title={t('Department name')}
                    dataIndex="departmentName"
                    key="departmentName"
                    className="max-w-96"
                />
                <Column
                    title={t('Created at')}
                    dataIndex="created"
                    width={160}
                    ellipsis
                    key="created"
                    render={(_, record: ColumnType) => formatDateTime(record.created)}
                />
                <Column
                    title={t('Updated at')}
                    dataIndex="lastModified"
                    width={160}
                    ellipsis
                    key="lastModified"
                    render={(_, record: ColumnType) => formatDateTime(record.lastModified)}
                />
                <Column
                    width={80}
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
                                    className="text-red-500"
                                    type="text"
                                    size="small"
                                    icon={<DeleteOutlined />}
                                />
                            </Popconfirm>
                        </div>
                    )}
                />
            </PositionTable>
        </div>
    );
};

export default Position;
