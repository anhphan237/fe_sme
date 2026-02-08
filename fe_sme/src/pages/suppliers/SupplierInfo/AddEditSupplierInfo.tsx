import { apiSearchProductType, apiSearchSupplierType } from '@/api/category.api';
import { apiAddSupplierInfo, apiGetDetailSupplierInfo, apiUpdateSupplierInfo } from '@/api/supplier.api';
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

const AddEditSupplierInfo = () => {
    const { id } = useParams<{ id?: string }>();
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.SUPPLIER_INFO]);
    const isEdit = !!id;
    const { t } = useLocale();
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { data: formData } = useQuery({
        queryKey: ['getDetailSupplierInfo', id],
        queryFn: async () => {
            const res = await apiGetDetailSupplierInfo(id || '');
            if (res?.data) {
                const temp = {
                    ...res?.data,
                    supplierProductTypes: res.data.supplierProductTypes.map((item: any) => ({
                        value: item.productTypeId,
                        label: item.name,
                        key: item.code,
                    })),
                    supplierPersonInCharge: res?.data?.supplierPersonInCharge,
                    supplierContactPersons: res?.data?.supplierContactPersons?.sort((a: any, b: any) => a?.number - b?.number),
                    supplierBankAccounts: res?.data?.supplierBankAccounts?.sort((a: any, b: any) => a?.number - b?.number),
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
                [id]: t('supplier.info.edit'),
            }),
        );
    }, [id]);

    const handleAddEdit = async (data: any) => {
        try {
            const params = {
                ...(isEdit && formData && { id: formData.id }),
                supplierTypeId: data.supplierTypeId,
                name: data.name,
                nameShort: data.nameShort,
                phone: data.phone,
                email: data.email,
                address: data.address,
                description: data.description,
                taxCode: data.taxCode,
                supplierPersonInCharge: data.supplierPersonInCharge?.userId
                    ? {
                          userId: data.supplierPersonInCharge.userId,
                      }
                    : undefined,
                supplierProductTypes:
                    data.supplierProductTypes?.map((item: any) => ({
                        productTypeId: item.value,
                        name: item.label,
                        code: item.key,
                    })) || [],
                supplierContactPersons: data.supplierContactPersons?.map((item: any, index: number) => ({
                    name: item.name,
                    phone: item.phone,
                    position: item.position,
                    description: item.description,
                    number: index + 1,
                })),
                supplierBankAccounts: data.supplierBankAccounts?.map((item: any, index: number) => ({
                    bankAccountName: item.bankAccountName,
                    bankAccountNumber: item.bankAccountNumber,
                    bankName: item.bankName,
                    bankBranch: item.bankBranch,
                    description: item.description,
                    number: index + 1,
                })),
            };

            const res = isEdit ? await apiUpdateSupplierInfo({ Payload: params }) : await apiAddSupplierInfo({ Payload: params });

            if (res.succeeded) {
                notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
                if (data?.isSaveAdd) {
                    form.resetFields();
                } else {
                    navigate(AppRouters.SUPPLIER_INFO);
                }
            } else {
                throw res;
            }
        } catch (error: any) {
            handleCommonError(error, t);
        }
    };

    const handleClose = () => {
        navigate(AppRouters.SUPPLIER_INFO);
    };

    const getPositionNames = (user: any) => user.positions?.map((p: any) => p.name || p.positionName || p.id)?.join(', ') || '';
    return (
        <div className="h-full flex flex-col py-4 px-6">
            <Form
                name="form-supplier-profile"
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
                    supplierPersonInCharge: { userId: undefined },
                    supplierContactPersons: [],
                    supplierBankAccounts: [],
                    supplierProductTypes: [],
                }}
                disabled={!isFullPermission}
                clearOnDestroy
                preserve
            >
                <div className="grid grid-cols-4 items-end gap-4">
                    <InfiniteScrollSelect
                        name="supplierTypeId"
                        queryKey={['getListSupplierTypev3']}
                        label={t('supplier.type')}
                        placeholder={t('supplier.type')}
                        labelRender={value => value?.label ?? form.getFieldValue('supplierTypeName')}
                        formItemProps={{
                            rules: [{ required: true, message: t('supplier.type.required') }],
                            required: true,
                        }}
                        showSearch
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const resp = await apiSearchSupplierType({ pageNumber, pageSize, search }, { loading: false });
                            return resp.data;
                        }}
                    />

                    <BaseInput
                        label={t('supplier.name')}
                        placeholder={t('supplier.name')}
                        name="name"
                        formItemProps={{
                            required: true,
                            rules: [{ required: true, message: t('supplier.add_edit.name.required') }],
                            className: 'col-span-2',
                        }}
                    />
                    <BaseInput
                        label={t('supplier.abbreviated_name')}
                        placeholder={t('supplier.abbreviated_name')}
                        name="nameShort"
                        formItemProps={{
                            required: true,
                            rules: [{ required: true, message: t('supplier.abbreviated_name.required') }],
                            className: 'col-span-1',
                        }}
                    />
                    <BaseInput
                        label={t('supplier.phone')}
                        placeholder={t('supplier.phone')}
                        name="phone"
                        formItemProps={{
                            required: true,
                            rules: [
                                { required: true, message: t('supplier.add_edit.phone.required') },
                                { pattern: RegexValidate.PHONE, message: t('global.phone_number.format') },
                            ],
                            className: 'col-span-1',
                        }}
                    />
                    <BaseInput label={t('supplier.email')} placeholder={t('supplier.email')} name="email" />
                    <BaseInput
                        name="taxCode"
                        placeholder={t('supplier.tax_code')}
                        label={t('supplier.tax_code')}
                        formItemProps={{
                            className: 'col-span-1',
                        }}
                    />
                    <BaseInput label={t('supplier.address')} placeholder={t('supplier.address')} name="address" />
                    <InfiniteScrollSelect
                        name="supplierProductTypes"
                        queryKey={['getListProductTypes']}
                        label={t('supplier.product_types')}
                        placeholder={t('supplier.product_types.placeholder')}
                        labelRender={(option: any) => option?.label || option?.name}
                        value={form.getFieldValue('supplierProductTypes')}
                        labelInValue
                        key={form.getFieldValue('supplierProductTypes')}
                        mode="multiple"
                        formItemProps={{
                            className: 'col-span-2',
                        }}
                        showSearch
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const resp = await apiSearchProductType({ pageNumber, pageSize, search }, { loading: false });
                            return resp.data;
                        }}
                        mapData={(data: any[]) => {
                            const map = data.map(item => ({
                                value: item.productTypeId || item.id,
                                label: item.name,
                                key: item.code,
                            }));
                            return map;
                        }}
                        onChange={newValues => form.setFieldsValue({ supplierProductTypes: newValues })}
                    />
                    <BaseTextArea
                        label={t('product.add_edit.description')}
                        rows={1}
                        placeholder={t('product.add_edit.description')}
                        name="description"
                        formItemProps={{
                            className: 'col-span-2',
                        }}
                    />
                </div>

                <div className="col-span-6 space-y-4">
                    <div className="col-span-6 font-bold flex justify-center items-center gap-2">
                        <div className="min-w-fit">{t('supplier.person_in_charge')}</div>
                        <div className="h-[1px] w-full bg-gray-400 mt-1" />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <InfiniteScrollSelect
                            name={['supplierPersonInCharge', 'userId']}
                            queryKey={['getListUsers']}
                            label={t('supplier.person_in_charge_name')}
                            placeholder={t('supplier.select_person_in_charge')}
                            labelRender={value => value?.label ?? form.getFieldValue(['supplierPersonInCharge', 'userName'])}
                            showSearch
                            formItemProps={{
                                required: true,
                                rules: [{ required: true, message: t('supplier.person_in_charge_name.required') }],
                            }}
                            fetchData={async ({ pageNumber, pageSize, search }) => {
                                const resp = await apiSearchUsers(pageNumber, pageSize, search || '', { loading: false });
                                return resp.data;
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
                            onChange={(value, option: any) => {
                                const { id, fullName, phoneNumber, email, positionNames } = option;
                                form.setFieldsValue({
                                    supplierPersonInCharge: {
                                        userId: id,
                                        userName: fullName,
                                        userPhone: phoneNumber || '',
                                        userEmail: email || '',
                                        userPosition: positionNames || '',
                                    },
                                });
                            }}
                        />

                        <BaseInput
                            name={['supplierPersonInCharge', 'userPhone']}
                            label={t('supplier.phone')}
                            placeholder={t('supplier.phone')}
                            readOnly
                        />
                        <BaseInput
                            name={['supplierPersonInCharge', 'userEmail']}
                            label={t('supplier.email')}
                            placeholder={t('supplier.email')}
                            readOnly
                        />
                        <BaseInput
                            name={['supplierPersonInCharge', 'userPosition']}
                            label={t('global.position')}
                            placeholder={t('global.position')}
                            readOnly
                        />
                    </div>
                </div>

                <Form.List name="supplierContactPersons">
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
                                        {t('supplier.contact_person')} <span className="text-red-600">*</span>
                                    </span>
                                ),
                                dataIndex: 'name',
                                width: 200,
                                render: (_: any, __: any, index: number) => (
                                    <BaseInput
                                        {...fields[index]}
                                        name={[fields[index].name, 'name']}
                                        label=""
                                        placeholder={t('supplier.contact_person')}
                                        formItemProps={{
                                            rules: [{ required: true, message: t('supplier.contact_person.required') }],
                                            className: 'w-full',
                                        }}
                                    />
                                ),
                            },
                            {
                                title: (
                                    <span>
                                        {t('supplier.phone')}
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
                                        placeholder={t('supplier.phone')}
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
                                    <div className="min-w-fit">{t('supplier.contact_information')}</div>
                                    <div className="h-[1px] w-full bg-gray-400 mt-1" />
                                    <BaseButton icon={<PlusOutlined />} label={t('Add new')} type="primary" onClick={() => add()} />
                                </div>
                                <Table
                                    key={'supplierContactPersons'}
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
                <Form.List name="supplierBankAccounts">
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
                                        {t('supplier.account_number')}
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
                                        placeholder={t('supplier.account_number')}
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
                                        {t('supplier.bank_name')}
                                        <span className="text-red-600">*</span>
                                    </span>
                                ),
                                width: 200,
                                dataIndex: 'bankName',
                                render: (_: any, __: any, index: number) => (
                                    <BaseInput
                                        {...fields[index]}
                                        name={[fields[index].name, 'bankName']}
                                        label=""
                                        placeholder={t('supplier.bank_name')}
                                        formItemProps={{
                                            rules: [{ required: true, message: t('supplier.bank_name.required') }],
                                            className: 'w-full',
                                        }}
                                    />
                                ),
                            },
                            {
                                title: t('supplier.branch_name'),
                                dataIndex: 'bankBranch',
                                width: 200,
                                render: (_: any, __: any, index: number) => (
                                    <BaseInput
                                        {...fields[index]}
                                        name={[fields[index].name, 'bankBranch']}
                                        label=""
                                        placeholder={t('supplier.branch_name')}
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
                                    <span className="min-w-fit">{t('supplier.bank_information')}</span>
                                    <div className="h-[1px] w-full bg-gray-400 mt-1" />
                                    <BaseButton icon={<PlusOutlined />} label={t('Add new')} type="primary" onClick={() => add()} />
                                </div>

                                <Table key={'supplierBankAccounts'} columns={columns} dataSource={fields} pagination={false} rowKey="key" bordered />
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

export default AddEditSupplierInfo;
