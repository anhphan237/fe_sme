import { apiSearchDepartment, apiSearchPositionByDepartments } from '@/api/category.api';
import { apiGetRoleGroup } from '@/api/role-group.api';
import { apiGetTenants } from '@/api/tenant.api';
import { apiAddUser, apiDeleteUser, apiResetPasswordUser, apiSearchUsers, apiUpdateUser } from '@/api/user.api';
import { AppRouters, DefaultMappingPermission, DefaultRoles, DefaultValues, ERROR_CODE, RegexValidate } from '@/constants';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseModal from '@/core/components/Modal/BaseModal';
import BaseSelect from '@/core/components/Select/BaseSelect';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { DeleteOutlined, FileAddOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import Button from 'antd/es/button';
import Form from 'antd/es/form';
import Modal from 'antd/es/modal';
import Popconfirm from 'antd/es/popconfirm';
import Tooltip from 'antd/es/tooltip';
import { RawValueType } from 'rc-select/lib/Select';
import type { FC } from 'react';
import { useState } from 'react';
import * as yup from 'yup';

import BaseButton from '@/components/button';
import ModalFooter from '@/components/modal-footer';
import Search from '@/components/search';
import UserTable from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatDateTime } from '@/utils/format-datetime';
import { handleCommonError } from '@/utils/helpers';

import { IPositionByDepartment } from '@/interface/category';
import { IAddEditUser, IUserData, IUserForm } from '@/interface/user';

const { Column } = UserTable;

interface GroupedData {
    label: string;
    title?: string;
    value?: string;
    options?: GroupedData[];
}

const groupDataByDepartment = (data: IPositionByDepartment[]): GroupedData[] => {
    const groupedData: { [key: string]: GroupedData } = {};

    data.forEach(item => {
        if (!groupedData[item.departmentId]) {
            groupedData[item.departmentId] = {
                label: item.departmentName,
                title: item.departmentCode,
                options: [],
            };
        }
        groupedData[item.departmentId].options?.push({
            ...item,
            label: item.name,
            value: item.id,
        });
    });
    return Object.values(groupedData);
};

