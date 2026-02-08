import { apiGetRoleGroupById, apiUpdatePermissionRoleGroup } from '@/api/role-group.api';
import { AppRouters, DefaultMappingPermission, PERMISSIONS } from '@/constants';
import BaseModal from '@/core/components/Modal/BaseModal';
import { useLocale } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { Checkbox, Form, Space, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import BaseButton from '@/components/button';
import BaseTable from '@/components/table';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

const { Text } = Typography;
const UpdatePermissionGroup = () => {
    const { t } = useLocale();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.ROLE_GROUP]);

    const [form] = Form.useForm();
    const [openConfirm, setOpenConfirm] = useState(false);

    const { data } = useQuery({
        queryKey: ['getDetailRoleGroup', id],
        queryFn: async () => {
            const res = await apiGetRoleGroupById(id || '');
            if (res?.data) {
                const data = res?.data;
                form.setFieldsValue(data);
            }
            return res?.data;
        },
        enabled: isEdit,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!data || !id) return;
        dispatch(
            setBreadCrumbs({
                [id]: data.displayName,
            }),
        );
    }, [data]);

    const handleClose = () => {
        navigate(AppRouters.ROLE_GROUP);
    };

    const handleAddEdit = async () => {
        const values = await form.validateFields();
        const params = {
            groupId: id,
            ...values,
        };
        const res = await apiUpdatePermissionRoleGroup(params);
        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
            navigate(AppRouters.ROLE_GROUP);
        } else notify.error(t('message.failed'));
    };

    const PermissionCheckboxes = ({ fieldName }: { fieldName: (string | number)[] }) => {
        const currentValue = Form.useWatch(fieldName);
        const form = Form.useFormInstance();

        const toggle = (value: string) => {
            const newValue = currentValue === value ? null : value;
            form.setFieldValue(fieldName, newValue);
        };

        return (
            <Space>
                <Checkbox checked={currentValue === PERMISSIONS.VIEW} onChange={() => toggle(PERMISSIONS.VIEW)}>
                    {t('global.permission.only_view')}
                </Checkbox>
                <Checkbox checked={currentValue === PERMISSIONS.FULL} onChange={() => toggle(PERMISSIONS.FULL)}>
                    {t('global.permission.full')}
                </Checkbox>
            </Space>
        );
    };

    return (
        <Form
            form={form}
            id="update-role-group"
            layout="inline"
            className="bg-white mx-5 mt-3 !rounded-md"
            onKeyDown={e => {
                if (e.key === 'Enter') e.preventDefault();
            }}
            disabled={!isFullPermission}
            preserve
        >
            <Form.List
                name="permissions"
                rules={[
                    {
                        validator: async (_, fields) => {
                            if (!fields || fields.length < 1) {
                                return Promise.reject(new Error(t('sales.messages.required_products')));
                            }
                            return Promise.resolve();
                        },
                    },
                ]}
            >
                {fields => {
                    const columns: ColumnsType = [
                        {
                            title: t('category.list.index'),
                            dataIndex: 'stt',
                            align: 'center',
                            className: 'text-center',
                            width: 80,
                            render: (_: any, __: any, index: number) => index + 1,
                            onCell: () => ({ width: 50 }),
                            onHeaderCell: () => ({ width: 50 }),
                            fixed: 'left',
                        },
                        {
                            title: t('user.action'),
                            fixed: 'left',
                            ellipsis: true,
                            className: 'truncate',
                            render: (_: any, __: any, index: number) => {
                                const field = fields[index];
                                const name = form.getFieldValue(['permissions', field.name, 'name']);
                                return <Text className="truncate">{t(name)}</Text>;
                            },
                        },
                        {
                            title: t('user.permission'),
                            width: 280,
                            align: 'center',
                            render: (_: any, __: any, index: number) => (
                                <PermissionCheckboxes fieldName={['permissions', fields[index].name, 'permission']} />
                            ),
                        },
                    ];
                    return (
                        <div className="w-full">
                            <BaseTable
                                wrapClassName="!h-[calc(100vh_-_180px)] w-full !rounded !px-0"
                                scroll={{ y: 'calc(100vh - 240px)' }}
                                bordered
                                columns={columns}
                                dataSource={fields}
                                pagination={false}
                                rowKey="key"
                            />
                        </div>
                    );
                }}
            </Form.List>
            <div className="flex justify-end items-center pt-8 p-4 w-full gap-2">
                <BaseButton label={t('global.popup.reject')} onClick={handleClose} disabled={false} />
                <BaseButton label={t('global.popup.save')} type="primary" onClick={() => setOpenConfirm(true)} />
            </div>
            <BaseModal
                open={openConfirm}
                title={t('global.confirm')}
                onCancel={() => setOpenConfirm(false)}
                onClose={() => setOpenConfirm(false)}
                onOk={handleAddEdit}
            >
                <span>{t('confirm.update_role_group_msg')}</span>
            </BaseModal>
        </Form>
    );
};

export default UpdatePermissionGroup;
