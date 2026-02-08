import { apiCreateRoleGroup, apiGetRoleGroup, apiUpdateRoleGroup } from '@/api/role-group.api';
import { AppRouters } from '@/constants';
import BaseModal from '@/core/components/Modal/BaseModal';
import { useLocale } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { Input } from 'antd';
import Form from 'antd/es/form';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';
import RoleGroupTable from '@/components/table';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import { formatDateTime } from '@/utils/format-datetime';

import { IAddEditRoleGroup, IRoleGroup, IRoleGroupListResponse } from '@/interface/system';

const { Column } = RoleGroupTable;

interface ColumnType {
    id: string;
    code: string;
    name: string;
    roleName?: string;
    created: string;
    lastModified: string;
}

const RoleGroup = () => {
    const [formData, setFormData] = useState<IAddEditRoleGroup | null>(null);
    const [filter, setFilter] = useState({
        pageSize: 10,
        pageNumber: 1,
        search: '',
    });

    const { t } = useLocale();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { data, refetch, isFetching } = useQuery<IRoleGroupListResponse>({
        queryKey: ['getListRoleGroup', filter],
        queryFn: async () => {
            const res = (await apiGetRoleGroup(filter)) as any;
            return res;
        },
    });

    const handleAddEdit = async (data: IAddEditRoleGroup) => {
        const isEdit = !!formData?.id;
        const params = isEdit ? { id: formData?.id, name: data?.name, code: formData?.code } : data;
        const res = isEdit ? await apiUpdateRoleGroup(params) : await apiCreateRoleGroup(params);
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
        <div className="h-full flex flex-col p-4">
            <BaseModal
                title={t(formData?.id ? 'rolegroup.edit' : 'rolegroup.add')}
                open={!!formData}
                onCancel={handleClose}
                centered={true}
                footer={false}
                destroyOnClose
            >
                <Form
                    name="form-role-group"
                    layout="vertical"
                    className="w-full"
                    onFinish={handleAddEdit}
                    autoComplete="off"
                    initialValues={formData || {}}
                    onKeyDown={e => {
                        if (e.key === 'Enter') e.preventDefault();
                    }}
                >
                    <Form.Item
                        label={t('rolegroup.name')}
                        rules={[{ required: true, message: t('rolegroup.name.required') }]}
                        required={true}
                        name="name"
                    >
                        <Input placeholder={t('rolegroup.name')} />
                    </Form.Item>
                    <Form.Item className="flex justify-end items-center !mb-0">
                        <BaseButton label={t('global.popup.reject')} onClick={handleClose} className="mr-2" />
                        <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" />
                    </Form.Item>
                </Form>
            </BaseModal>

            <RoleGroupTable<IRoleGroup>
                dataSource={data?.data || []}
                rowKey={record => record.id}
                loading={isFetching}
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
                    title={t('rolegroup.code')}
                    dataIndex="code"
                    onCell={() => ({ width: 180 })}
                    onHeaderCell={() => ({ style: { width: 180, minWidth: 180 } })}
                    key="code"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span
                                    className="cursor-pointer"
                                    onClick={() => {
                                        dispatch(setBreadCrumbs({ [record.id]: record.roleName || '' }));
                                        navigate(`${AppRouters.ROLE_GROUP}/${record.id}`);
                                    }}
                                >
                                    {record.code}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    title={t('rolegroup.name')}
                    onCell={() => ({ width: 400 })}
                    onHeaderCell={() => ({ style: { width: 400, minWidth: 400 } })}
                    dataIndex="displayName"
                    key="displayName"
                />
                <Column
                    title={t('Created at')}
                    dataIndex="created"
                    onCell={() => ({ width: 160 })}
                    onHeaderCell={() => ({ style: { width: 160, minWidth: 160 } })}
                    key="created"
                    render={(_, record: ColumnType) => <div>{formatDateTime(record.created)}</div>}
                />
                <Column
                    title={t('Updated at')}
                    onCell={() => ({ width: 160 })}
                    onHeaderCell={() => ({ style: { width: 160, minWidth: 160 } })}
                    dataIndex="lastModified"
                    key="lastModified"
                    render={(_, record: ColumnType) => <div>{formatDateTime(record.lastModified)}</div>}
                />
            </RoleGroupTable>
        </div>
    );
};

export default RoleGroup;