const INITIAL_FORM = {
    username: '',
    name: '',
    phone: '',
    email: '',
    departmentIds: [],
    positionIds: [],
};
const Index: FC = () => {
    const [showAddUser, setShowAddUser] = useState<boolean>(false);
    const [mode, setMode] = useState<'add' | 'edit'>();
    const [pageIndex, setPageIndex] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(DefaultValues.PAGE_SIZE);
    const [searchTable, setSearchTable] = useState<string | undefined>(undefined);
    const [form] = Form.useForm<IAddEditUser | IUserForm>();
    const { t } = useLocale();
    const [isChange, setIsChange] = useState<boolean>(false);
    const [formIsValid, setFormIsValid] = useState<boolean>(false);
    const [isVerifyPosition, setIsVerifyPosition] = useState<boolean>(false);
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    const isSuperAdmin = currentUser?.roles?.[0]?.code === DefaultRoles.SUPER_ADMIN;
    const watchedDepartmentIds = Form.useWatch('departmentIds', form);
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.USERS]);

    const {
        data: users,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ['getListUsers', searchTable, pageIndex, pageSize],
        queryFn: async () => {
            const resp: any = await apiSearchUsers(pageIndex, pageSize, searchTable);
            return resp;
        },
    });
    const { data: listTenant } = useQuery({
        queryKey: ['tenants'],
        queryFn: async () => {
            const res = await apiGetTenants({ loading: false });
            const list = Array.isArray(res?.data) ? res.data.map(item => ({ value: item.id, label: item.name })) : [];
            return list;
        },
        enabled: isSuperAdmin,
    });

    const { data } = useQuery({
        queryKey: ['getListRoleGroupFromUser'],
        queryFn: async () => {
            const res = await apiGetRoleGroup({
                pageSize: 1000,
                pageNumber: 1,
            });
            return res?.data;
        },
    });

    const schema = yup.object().shape({
        username: yup
            .string()
            .required(t('user.add_edit.username.required'))
            .test('username', t('user.add_edit.username.invalid_format'), value => {
                if (RegexValidate.USERNAME.test(value)) {
                    return true;
                }
                return false;
            }),
        name: yup.string().required(t('user.add_edit.full_name.required')),
        phone: yup
            .string()
            .required(t('user.add_edit.phone.required'))
            .test('phone', t('user.add_edit.phone.invalid_format'), value => {
                if (RegexValidate.PHONE.test(value)) {
                    return true;
                }
                return false;
            }),
        // departmentIds: yup.array().min(1, t('user.add_edit.role.department.required')),
        // positionIds: yup.array().min(1, t('user.add_edit.role.position.required')),
    });

    const yupSync: any = {
        async validator({ field }: { field: string }, value: any) {
            await schema.validateSyncAt(field, { [field]: value });
        },
    };

    const onClickEditUser = (record: IUserData) => {
        setShowAddUser(true);
        setMode('edit');
        form.setFieldsValue({
            name: record.fullName,
            email: record.email,
            phone: record.phoneNumber,
            username: record.username,
            departmentIds: record.departments.map(item => item.id),
            departments: record.departments,
            positionIds: record.positions.map(item => item.id),
            positions: record.positions,
            groupId: record.groupId,
            groupName: record?.groupName,
            id: record.id,
            tenantId: record.tenantId,
        });
    };

    const handleError = (resp: any) => {
        if (resp.errorCode === ERROR_CODE.USER_DUPLICATE_EMAIL) {
            form.setFields([
                {
                    name: 'email',
                    errors: [t('user.add_edit.email.duplicated')],
                },
            ]);
        } else if (resp.errorCode === ERROR_CODE.USER_DUPLICATE_USERNAME) {
            form.setFields([
                {
                    name: 'username',
                    errors: [t('user.add_edit.username.duplicated')],
                },
            ]);
        }
        handleCommonError(resp, t, t('message.failed'));
    };

    const handleSubmit = async () => {
        const formValues: IUserForm = form.getFieldsValue(true);
        try {
            if (mode === 'add') {
                const resp = await apiAddUser({
                    ...formValues,
                    fullname: formValues.name,
                    phoneNumber: formValues.phone,
                });

                if (resp?.succeeded) {
                    notify.success(t('message.add_success'));
                    handleClose();
                    refetch();
                } else {
                    handleError(resp);
                }
            } else if (mode === 'edit') {
                const resp = await apiUpdateUser({
                    ...formValues,
                    id: formValues.id,
                    fullname: formValues.name,
                    phoneNumber: formValues.phone,
                });

                if (resp?.succeeded) {
                    notify.success(t('message.update_success'));
                    handleClose();
                    refetch();
                } else {
                    handleError(resp);
                }
            }
        } catch (error) {}
    };

    const handleClose = () => {
        setShowAddUser(false);
        setIsChange(false);
        setFormIsValid(false);
        form.resetFields();
    };

    const handleDeleteUser = async (record: IUserData) => {
        const resp = await apiDeleteUser(record.id);

        if (resp?.succeeded) {
            notify.success(t('message.delete_success'));
            refetch();
        } else {
            notify.error(t('message.delete_failed'));
        }
    };

    const handleResetPassword = async (userId: string) => {
        const resp = await apiResetPasswordUser(userId);
        Modal.info({
            title: t('user.reset_password.response.title'),
            content: resp.data,
            centered: true,
            icon: null,
        });
    };

    const handleFieldsChange = () => {
        setIsChange(true);
        const isValidForm = form.getFieldsError().filter(({ errors }) => errors.length).length === 0;
        setFormIsValid(isValidForm);
    };

    const labelRender = (val: { label: React.ReactNode; value: RawValueType; key?: React.Key }, type: 'departments' | 'positions') => {
        if (val.label) return val.label;
        const list = form.getFieldValue(type);
        const currentItem = list?.find((item: { id: string }) => item?.id === val?.value);
        return currentItem?.name || '';
    };

    const handleChangeDepartment = async (value: string[]) => {
        const isUnSelect = value.length < watchedDepartmentIds?.length;
        if (!isUnSelect) return;
        try {
            setIsVerifyPosition(true);
            const { data: positionByDepartment } = await apiSearchPositionByDepartments(
                { pageNumber: 1, pageSize: 1000, departmentId: value },
                { loading: false },
            );
            const selectedPositions = form.getFieldValue('positionIds') || [];
            const newPositionIds = selectedPositions.filter((id: string) => {
                return positionByDepartment?.some((item: IPositionByDepartment) => item.id === id);
            });
            form.setFieldValue('positionIds', newPositionIds);
        } catch (error) {
            notify.error(t('global.message.error_occurs'));
        } finally {
            setIsVerifyPosition(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between mb-2 mx-2 gap-2">
                <div>
                    <BaseButton
                        className="mb-2"
                        onClick={() => {
                            setShowAddUser(true);
                            setMode('add');
                        }}
                        icon={<FileAddOutlined />}
                        label="user.add_user"
                        disabled={!isFullPermission}
                    />
                </div>
                <Search
                    placeholder={t('global.search_table')}
                    allowClear
                    className="btn-search-table"
                    onSearch={value => {
                        setPageIndex(1);
                        setSearchTable(value);
                    }}
                />
            </div>

            <BaseModal
                title={t(mode === 'edit' ? 'user.edit.popup.header' : 'user.add.popup.header')}
                open={showAddUser}
                onCancel={handleClose}
                centered={true}
                footer={<ModalFooter onOk={form.submit} onCancel={handleClose} disabled={!formIsValid || !isChange || !isFullPermission} />}
            >
                <div>
                    <Form
                        form={form as any}
                        name="form-user"
                        layout="vertical"
                        className="w-full"
                        initialValues={INITIAL_FORM}
                        onFinish={handleSubmit}
                        onFieldsChange={handleFieldsChange}
                        onKeyDown={e => {
                            if (e.key === 'Enter') e.preventDefault();
                        }}
                        disabled={!isFullPermission}
                        preserve
                    >
                        <BaseInput
                            formItemProps={{
                                rules: mode === 'edit' ? [] : [yupSync],
                                className: 'mt-1',
                                required: true,
                            }}
                            label={t('user.add_edit.username.label')}
                            placeholder={t('user.add_edit.username.placeholder')}
                            name="username"
                            disabled={mode === 'edit'}
                        />
                        <BaseInput
                            formItemProps={{
                                rules: [yupSync],
                                className: 'mt-1',
                                required: true,
                            }}
                            label={t('user.add_edit.full_name.label')}
                            placeholder={t('user.add_edit.full_name.placeholder')}
                            name="name"
                        />
                        <BaseInput
                            formItemProps={{
                                rules: [yupSync],
                                className: 'mt-1',
                                required: true,
                            }}
                            label={t('user.add_edit.phone.label')}
                            placeholder={t('user.add_edit.phone.placeholder')}
                            name="phone"
                        />
                        <BaseSelect
                            name="groupId"
                            label={t('finance.sales_commission.select_role_group')}
                            placeholder={t('finance.sales_commission.select_role_group')}
                            showSearch
                            labelRender={item => item?.label ?? form.getFieldValue('groupName')}
                            formItemProps={{
                                rules: [{ required: true, message: t('finance.sales_commission.select_role_group.required') }],
                                className: 'mt-1',
                                required: true,
                            }}
                            optionFilterProp="label"
                            options={
                                data?.map((item: { id: string; displayName: string }) => ({
                                    value: item?.id,
                                    label: item?.displayName,
                                })) || []
                            }
                        />
                        {isSuperAdmin && (
                            <BaseSelect
                                name="tenantId"
                                options={listTenant}
                                label={t('tenant.name')}
                                placeholder={t('tenant.name')}
                                formItemProps={{
                                    className: 'mt-1',
                                    rules: [{ required: true, message: t('global.message.required_field') }],
                                }}
                            />
                        )}
                        <InfiniteScrollSelect
                            name="departmentIds"
                            queryKey={['department']}
                            label={t('user.add_edit.role.department')}
                            placeholder={t('user.add_edit.role.department')}
                            labelRender={val => labelRender(val, 'departments')}
                            formItemProps={{
                                // rules: [yupSync],
                                className: 'mt-1',
                                // required: true,
                            }}
                            mode="multiple"
                            onChange={handleChangeDepartment}
                            fetchData={async ({ pageNumber, pageSize, search }) => {
                                const resp = await apiSearchDepartment({ pageNumber, pageSize, search }, { loading: false });
                                return resp.data;
                            }}
                        />
                        <InfiniteScrollSelect
                            name="positionIds"
                            label={t('user.add_edit.role.position')}
                            placeholder={t('user.add_edit.role.position')}
                            formItemProps={{
                                // rules: [yupSync],
                                className: 'mt-1',
                                // required: true,
                            }}
                            mode="multiple"
                            labelRender={val => labelRender(val, 'positions')}
                            disabled={!watchedDepartmentIds?.length || isVerifyPosition}
                            skipFetch={!watchedDepartmentIds?.length}
                            queryKey={['position', ...(watchedDepartmentIds || [])]}
                            mapData={groupDataByDepartment}
                            loading={isVerifyPosition}
                            fetchData={async ({ pageNumber, pageSize, search }) => {
                                const resp = await apiSearchPositionByDepartments(
                                    { pageNumber, pageSize, search, departmentId: watchedDepartmentIds ?? undefined },
                                    { loading: false },
                                );
                                return resp.data || [];
                            }}
                        />
                    </Form>
                </div>
            </BaseModal>

            <UserTable<IUserData>
                dataSource={users?.data || []}
                rowKey={record => record.id}
                loading={isFetching}
                pagination={{
                    current: pageIndex,
                    pageSize: pageSize,
                    total: users?.totalItems,
                    onChange: (page, pageSize) => {
                        setPageIndex(page);
                        setPageSize(pageSize);
                    },
                }}
            >
                <Column
                    title={<div className="flex items-center justify-center">{t('user.list.index')}</div>}
                    dataIndex="index"
                    width={50}
                    fixed="left"
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(pageIndex - 1) * pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('user.add_edit.username.label')}
                    dataIndex="username"
                    key="username"
                    fixed="left"
                    onCell={() => ({ width: 160 })}
                    onHeaderCell={() => ({ style: { width: 160, minWidth: 160 } })}
                    render={(_, record: IUserData) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span className="cursor-pointer" onClick={() => onClickEditUser(record)}>
                                    {record.username}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    title={t('user.code')}
                    onCell={() => ({ width: 160 })}
                    onHeaderCell={() => ({ style: { width: 160, minWidth: 160 } })}
                    dataIndex="code"
                    key="code"
                />
                <Column
                    title={t('user.add_edit.full_name.label')}
                    onCell={() => ({ width: 300 })}
                    onHeaderCell={() => ({ style: { width: 300, minWidth: 300 } })}
                    dataIndex="fullName"
                    key="fullName"
                />
                <Column
                    title={t('user.add_edit.phone.label')}
                    onCell={() => ({ width: 140 })}
                    onHeaderCell={() => ({ style: { width: 140, minWidth: 140 } })}
                    dataIndex="phoneNumber"
                    key="phoneNumber"
                />
                <Column
                    title={t('user.created_at')}
                    onCell={() => ({ width: 160 })}
                    onHeaderCell={() => ({ style: { width: 160, minWidth: 160 } })}
                    dataIndex="created"
                    key="created"
                    render={(_, record: IUserData) => <div>{formatDateTime(record.created)}</div>}
                />
                <Column
                    title={t('user.updated_at')}
                    onCell={() => ({ width: 160 })}
                    onHeaderCell={() => ({ style: { width: 160, minWidth: 160 } })}
                    dataIndex="lastModified"
                    key="lastModified"
                    render={(_, record: IUserData) => <div>{formatDateTime(record.lastModified)}</div>}
                />
                <Column
                    onCell={() => ({ width: 80 })}
                    onHeaderCell={() => ({ style: { width: 80, minWidth: 80 } })}
                    render={(_, record: IUserData) => (
                        <div className="flex gap-2">
                            <Popconfirm
                                title={t('user.reset_password.confirm.title')}
                                onConfirm={() => handleResetPassword(record.id)}
                                okText={t('global.popup.ok')}
                                cancelText={t('global.popup.reject')}
                                placement="left"
                            >
                                <Tooltip placement="topRight" title={t('user.reset_password')}>
                                    <Button
                                        shape="circle"
                                        icon={<ReloadOutlined />}
                                        disabled={!isFullPermission}
                                        className="flex items-center justify-center"
                                    />
                                </Tooltip>
                            </Popconfirm>
                            <Popconfirm
                                title={t('user.delete.message')}
                                onConfirm={() => handleDeleteUser(record)}
                                okText={t('global.popup.ok')}
                                cancelText={t('global.popup.reject')}
                                placement="left"
                            >
                                <Tooltip placement="topRight" title={t('global.popup.delete.text')}>
                                    <Button
                                        shape="circle"
                                        icon={<DeleteOutlined />}
                                        disabled={!isFullPermission}
                                        className="items-center justify-center text-red-600 flex gap-1"
                                    />
                                </Tooltip>
                            </Popconfirm>
                        </div>
                    )}
                />
            </UserTable>
        </div>
    );
};

export default Index;
