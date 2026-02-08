import { apiSearchCustomerType } from '@/api/category.api';
import { apiAddCustomerInfo, apiGetDetailCustomerInfo, apiUpdateCustomerInfo } from '@/api/customer.api';
import { apiSearchUsers } from '@/api/user.api';
import { AppRouters, DefaultMappingPermission, RegexValidate } from '@/constants';
import BaseCheckbox from '@/core/components/Checkbox';
import BaseInput from '@/core/components/Input/InputWithLabel';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Form, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import BaseButton from '@/components/button';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { handleCommonError } from '@/utils/helpers';

import { IAddEditCustomerInfo } from '@/interface/customer';

const AddEditCustomerInfo = () => {
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const { t } = useLocale();
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.CUSTOMER_INFO]);
    const { data: formData } = useQuery({
        queryKey: ['getDetailCustomerInfo', id],
        queryFn: async () => {
            const res = await apiGetDetailCustomerInfo(id || '');
            if (res?.data) {
                const temp = {
                    ...res?.data,
                    customerPersonInCharge: res?.data?.customerPersonInCharge,
                    customerContactPersons: res?.data?.customerContactPersons?.sort((a: any, b: any) => a?.number - b?.number) || [],
                    customerBankAccounts: res?.data?.customerBankAccounts?.sort((a: any, b: any) => a?.number - b?.number) || [],
                };
                form.setFieldsValue(temp);
            }
            return res?.data;
        },
        enabled: isEdit,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!id) return;
        dispatch(
            setBreadCrumbs({
                [id]: t('customer.info.edit'),
            }),
        );
    }, [id]);

    const handleAddEdit = async (data: any) => {
        try {
            const params: IAddEditCustomerInfo = {
                ...(isEdit && formData && { id: formData.id }),
                customerTypeId: data.customerTypeId,
                name: data.name,
                nameShort: data.nameShort,
                phone: data.phone,
                email: data.email,
                address: data.address,
                description: data.description,
                taxCode: data.taxCode,
                customerPersonInCharge: data.customerPersonInCharge?.userId
                    ? {
                          userId: data.customerPersonInCharge.userId,
                      }
                    : undefined,
                customerContactPersons: data.customerContactPersons?.map((item: any, index: number) => ({
                    name: item.name,
                    phone: item.phone,
                    position: item.position,
                    description: item.description,
                    number: index + 1,
                })),
                customerBankAccounts: data.customerBankAccounts?.map((item: any, index: number) => ({
                    bankAccountName: item.bankAccountName,
                    bankAccountNumber: item.bankAccountNumber,
                    bankName: item.bankName,
                    bankBranch: item.bankBranch,
                    description: item.description,
                    number: index + 1,
                })),
            };

            const res = isEdit ? await apiUpdateCustomerInfo(formData?.id || '', params) : await apiAddCustomerInfo(params);

            if (res.succeeded) {
                notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
                if (data?.isSaveAdd) {
                    form.resetFields();
                } else {
                    navigate(AppRouters.CUSTOMER_INFO);
                }
            } else {
                throw res;
            }
        } catch (error: any) {
            handleCommonError(error, t);
        }
    };

    const handleClose = () => {
        navigate(AppRouters.CUSTOMER_INFO);
    };

    const getPositionNames = (user: any) => user.positions?.map((p: any) => p.name || p.positionName || p.id)?.join(', ') || '';

    return (
        <div className="h-full flex flex-col py-4 px-6">
            <Form
                name="form-customer-profile"
                layout="vertical"
                className="w-full space-y-4 p-4 bg-white rounded-lg overflow-auto"
                onFinish={handleAddEdit}
                autoComplete="off"
                form={form}
                onKeyDown={e => {
                    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                        e.preventDefault();
                    }
                }}
                initialValues={{
                    customerPersonInCharge: { userId: undefined },
                    customerContactPersons: [],
                    customerBankAccounts: [],
                }}
                preserve
                disabled={!isFullPermission}
            >
                <div className="grid grid-cols-4 items-end gap-4">
                    <InfiniteScrollSelect
                        name="customerTypeId"
                        queryKey={['getListCustomerTypev3']}
                        label={t('customer.type')}
                        placeholder={t('customer.type')}
                        labelRender={value => value?.label ?? form.getFieldValue('customerTypeName')}
                        formItemProps={{
                            rules: [{ required: true, message: t('customer.type.required') }],
                            required: true,
                        }}
                        showSearch
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const resp = await apiSearchCustomerType({ pageNumber, pageSize, search }, { loading: false });
                            return resp.data;
                        }}
                    />
                    <BaseInput
                        label={t('customer.name')}
                        placeholder={t('customer.name')}
                        name="name"
                        formItemProps={{
                            required: true,
                            rules: [{ required: true, message: t('customer.name.required') }],
                            className: 'col-span-1',
                        }}
                    />

                    <BaseInput
                        label={t('customer.abbreviated_name')}
                        placeholder={t('customer.abbreviated_name')}
                        name="nameShort"
                        formItemProps={{
                            required: true,
                            rules: [{ required: true, message: t('customer.abbreviated_name.required') }],
                        }}
                    />

                    <BaseInput
                        label={t('customer.phone')}
                        placeholder={t('customer.phone')}
                        name="phone"
                        formItemProps={{
                            required: true,
                            rules: [
                                { required: true, message: t('customer.phone.required') },
                                { pattern: RegexValidate.PHONE, message: t('global.phone_number.format') },
                            ],
                        }}
                    />

                    <BaseInput label={t('customer.add.email')} placeholder={t('customer.add.email')} name="email" />
                    <BaseInput name="taxCode" placeholder={t('customer.tax_code')} label={t('customer.tax_code')} />

                    <BaseInput label={t('customer.company_address')} placeholder={t('customer.company_address')} name="address" />

                    <BaseTextArea
                        label={t('product.add_edit.description')}
                        rows={1}
                        placeholder={t('product.add_edit.description')}
                        name="description"
                        formItemProps={{
                            className: 'col-span-1',
                        }}
                    />
                </div>

                <div className="col-span-6 space-y-4">
                    <div className="col-span-6 font-bold flex justify-center items-center gap-2">
                        <div className="min-w-fit">{t('customer.person_in_charge')}</div>
                        <div className="h-[1px] w-full bg-gray-400 mt-1" />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <InfiniteScrollSelect
                            name={['customerPersonInCharge', 'userId']}
                            queryKey={['searchUsersForCustomer']}
                            label={t('customer.person_in_charge_name')}
                            placeholder={t('customer.select_person_in_charge')}
                            labelRender={value => value?.label ?? form.getFieldValue(['customerPersonInCharge', 'userName'])}
                            formItemProps={{
                                required: true,
                                rules: [{ required: true, message: t('customer.person_in_charge_name.required') }],
                            }}
                            showSearch
                            fetchData={async ({ pageNumber, pageSize, search }) => {
                                const resp = await apiSearchUsers(pageNumber, pageSize, search || '', { loading: false });
                                return resp.data;
                            }}
                            onChange={(value, option: any) => {
                                if (!option || Array.isArray(option)) return;
                                const { id, fullName, phoneNumber, email, positionNames } = option;
                                form.setFieldsValue({
                                    customerPersonInCharge: {
                                        userId: id,
                                        userName: fullName,
                                        userPhone: phoneNumber,
                                        userEmail: email,
                                        userPosition: positionNames,
                                    },
                                });
                            }}
                            mapData={(data: any[]) =>
                                data.map(user => ({
                                    key: user.id,
                                    value: user.id,
                                    label: user.fullName,
                                    ...user,
                                    positionNames: getPositionNames(user),
                                }))
                            }
                        />
                        <BaseInput
                            name={['customerPersonInCharge', 'userPhone']}
                            label={t('customer.phone')}
                            placeholder={t('customer.phone')}
                            readOnly
                        />

                        <BaseInput
                            name={['customerPersonInCharge', 'userEmail']}
                            label={t('customer.email')}
                            placeholder={t('customer.email')}
                            readOnly
                        />

                        <BaseInput
                            name={['customerPersonInCharge', 'userPosition']}
                            label={t('global.position')}
                            placeholder={t('global.position')}
                            readOnly
                        />
                    </div>
                </div>
                <Form.List name="customerContactPersons">
                    {(fields, { add, remove }) => {
                        const columns: ColumnsType = [
                            {
                                title: t('category.list.index'),
                                dataIndex: 'stt',
                                align: 'center',
                                className: 'text-center',
                                width: 50,
                                render: (_: any, __: any, index: number) => index + 1,
                            },
                            {
                                title: (
                                    <span>
                                        {t('customer.contact_person')}
                                        <span className="text-red-600">*</span>
                                    </span>
                                ),
                                dataIndex: 'name',
                                width: 200,
                                render: (_: any, __: any, index: number) => (
                                    <BaseInput
                                        {...fields[index]}
                                        name={[fields[index].name, 'name']}
                                        label=""
                                        placeholder={t('customer.contact_person')}
                                        formItemProps={{
                                            className: 'w-full',
                                            rules: [{ required: true, message: t('supplier.contact_person.required') }],
                                        }}
                                    />
                                ),
                            },
                            {
                                title: (
                                    <span>
                                        {t('customer.phone')}
                                        <span className="text-red-600">*</span>
                                    </span>
                                ),
                                dataIndex: 'phone',
                                width: 200,
                                render: (_: any, __: any, index: number) => (
                                    <BaseInput
                                        {...fields[index]}
                                        name={[fields[index].name, 'phone']}
                                        label=""
                                        placeholder={t('customer.phone')}
                                        formItemProps={{
                                            rules: [{ required: true, pattern: RegexValidate.PHONE, message: t('global.phone_number.format') }],
                                            className: 'w-full',
                                        }}
                                    />
                                ),
                            },
                            {
                                title: t('global.position'),
                                dataIndex: 'position',
                                width: 200,
                                render: (_: any, __: any, index: number) => (
                                    <BaseInput
                                        {...fields[index]}
                                        name={[fields[index].name, 'position']}
                                        label=""
                                        placeholder={t('global.position')}
                                        formItemProps={{ className: 'w-full' }}
                                    />
                                ),
                            },
                            {
                                title: t('global.description'),
                                dataIndex: 'description',
                                width: 400,
                                render: (_: any, __: any, index: number) => (
                                    <BaseTextArea
                                        {...fields[index]}
                                        name={[fields[index].name, 'description']}
                                        label=""
                                        placeholder={t('global.description')}
                                        rows={1}
                                        formItemProps={{ className: 'w-full' }}
                                    />
                                ),
                            },
                            {
                                title: t('Action'),
                                dataIndex: 'actions',
                                width: 100,
                                align: 'center',
                                className: 'text-center',
                                render: (_: any, __: any, index: number) => (
                                    <BaseButton
                                        className="text-red-500"
                                        type="text"
                                        size="small"
                                        onClick={() => remove(fields[index].name)}
                                        icon={<DeleteOutlined />}
                                    />
                                ),
                            },
                        ];

                        return (
                            <div className="col-span-6 space-y-4">
                                <div className="col-span-6 font-bold flex justify-center items-center gap-2">
                                    <div className="min-w-fit">{t('customer.contact_information')}</div>
                                    <div className="h-[1px] w-full bg-gray-400 mt-1" />
                                    <BaseButton icon={<PlusOutlined />} label={t('Add new')} type="primary" onClick={() => add()} />
                                </div>

                                <Table
                                    key={'customerContactPersons'}
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
                <Form.List name="customerBankAccounts">
                    {(fields, { add, remove }) => {
                        const columns: ColumnsType = [
                            {
                                title: t('category.list.index'),
                                dataIndex: 'stt',
                                align: 'center',
                                width: 50,
                                className: 'text-center',
                                render: (_: any, __: any, index: number) => index + 1,
                            },
                            {
                                title: (
                                    <span>
                                        {t('customer.account_number')}
                                        <span className="text-red-600">*</span>
                                    </span>
                                ),
                                dataIndex: 'bankAccountNumber',
                                width: 200,
                                render: (_: any, __: any, index: number) => (
                                    <BaseInput
                                        {...fields[index]}
                                        name={[fields[index].name, 'bankAccountNumber']}
                                        label=""
                                        placeholder={t('customer.account_number')}
                                        formItemProps={{
                                            rules: [
                                                { required: true, message: t('supplier.account_number.required') },
                                                { pattern: RegexValidate.INTEGER, message: t('global.account_number.format') },
                                            ],
                                            className: 'w-full',
                                        }}
                                    />
                                ),
                            },
                            {
                                title: (
                                    <span>
                                        {t('supplier.username')} <span className="text-red-600">*</span>
                                    </span>
                                ),
                                width: 200,
                                dataIndex: 'bankAccountName',
                                render: (_: any, __: any, index: number) => (
                                    <BaseInput
                                        {...fields[index]}
                                        name={[fields[index].name, 'bankAccountName']}
                                        label=""
                                        placeholder={t('supplier.username')}
                                        formItemProps={{
                                            rules: [{ required: true, message: t('supplier.username.required') }],
                                            className: 'w-full',
                                        }}
                                    />
                                ),
                            },
                            {
                                title: (
                                    <span>
                                        {t('customer.bank_name')} <span className="text-red-600">*</span>
                                    </span>
                                ),
                                width: 200,
                                dataIndex: 'bankName',
                                render: (_: any, __: any, index: number) => (
                                    <BaseInput
                                        {...fields[index]}
                                        name={[fields[index].name, 'bankName']}
                                        label=""
                                        placeholder={t('customer.bank_name')}
                                        formItemProps={{
                                            className: 'w-full',
                                            rules: [{ required: true, message: t('supplier.bank_name.required') }],
                                        }}
                                    />
                                ),
                            },
                            {
                                title: t('customer.branch_name'),
                                dataIndex: 'bankBranch',
                                width: 200,
                                render: (_: any, __: any, index: number) => (
                                    <BaseInput
                                        {...fields[index]}
                                        name={[fields[index].name, 'bankBranch']}
                                        label=""
                                        placeholder={t('customer.branch_name')}
                                        formItemProps={{ className: 'w-full' }}
                                    />
                                ),
                            },
                            {
                                title: t('global.description'),
                                dataIndex: 'description',
                                width: 200,
                                render: (_: any, __: any, index: number) => (
                                    <BaseTextArea
                                        {...fields[index]}
                                        name={[fields[index].name, 'description']}
                                        label=""
                                        placeholder={t('global.description')}
                                        rows={1}
                                        formItemProps={{ className: 'w-full' }}
                                    />
                                ),
                            },
                            {
                                title: t('Action'),
                                dataIndex: 'actions',
                                width: 100,
                                className: 'text-center',
                                align: 'center',
                                render: (_: any, __: any, index: number) => (
                                    <BaseButton
                                        className="text-red-500"
                                        type="text"
                                        size="small"
                                        onClick={() => remove(fields[index].name)}
                                        icon={<DeleteOutlined />}
                                    />
                                ),
                            },
                        ];

                        return (
                            <div className="space-y-4 col-span-6">
                                <div className="col-span-6 font-bold flex justify-center items-center gap-2">
                                    <span className="min-w-fit">{t('customer.bank_information')}</span>
                                    <div className="h-[1px] w-full bg-gray-400 mt-1" />
                                    <BaseButton icon={<PlusOutlined />} label={t('Add new')} type="primary" onClick={() => add()} />
                                </div>

                                <Table key={'customerBankAccounts'} columns={columns} dataSource={fields} pagination={false} rowKey="key" bordered />
                            </div>
                        );
                    }}
                </Form.List>

                <div className="flex justify-end items-center pt-2 col-span-6 gap-2">
                    {!isEdit && <BaseCheckbox name="isSaveAdd" labelCheckbox={t('global.save_and_add')} />}
                    <BaseButton label={t('global.popup.reject')} onClick={handleClose} disabled={false} />
                    <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" />
                </div>
            </Form>
        </div>
    );
};

export default AddEditCustomerInfo;
