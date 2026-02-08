import { apiSearchExpensesType, apiSearchPaymentFund } from '@/api/category.api';
import { apiCreateDebtReceivableOther, apiGetDebtReceivableOtherById, apiUpdateDebtReceivableOther } from '@/api/debt-receivable-other.api';
import { apiSearchUsers } from '@/api/user.api';
import { AppRouters, DefaultMappingPermission, DefaultRoles } from '@/constants';
import BaseCheckbox from '@/core/components/Checkbox';
import BaseDatePicker from '@/core/components/DatePicker';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseSelect from '@/core/components/Select/BaseSelect';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { DeleteOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Form, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import moment from 'moment';
import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import BaseButton from '@/components/button';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { convertTimeToInput } from '@/utils/format-datetime';
import { SelectHelper, convertedDateProps, formatMoney, handleCommonError } from '@/utils/helpers';

import { DebtReceivableOtherRequest, DebtReceivableOtherStatus } from '@/interface/debt-receivable-other';

const { Text } = Typography;

const AddEditDebtReceivableOther = () => {
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const { t } = useLocale();
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.DEBT_RECEIVABELES_OTHER]);

    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};

    const isAdmin = currentUser?.roles?.some(role => role.code === DefaultRoles.ADMIN || role.code === DefaultRoles.SUPER_ADMIN) ?? false;

    const requester = Form.useWatch(['requester'], { form, preserve: true });
    const watchedDetails = Form.useWatch('details', { form, preserve: true }) || [];
    const totalAmount = watchedDetails.reduce((sum: number, detail: any) => {
        if (!detail?.cost) return sum;
        return sum + detail?.cost;
    }, 0);
    const getPositionNames = (user: any) => user.positions?.map((p: any) => p.name || p.positionName || p.id)?.join(', ') || '';

    const { data: formData } = useQuery({
        queryKey: ['getDetailDebtReceivableOther', id],
        queryFn: async () => {
            const res = await apiGetDebtReceivableOtherById(id || '');
            if (res?.data) {
                const temp = {
                    ...res?.data,
                    documentDate: res?.data?.documentDate ? convertTimeToInput(res?.data?.documentDate) : null,
                    ticketType: res?.data?.ticketType,
                    ticketTypeName: res?.data?.ticketTypeName,
                    paymentMethod: res?.data?.paymentMethod,
                    paymentMethodName: res?.data?.paymentMethodName,
                    details: res?.data?.details?.sort((a: any, b: any) => a?.number - b?.number) || [],
                    attachments: res?.data?.attachments?.sort((a: any, b: any) => a?.id?.localeCompare(b?.id)) || [],
                };
                form.setFieldsValue(temp);
            }
            return res?.data;
        },
        enabled: isEdit,
        refetchOnWindowFocus: false,
    });

    const isFormDisabled = useMemo(() => {
        if (isAdmin) return false;
        if (!isFullPermission) return true;
        if (isEdit && formData?.status === DebtReceivableOtherStatus.Paid) {
            return true;
        }
        return false;
    }, [isAdmin, isFullPermission, isEdit, formData?.status]);

    useEffect(() => {
        if (!id) return;
        dispatch(
            setBreadCrumbs({
                [id]: t('finance_accounting.debt_receivable_other.edit'),
            }),
        );
    }, [id]);

    const handleAddEdit = async (data: any) => {
        try {
            const params: DebtReceivableOtherRequest = {
                ...(isEdit && formData && { id: formData.id }),
                documentDate: data.documentDate,
                status: data.status || DebtReceivableOtherStatus.UnPaid,
                note: data.note,
                ticketType: data.ticketTypeData?.code || data.ticketType,
                ticketTypeName: form.getFieldValue('ticketTypeName'),
                paymentMethod: data.paymentMethodData?.code || data.paymentMethod,
                paymentMethodName: form.getFieldValue('paymentMethodName'),
                requester: requester?.userId ? requester : ({} as any),
                details:
                    data.details?.map((item: any, index: number) => ({
                        name: item.name,
                        paymentDate: item.paymentDate,
                        businessPurpose: item.businessPurpose,
                        cost: item.cost || 0,
                        number: index + 1,
                        note: item.note,
                    })) || [],
                attachments:
                    data.attachments?.map((item: any) => ({
                        name: item.name,
                        description: item.description,
                        extension: item.extension,
                        path: item.path,
                    })) || [],
            };

            const res = isEdit ? await apiUpdateDebtReceivableOther(params) : await apiCreateDebtReceivableOther(params);

            if (res.succeeded) {
                notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
                if (data?.isSaveAdd) {
                    form.resetFields();
                } else {
                    navigate(AppRouters.DEBT_RECEIVABELES_OTHER);
                }
            } else {
                throw res;
            }
        } catch (error: any) {
            handleCommonError(error, t);
        }
    };

    const handleClose = () => {
        navigate(AppRouters.DEBT_RECEIVABELES_OTHER);
    };

    return (
        <div className="p-3">
            <Form
                name="form-payment-slip"
                layout="vertical"
                rootClassName="relative"
                className="w-full h-[calc(100vh_-_94px)] flex flex-col bg-white rounded-lg overflow-auto"
                onFinish={handleAddEdit}
                autoComplete="off"
                form={form}
                onKeyDown={e => {
                    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                        e.preventDefault();
                    }
                }}
                initialValues={{
                    status: DebtReceivableOtherStatus.UnPaid,
                    ticketType: undefined,
                    ticketTypeName: undefined,
                    paymentMethod: undefined,
                    paymentMethodName: undefined,
                    requester: { userId: undefined },
                    details: [{}],
                    attachments: [],
                    documentDate: moment(),
                }}
                preserve
                disabled={isFormDisabled}
            >
                <div className="max-w-full grow p-4 box-border space-y-4">
                    {isEdit && formData?.status === DebtReceivableOtherStatus.Paid && !isAdmin && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
                            <div className="flex items-start">
                                <ExclamationCircleOutlined className="text-yellow-400 text-lg mt-0.5" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-yellow-800">
                                        {t('finance_accounting.debt_receivable_other.message.paid_slip_readonly')}
                                    </p>
                                    <p className="mt-1 text-xs text-yellow-700">
                                        {t('finance_accounting.debt_receivable_other.message.contact_admin')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-6  gap-4">
                        <BaseDatePicker
                            name="documentDate"
                            label={t('finance_accounting.payment_slip.document_date')}
                            placeholder={t('finance_accounting.payment_slip.document_date')}
                            className="w-full"
                            showTime
                            format="DD-MM-YYYY HH:mm"
                            formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                        />

                        <BaseSelect
                            name="status"
                            label={t('global.status')}
                            placeholder={t('finance_accounting.debt_receivable_other.status')}
                            options={[
                                { value: DebtReceivableOtherStatus.UnPaid, label: t('finance_accounting.debt_receivable_other.status.unpaid') },
                                { value: DebtReceivableOtherStatus.Paid, label: t('finance_accounting.debt_receivable_other.status.paid') },
                            ]}
                            formItemProps={{
                                required: true,
                            }}
                        />
                        <InfiniteScrollSelect
                            name="ticketType"
                            queryKey={['searchExpensesTypeForPaymentSlip']}
                            label={t('finance_accounting.payment_slip.ticket_type.income')}
                            placeholder={t('finance_accounting.payment_slip.ticket_type.income')}
                            labelRender={val => val?.label ?? form.getFieldValue('ticketTypeName')}
                            formItemProps={{
                                rules: [{ required: true, message: t('global.message.required_field') }],
                            }}
                            showSearch
                            fetchData={async ({ pageNumber, pageSize, search }) => {
                                const resp = await apiSearchExpensesType({ pageNumber, pageSize, search, Type: [0] }, { loading: false });
                                return resp.data;
                            }}
                            mapData={(data: any[]) =>
                                data.map(item => ({
                                    key: item.id,
                                    value: item.code,
                                    label: item.name,
                                    ...item,
                                }))
                            }
                            onChange={(value, option: any) => {
                                form.setFieldValue('ticketTypeName', option?.label || option?.name);
                            }}
                            onSelect={(value, option: any) => {
                                form.setFieldValue('ticketTypeName', option?.label || option?.name);
                            }}
                        />

                        <InfiniteScrollSelect
                            name="paymentMethod"
                            queryKey={['searchPaymentFundForDebtReceivableOther']}
                            label={t('finance_accounting.payment_slip.payment_method')}
                            placeholder={t('finance_accounting.payment_slip.payment_method')}
                            labelRender={val => val?.label ?? form.getFieldValue('paymentMethodName')}
                            formItemProps={{
                                rules: [{ required: true, message: t('global.message.required_field') }],
                            }}
                            showSearch
                            fetchData={async ({ pageNumber, pageSize, search }) => {
                                const resp = await apiSearchPaymentFund({ pageNumber, pageSize, search }, { loading: false });
                                return resp.data;
                            }}
                            mapData={(data: any[]) =>
                                data.map(item => ({
                                    key: item.id,
                                    value: item.code,
                                    label: item.name,
                                    ...item,
                                }))
                            }
                            onChange={(value, option: any) => {
                                form.setFieldValue('paymentMethodName', option?.label || option?.name);
                            }}
                            onSelect={(value, option: any) => {
                                form.setFieldValue('paymentMethodName', option?.label || option?.name);
                            }}
                        />
                        <BaseTextArea
                            label={t('finance_accounting.payment_slip.note')}
                            rows={1}
                            placeholder={t('finance_accounting.payment_slip.note')}
                            name="note"
                            formItemProps={{
                                className: 'col-span-2',
                            }}
                        />
                    </div>

                    <div className="col-span-6 space-y-4">
                        <div className="col-span-6 font-bold flex justify-center items-center gap-2">
                            <div className="min-w-fit">{t('finance_accounting.debt_receivable_other.responsible_officer')}</div>
                            <div className="h-[1px] w-full bg-gray-400 mt-1" />
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <InfiniteScrollSelect
                                name={['requester', 'userId']}
                                queryKey={['searchUsersForDebtReceivableOther']}
                                label={t('finance_accounting.debt_receivable_other.responsible_officer_name')}
                                placeholder={t('finance_accounting.debt_receivable_other.responsible_officer_name')}
                                labelRender={item => SelectHelper.labelRender(item, requester, ['userName', 'userId'])}
                                formItemProps={{
                                    rules: [{ required: true, message: t('global.message.required_field') }],
                                }}
                                showSearch
                                fetchData={async ({ pageNumber, pageSize, search }) => {
                                    const resp = await apiSearchUsers(pageNumber, pageSize, search);
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
                                    form.setFieldValue('requester', {
                                        userId: value,
                                        userName: option?.label || option?.fullName,
                                        userCode: option?.code,
                                        userPhone: option?.phoneNumber,
                                        userPosition: option?.positionNames || '',
                                        userDepartment:
                                            option?.departments?.map((item: any) => item.name || item.departmentName || item.id)?.join(', ') || '',
                                    });
                                }}
                            />

                            <BaseInput name={['requester', 'userPhone']} label={t('global.phone')} placeholder={t('global.phone')} readOnly />
                            <BaseInput
                                name={['requester', 'userDepartment']}
                                label={t('global.department')}
                                placeholder={t('global.department')}
                                readOnly
                            />

                            <BaseInput
                                name={['requester', 'userPosition']}
                                label={t('global.position')}
                                placeholder={t('global.position')}
                                readOnly
                            />
                        </div>
                    </div>

                    <Form.List name="details">
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
                                            {t('finance_accounting.payment_slip.paymentSlipName')}
                                            <span className="text-red-600">*</span>
                                        </span>
                                    ),
                                    dataIndex: 'name',
                                    width: 200,
                                    render: (_: any, __: any, index: number) => (
                                        <BaseTextArea
                                            {...fields[index]}
                                            name={[fields[index].name, 'name']}
                                            label=""
                                            placeholder={t('finance_accounting.payment_slip.paymentSlipName')}
                                            rows={1}
                                            formItemProps={{
                                                className: 'w-full',
                                                rules: [{ required: true, message: t('global.message.required_field') }],
                                            }}
                                        />
                                    ),
                                },
                                {
                                    title: (
                                        <span>
                                            {t('finance_accounting.debt_receivable_other.collection_date')}
                                            <span className="text-red-600">*</span>
                                        </span>
                                    ),
                                    dataIndex: 'paymentDate',
                                    width: 110,
                                    render: (_: any, __: any, index: number) => {
                                        return (
                                            <BaseDatePicker
                                                {...fields[index]}
                                                name={[fields[index].name, 'paymentDate']}
                                                label=""
                                                placeholder={t('finance_accounting.debt_receivable_other.collection_date')}
                                                format="DD/MM/YYYY"
                                                formItemProps={{
                                                    ...convertedDateProps,
                                                    rules: [{ required: true, message: t('global.message.required_field') }],
                                                }}
                                                className="w-full"
                                            />
                                        );
                                    },
                                },

                                {
                                    title: t('finance_accounting.payment_slip.business_purpose'),
                                    dataIndex: 'businessPurpose',
                                    width: 200,
                                    render: (_: any, __: any, index: number) => (
                                        <BaseTextArea
                                            {...fields[index]}
                                            name={[fields[index].name, 'businessPurpose']}
                                            rows={1}
                                            label=""
                                            placeholder={t('finance_accounting.payment_slip.business_purpose')}
                                            formItemProps={{ className: 'w-full' }}
                                        />
                                    ),
                                },
                                {
                                    title: (
                                        <span>
                                            {t('finance_accounting.payment_slip.cost')}
                                            <span className="text-red-600">*</span>
                                        </span>
                                    ),
                                    dataIndex: 'cost',
                                    width: 150,
                                    render: (_: any, __: any, index: number) => (
                                        <BaseInputNumber
                                            {...fields[index]}
                                            name={[fields[index].name, 'cost']}
                                            label=""
                                            isMoneyFormat
                                            placeholder={t('finance_accounting.payment_slip.cost')}
                                            min={1}
                                            formItemProps={{
                                                className: 'w-full',
                                                rules: [{ required: true, message: t('global.message.required_field') }],
                                            }}
                                        />
                                    ),
                                },
                                {
                                    title: t('finance_accounting.payment_slip.note'),
                                    dataIndex: 'note',
                                    width: 200,
                                    render: (_: any, __: any, index: number) => (
                                        <BaseTextArea
                                            {...fields[index]}
                                            name={[fields[index].name, 'note']}
                                            label=""
                                            placeholder={t('finance_accounting.payment_slip.note')}
                                            rows={1}
                                            formItemProps={{ className: 'w-full' }}
                                        />
                                    ),
                                },
                                {
                                    dataIndex: 'actions',
                                    width: 50,
                                    align: 'center',
                                    className: 'text-center',
                                    render: (_: any, __: any, index: number) =>
                                        fields.length > 1 ? (
                                            <DeleteOutlined className="text-red-500 cursor-pointer" onClick={() => remove(fields[index].name)} />
                                        ) : null,
                                },
                            ];

                            return (
                                <div className="col-span-6 space-y-4">
                                    <div className="col-span-6 font-bold flex justify-center items-center gap-2">
                                        <div className="min-w-fit">{t('finance_accounting.debt_receivable_other.details')}</div>
                                        <div className="h-[1px] w-full bg-gray-400 mt-1" />
                                        <BaseButton icon={<PlusOutlined />} label={t('Add new')} type="primary" onClick={() => add()} />
                                    </div>

                                    <Table
                                        key={'paymentSlipDetails'}
                                        bordered
                                        columns={columns}
                                        dataSource={fields}
                                        pagination={false}
                                        rowKey="key"
                                        scroll={{ x: 'max-content' }}
                                    />
                                </div>
                            );
                        }}
                    </Form.List>
                </div>
                <div className="sticky bottom-0 px-4 py-2 left-0 bg-white z-10 border-t border-gray-200 flex flex-col space-y-2">
                    <div className="flex justify-end items-center">
                        <Text className="text-lg font-semibold mr-2">{t('finance_accounting.debt_receivable_other.total_collection')}: </Text>
                        <Text className="font-bold text-xl text-black">{formatMoney(totalAmount)}</Text>
                    </div>
                    <div className="flex justify-end items-center gap-2">
                        {!isEdit && <BaseCheckbox name="isSaveAdd" labelCheckbox={t('global.save_and_add')} />}
                        <BaseButton label={t('global.popup.reject')} onClick={handleClose} disabled={false} />
                        <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" disabled={isFormDisabled} />
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default AddEditDebtReceivableOther;
