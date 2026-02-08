import { apiSearchWarehouse } from '@/api/category.api';
import { apiGetDetailPurchaseContract } from '@/api/contract.api';
import { apiSearchSupplierInfo } from '@/api/customer.api';
import { apiAddEnterWarehouse, apiGetDetailEnterWarehouse, apiUpdateEnterWarehouse } from '@/api/logistics.api';
import { apiSearchUsers } from '@/api/user.api';
import { RegexValidate } from '@/constants';
import BaseCheckbox from '@/core/components/Checkbox';
import LocalDatePicker from '@/core/components/DatePicker/LocalDatePicker';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseModal from '@/core/components/Modal/BaseModal';
import BaseSelect from '@/core/components/Select/BaseSelect';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import ApproveTag from '@/core/components/Status/ApproveTag';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { LogisticStatusEnum } from '@/enums/LogisticStatus';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Col, Empty, Form, Row, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { get } from 'lodash';
import moment from 'moment';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import AddNewProductModal, { AddNewProductModalRef } from '@/pages/sales/components/AddNewProductModal';
import RightControl from '@/pages/sales/components/RightControl';

import BaseButton from '@/components/button';
import BaseFloatButton from '@/components/button/BaseFloatButton';
import BaseTable from '@/components/table';
import { notify } from '@/components/toast-message';

import { convertTimeToInput } from '@/utils/format-datetime';
import { InputHelper, handleCommonError } from '@/utils/helpers';

import { GOODS_RECEIPT_ISSUE_TYPE } from '@/constants/logistics';
import { QUOTATION_TARGET_STATUS } from '@/constants/sales/quotation';

import { IAddEditWarehouse } from '@/interface/logistics';

import ProductConfig, { WarehouseProductProductConfigRef } from '../ExportWarehouse/ProductConfig';
import ConfirmStatus from '../components/ConfirmStatus';
import Documents, { AttachmentRef } from '../components/Documents';

const { Text } = Typography;

const AddEditEnterWarehouse = () => {
    const { id, orderId } = useParams<{ id?: string; orderId?: string }>();
    const addModalRef = useRef<AddNewProductModalRef>(null);
    const productConfigRef = useRef<WarehouseProductProductConfigRef>(null);
    const [isConfirm, setIsConfirm] = useState<boolean>(false);
    const [currentStatus, setCurrentStatus] = useState<number>();
    const dispatch = useDispatch();

    const isEdit = !!id;
    const isAddNew = !!orderId;
    const { t } = useLocale();
    const [form] = Form.useForm();
    const hasReceiptReturn = Form.useWatch('hasReceiptReturn', form);
    const currentCustomer = Form.useWatch(['customer', 'currentCustomer'], form);
    const details = Form.useWatch('details', form);
    const status = Form.useWatch('status', { form, preserve: true });
    const totalQuantity = details?.reduce((sum: number, item: { quantity: number }) => sum + (item?.quantity || 0), 0) || 0;
    const totalWeight = details?.reduce((sum: number, item: { weightActual: number }) => sum + (item?.weightActual || 0), 0) || 0;
    const receiptDate = Form.useWatch('receiptDate', form);
    const deliveryDate = Form.useWatch('deliveryDate', form);
    const navigate = useNavigate();
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    const attachments = Form.useWatch('attachments', { form, preserve: true }) || [];
    const attachmentRef = useRef<AttachmentRef>(null);

    const { data: formData, refetch } = useQuery({
        queryKey: ['getDetailEnterWarehouse', id],
        queryFn: async () => {
            const res = await apiGetDetailEnterWarehouse(id || '');
            if (res?.data) {
                const data = res?.data;
                data.invoiceDate = convertTimeToInput(data.invoiceDate);
                data.deliveryDate = data?.deliveryDate ? convertTimeToInput(data.deliveryDate) : null;
                data.receiptDate = data?.receiptDate ? convertTimeToInput(data.receiptDate) : null;
                data.status = data.status;
                data.details = data?.details
                    ?.sort((a: any, b: any) => a?.number - b?.number)
                    ?.map((item: any) => {
                        const product = data.contract?.details.find((x: any) => x.productId === item.productId);
                        return { ...item, quantity: item?.quantity, maxQuantity: product?.remainingQuantity || item?.quantity };
                    });
                form.setFieldsValue(data);
            }
            return res?.data;
        },
        enabled: isEdit,
        refetchOnWindowFocus: false,
    });

    const { data: formDataAdd } = useQuery({
        queryKey: ['getDetailPurchaseContract', orderId],
        queryFn: async () => {
            const res = await apiGetDetailPurchaseContract(orderId || '');
            if (res?.data) {
                const data = res?.data;
                data.invoiceDate = convertTimeToInput(data.invoiceDate);
                data.deliveryDate = data?.deliveryDate ? convertTimeToInput(data.deliveryDate) : null;
                data.receiptDate = data?.receiptDate ? convertTimeToInput(data.receiptDate) : null;
                data.details = data?.details
                    ?.sort((a: any, b: any) => a?.number - b?.number)
                    ?.map((item: any) => ({ ...item, quantity: item?.remainingQuantity, maxQuantity: item?.remainingQuantity }));
                form.setFieldsValue(data);
            }
            return res?.data;
        },
        enabled: !isEdit && isAddNew,
        refetchOnWindowFocus: false,
    });

    const getDataOneItem = (data: any[]) => {
        if (data.length === 1) return data[0];
        return null;
    };

    const handleChangeCustomer = (_: string, currentCustomer: any) => {
        if (!currentCustomer) return;
        form.setFieldsValue({
            customer: {
                customerTaxCode: currentCustomer?.taxCode,
                customerCode: currentCustomer?.code,
                customerName: currentCustomer?.name,
                customerPhone: currentCustomer?.phone,
                customerContactPerson: getDataOneItem(currentCustomer?.customerContactPersons)?.name,
                customerContactPersonPhone: getDataOneItem(currentCustomer?.customerContactPersons)?.phone,
                customerBankAccountNumber: getDataOneItem(currentCustomer?.customerBankAccounts)?.bankAccountNumber,
                customerBankName: getDataOneItem(currentCustomer?.customerBankAccounts)?.bankName,
                currentCustomer,
                customerWarehouseName: getDataOneItem(currentCustomer?.customerWarehouses)?.name,
                customerWarehouseAddress: getDataOneItem(currentCustomer?.customerWarehouses)?.address,
            },
        });
    };

    const handleChangeContract = (_: string, dataContract: any) => {
        if (!dataContract) return;
        const { invoice, ...rest } = dataContract; // ignore invoice field as it is not needed in the form
        const clonedDataContract = { ...rest };
        clonedDataContract.invoiceDate = moment();
        clonedDataContract.deliveryDate = clonedDataContract?.deliveryDate ? convertTimeToInput(clonedDataContract.deliveryDate) : null;
        clonedDataContract.receiptDate = moment();
        clonedDataContract.personInCharge = {
            userId: currentUser?.id,
            userName: currentUser?.fullName,
            userPhone: currentUser?.phoneNumber,
        };
        clonedDataContract.details = clonedDataContract?.details?.map(({ id, quantity, ...rest }: { id: string; quantity: number }) => ({
            ...rest,
            quantity,
            maxQuantity: quantity,
        }));
        form.setFieldsValue(clonedDataContract);
    };

    const handleChangeWarehouse = (_: string, currentWarehouse: any) => {
        if (!currentWarehouse) return;
        form.setFieldsValue({
            warehouse: {
                warehouseAddress: currentWarehouse?.administrativeDivision ? JSON.parse(currentWarehouse?.administrativeDivision)?.address : '',
                warehouseTypeCode: currentWarehouse?.warehouseTypeCode,
                warehouseTypeName: currentWarehouse?.warehouseTypeName,
                warehouseCode: currentWarehouse?.code,
                warehouseName: currentWarehouse?.name,
            },
        });
    };

    const handleChangeUser = (_: string, currentUser: any) => {
        if (!currentUser) return;
        form.setFieldsValue({
            personInCharge: {
                userCode: currentUser?.code,
                userName: currentUser?.fullName,
                userPhone: currentUser?.phoneNumber,
                userPosition: currentUser?.positions?.map((user: any) => user.id)?.join(';'),
            },
        });
    };

    const handleAddEdit = async (data: IAddEditWarehouse) => {
        try {
            const params = {
                ...(isEdit && { id: formData?.id }),
                ...(isAddNew && { contractId: formDataAdd?.id }),
                ...data,
                type: GOODS_RECEIPT_ISSUE_TYPE.GOODS_RECEIPT,
                attachments:
                    attachments?.map((item: any) => {
                        const { id, uid, lastModifiedDate, originFileObj, status, ...rest } = item;
                        return rest;
                    }) ?? [],
                details: (data?.details ?? []).map((item: any, index: number) => {
                    return {
                        ...item,
                        costPrice: item?.importprice,
                        number: index + 1,
                    };
                }),
            };

            delete params?.customer?.currentCustomer;
            const res = isEdit ? await apiUpdateEnterWarehouse(params) : await apiAddEnterWarehouse(params);
            if (res.succeeded) {
                notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
                if (data?.isSaveAdd) {
                    form.resetFields();
                } else {
                    navigate(-1);
                }
            } else throw res;
        } catch (error) {
            handleCommonError(error, t);
        }
    };

    const handleClose = () => {
        navigate(-1);
    };

    const handleOpenDocuments = async () => {
        try {
            const response = await attachmentRef.current?.open(form.getFieldValue('attachments') || []);
            if (response?.code === 200) {
                form.setFieldValue('attachments', response.data);
            }
        } catch (error: any) {
            if (error?.code === -1) return;
            notify.error(error?.message || t('global.message.error_occurs'));
        }
    };

    const generateAttachmentPath = () => {
        if (isEdit) {
            const firstPath = attachments?.[0]?.path?.split('/')?.slice(-1)?.join('/');
            if (firstPath) {
                return `EnterWarehouse/Attachments/${firstPath}`;
            } else {
                return `EnterWarehouse/Attachments/${new Date().getTime()}`;
            }
        }
        return `EnterWarehouse/Attachments/${new Date().getTime()}`;
    };

    const handleProductConfig = async (index: number) => {
        const data = await productConfigRef.current?.open(details[index]);
        if (data?.code === 200 && data?.data) {
            const newProducts = [...details];
            newProducts[index] = {
                ...newProducts[index],
                ...data.data,
            };
            form.setFieldValue('details', newProducts);
        }
    };

    const handleCloseConfirm = () => {
        setIsConfirm(false);
        setCurrentStatus(undefined);
    };

    const handleOk = async () => {
        await handleAddEdit({ ...formData, status: currentStatus });
        await refetch();

        handleCloseConfirm();
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col my-4 mx-6 bg-white rounded-lg relative overflow-auto">
            <RightControl>
                <BaseFloatButton
                    icon={<FontAwesomeIcon icon={faFileExcel} size="lg" />}
                    badge={{ count: attachments?.length }}
                    type="primary"
                    onClick={handleOpenDocuments}
                    title={t('global.file')}
                />
            </RightControl>
            <Documents ref={attachmentRef} attachmentPath={generateAttachmentPath()} disabled={status === QUOTATION_TARGET_STATUS.APPROVED} />
            <Form
                name="form-enter-warehouse"
                layout="vertical"
                rootClassName="relative h-full max-h-[calc(100vh-100px)]"
                className="flex flex-col"
                onFinish={handleAddEdit}
                onError={e => console.error('Form EnterWarehouse error:', e)}
                onInvalid={e => console.error('Form EnterWarehouse invalid:', e)}
                autoComplete="off"
                form={form}
                onKeyDown={e => {
                    if (e.key === 'Enter') e.preventDefault();
                }}
                preserve
                initialValues={{
                    invoiceDate: moment(),
                    receiptDate: moment(),
                    personInCharge: {
                        userId: currentUser?.id,
                        userName: currentUser?.fullName,
                        userPhone: currentUser?.phoneNumber,
                        userPosition: currentUser?.positions?.map((user: any) => user.id)?.join(';'),
                    },
                }}
            >
                <div className="flex-1">
                    {isEdit && <ApproveTag value={formData?.status} className="absolute top-1 -right-1 !text-base" />}
                    <div className="mb-3"></div>
                    <div className="h-max w-full grid grid-cols-2 gap-4 items-start p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="w-full font-bold flex justify-center items-center gap-2 col-span-2">
                                <div className="min-w-fit">Thông tin chứng từ</div>
                                <div className="h-[1px] w-full bg-gray-400 mt-1" />
                            </div>
                            <div className="col-span-1">
                                <LocalDatePicker
                                    label={t('logistics.enter_warehouse.document_date')}
                                    placeholder={t('logistics.enter_warehouse.document_date')}
                                    name="invoiceDate"
                                    disabled={isEdit && (status === LogisticStatusEnum.CANCELED || status === LogisticStatusEnum.COMPLETED)}
                                    className="w-full"
                                    formItemProps={{
                                        required: true,
                                        rules: [{ required: true, message: t('logistics.enter_warehouse.document_date.required') }],
                                    }}
                                />
                            </div>
                            <div className="col-span-2">
                                <LocalDatePicker
                                    label={t('logistics.enter_warehouse.export_date')}
                                    placeholder={t('logistics.enter_warehouse.export_date')}
                                    name={'deliveryDate'}
                                    showTime
                                    disabled
                                    hidden
                                    format="YYYY-MM-DD HH:mm"
                                    maxDate={(receiptDate ? moment(receiptDate) : undefined) as any}
                                    formItemProps={{
                                        className: 'hidden',
                                    }}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="w-full font-bold flex justify-center items-center gap-2 col-span-2">
                                <div className="min-w-fit">Thông tin nhập</div>
                                <div className="h-[1px] w-full bg-gray-400 mt-1" />
                            </div>
                            <LocalDatePicker
                                label={t('logistics.enter_warehouse.receive_warehouse_date')}
                                placeholder={t('logistics.enter_warehouse.receive_warehouse_date')}
                                name={'receiptDate'}
                                showTime
                                format="YYYY-MM-DD HH:mm"
                                disabled={isEdit && (status === LogisticStatusEnum.CANCELED || status === LogisticStatusEnum.COMPLETED)}
                                minDate={(deliveryDate ? moment(deliveryDate) : undefined) as any}
                                className="w-full"
                                formItemProps={{
                                    required: true,
                                    rules: [
                                        {
                                            required: true,
                                            message: t('customer.enterwarehouse.date.required'),
                                        },
                                    ],
                                }}
                            />
                            <InfiniteScrollSelect
                                label={t('logistics.enter_warehouse.enter_warehouse')}
                                placeholder={t('logistics.enter_warehouse.enter_warehouse')}
                                queryKey={['getListWarehouseFromEnter']}
                                name={['warehouse', 'warehouseId']}
                                labelRender={value => value?.label ?? form.getFieldValue(['warehouse', 'warehouseName'])}
                                disabled={isEdit && (status === LogisticStatusEnum.CANCELED || status === LogisticStatusEnum.COMPLETED)}
                                onChange={handleChangeWarehouse}
                                formItemProps={{
                                    required: true,
                                    rules: [{ required: true, message: t('logistics.enter_warehouse.required') }],
                                }}
                                showSearch
                                fetchData={async ({ pageNumber, pageSize, search }) => {
                                    const res = await apiSearchWarehouse({ pageNumber, pageSize, search }, { loading: false });
                                    return res.data;
                                }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 font-bold flex justify-center items-center gap-2">
                                <div className="min-w-fit">{t('logistics.enter_warehouse.supplier_info')}</div>
                                <div className="h-[1px] w-full bg-gray-400 mt-1" />
                            </div>
                            <div className="col-span-2">
                                <InfiniteScrollSelect
                                    name={['customer', 'customerId']}
                                    queryKey={['getListCustomerInfov2']}
                                    label={t('customer.supplier')}
                                    placeholder={t('customer.supplier')}
                                    disabled
                                    labelRender={value => value?.label ?? form.getFieldValue(['customer', 'customerName'])}
                                    formItemProps={{
                                        rules: [{ required: true, message: t('customer.supplier.required') }],
                                        required: true,
                                    }}
                                    showSearch
                                    onChange={handleChangeCustomer}
                                    fetchData={async ({ pageNumber, pageSize, search }) => {
                                        const res = await apiSearchSupplierInfo({ pageNumber, pageSize, search }, { loading: false });
                                        return res.data;
                                    }}
                                />
                            </div>
                            <BaseInput name={['customer', 'currentCustomer']} formItemProps={{ className: 'hidden' }} />
                            <BaseInput name={['customer', 'customerCode']} formItemProps={{ className: 'hidden' }} />
                            <BaseInput name={['customer', 'customerName']} formItemProps={{ className: 'hidden' }} />
                            <BaseInput name={['customer', 'customerPhone']} formItemProps={{ className: 'hidden' }} />
                            <BaseInput
                                label={t('customer.tax_code')}
                                placeholder={t('customer.tax_code')}
                                name={['customer', 'customerTaxCode']}
                                disabled
                            />
                            <BaseSelect
                                label={t('customer.contact_person')}
                                placeholder={t('customer.contact_person')}
                                name={['customer', 'customerContactPerson']}
                                options={currentCustomer?.customerContactPersons?.map((item: { name: string }) => ({
                                    value: item?.name,
                                    label: item?.name,
                                }))}
                                disabled
                                formItemProps={{
                                    className: 'w-full',
                                }}
                            />
                            <BaseInput
                                label={t('customer.phone')}
                                placeholder={t('customer.phone')}
                                name={['customer', 'customerContactPersonPhone']}
                                disabled
                            />
                            <BaseSelect
                                label={t('customer.account_number')}
                                placeholder={t('customer.account_number')}
                                options={currentCustomer?.customerBankAccounts?.map((item: { bankAccountNumber: string }) => ({
                                    value: item?.bankAccountNumber,
                                    label: item?.bankAccountNumber,
                                }))}
                                disabled
                                name={['customer', 'customerBankAccountNumber']}
                                formItemProps={{
                                    className: 'w-full',
                                }}
                            />
                            <BaseInput
                                label={t('customer.bank_name')}
                                placeholder={t('customer.bank_name')}
                                name={['customer', 'customerBankName']}
                                disabled
                            />
                            <BaseInput
                                label={t('global.address')}
                                placeholder={t('global.address')}
                                name={['customer', 'customerWarehouseAddress']}
                                disabled
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 font-bold flex justify-center items-center gap-2">
                                <div className="min-w-fit">{t('logistics.enter_warehouse.receiver_info')}</div>
                                <div className="h-[1px] w-full bg-gray-400 mt-1" />
                            </div>
                            <div className="col-span-2">
                                <BaseInput
                                    label={t('global.address')}
                                    placeholder={t('global.address')}
                                    disabled
                                    name={['warehouse', 'warehouseAddress']}
                                />
                            </div>
                            <BaseInput name={['warehouse', 'warehouseTypeCode']} formItemProps={{ className: 'hidden' }} />
                            <BaseInput name={['warehouse', 'warehouseTypeName']} formItemProps={{ className: 'hidden' }} />
                            <BaseInput name={['warehouse', 'warehouseCode']} formItemProps={{ className: 'hidden' }} />
                            <BaseInput name={['warehouse', 'warehouseName']} formItemProps={{ className: 'hidden' }} />
                            <InfiniteScrollSelect
                                label={t('logistics.enter_warehouse.receiver')}
                                placeholder={t('logistics.enter_warehouse.receiver')}
                                queryKey={['getListUsersFromEnter']}
                                onChange={handleChangeUser}
                                disabled
                                name={['personInCharge', 'userId']}
                                labelRender={value => value?.label ?? form.getFieldValue(['personInCharge', 'userName'])}
                                formItemProps={{
                                    required: true,
                                    rules: [{ required: true, message: t('logistics.enter_warehouse.receiver.required') }],
                                }}
                                showSearch
                                fetchData={async ({ pageNumber, pageSize, search }) => {
                                    const res = await apiSearchUsers(pageNumber, pageSize, search, { loading: false });
                                    return res.data;
                                }}
                            />
                            <BaseInput name={['personInCharge', 'userCode']} formItemProps={{ className: 'hidden' }} />
                            <BaseInput name={['personInCharge', 'userName']} formItemProps={{ className: 'hidden' }} />
                            <BaseInput name={['personInCharge', 'userPhone']} formItemProps={{ className: 'hidden' }} />
                            <BaseInput
                                label={t('logistics.enter_warehouse.driver_name')}
                                placeholder={t('logistics.enter_warehouse.driver_name')}
                                disabled
                                name={['delivery', 'personnel']}
                            />
                            <BaseInput
                                label={t('customer.phone')}
                                placeholder={t('customer.phone')}
                                name={['delivery', 'phone']}
                                disabled
                                formItemProps={{
                                    rules: [{ pattern: RegexValidate.PHONE, message: t('global.phone_number.format') }],
                                    className: 'w-full',
                                }}
                            />
                            <BaseInput
                                label={t('logistics.enter_warehouse.license')}
                                placeholder={t('logistics.enter_warehouse.license')}
                                disabled
                                name={['delivery', 'licensePlate']}
                            />
                            <div className="col-span-2">
                                <BaseTextArea
                                    label={t('product.add_edit.description')}
                                    rows={1}
                                    placeholder={t('product.add_edit.description')}
                                    name={['delivery', 'description']}
                                    disabled={isEdit && (status === LogisticStatusEnum.CANCELED || status === LogisticStatusEnum.COMPLETED)}
                                />
                            </div>
                        </div>
                        <Form.List
                            name="details"
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
                            {(fields, { remove }, { errors }) => {
                                const columns: ColumnsType = [
                                    {
                                        title: t('category.list.index'),
                                        dataIndex: 'stt',
                                        align: 'center',
                                        className: 'text-center',
                                        width: 50,
                                        render: (_: any, __: any, index: number) => index + 1,
                                        onCell: () => ({ width: 50 }),
                                        onHeaderCell: () => ({ width: 50 }),
                                        fixed: 'left',
                                    },
                                    {
                                        title: (
                                            <span>
                                                {t('sales.product_name')} <span className="text-red-600">*</span>
                                            </span>
                                        ),
                                        width: 400,
                                        fixed: 'left',
                                        dataIndex: 'productName',
                                        ellipsis: true,
                                        className: 'truncate',
                                        render: (_: any, __: any, index: number) => {
                                            const productNameView = get(details, [fields[index].name, 'productNameView']);
                                            const productName = get(details, [fields[index].name, 'productName']);
                                            return (
                                                <>
                                                    <div className="flex flex-col gap-1">
                                                        <Text
                                                            className="!inline-block !font-semibold !text-md whitespace-nowrap truncate"
                                                            title={productName}
                                                        >
                                                            {productName}
                                                        </Text>
                                                        <Text
                                                            className="!inline-block !font-semibold !text-red-600 !text-md whitespace-nowrap truncate"
                                                            title={productNameView}
                                                        >
                                                            {productNameView}
                                                        </Text>
                                                    </div>
                                                    <BaseInput
                                                        {...fields[index]}
                                                        name={[fields[index].name, 'productGroup']}
                                                        formItemProps={{
                                                            className: 'hidden',
                                                        }}
                                                    />
                                                    <BaseInput
                                                        {...fields[index]}
                                                        name={[fields[index].name, 'productId']}
                                                        formItemProps={{
                                                            className: 'hidden',
                                                        }}
                                                    />
                                                    <BaseInput
                                                        {...fields[index]}
                                                        name={[fields[index].name, 'productNameView']}
                                                        formItemProps={{
                                                            className: 'hidden',
                                                        }}
                                                    />
                                                </>
                                            );
                                        },
                                    },
                                    {
                                        title: <span>{t('sales.product_group')}</span>,
                                        width: 200,
                                        fixed: 'left',
                                        dataIndex: 'productGroup',
                                        ellipsis: true,
                                        className: 'truncate',
                                        render: (_: any, __: any, index: number) => {
                                            const productNameView = get(details, [fields[index].name, 'productGroup']);
                                            return (
                                                <>
                                                    <div className="flex flex-col gap-1">
                                                        <Text
                                                            className="!inline-block !font-semibold !text-red-600 !text-md whitespace-nowrap truncate"
                                                            title={productNameView}
                                                        >
                                                            {productNameView}
                                                        </Text>
                                                    </div>
                                                </>
                                            );
                                        },
                                    },
                                    {
                                        title: (
                                            <span>
                                                {t('sales.quantity')} <span className="text-red-600">*</span>
                                            </span>
                                        ),
                                        width: 180,
                                        render: (_: any, __: any, index: number) => {
                                            const unit = get(details, [fields[index].name, 'unit']);
                                            const maxQuantity = get(details, [fields[index].name, 'maxQuantity']);
                                            return (
                                                <BaseInputNumber
                                                    {...fields[index]}
                                                    name={[fields[index].name, 'quantity']}
                                                    label=""
                                                    min={0}
                                                    disabled={
                                                        isEdit && (status === LogisticStatusEnum.CANCELED || status === LogisticStatusEnum.COMPLETED)
                                                    }
                                                    max={maxQuantity}
                                                    isNumberFormat
                                                    addonAfter={
                                                        unit ? (
                                                            <span className="inline-block max-w-10" title={unit}>
                                                                {unit}
                                                            </span>
                                                        ) : undefined
                                                    }
                                                    placeholder={t('sales.quantity')}
                                                    formItemProps={{
                                                        required: true,
                                                        rules: [{ required: true, message: t('sales.quantity.required') }],
                                                        className: 'w-full',
                                                    }}
                                                />
                                            );
                                        },
                                    },
                                ];
                                return (
                                    <div className="col-span-2 space-y-4">
                                        <div className="col-span-2 font-bold flex justify-center items-center gap-2">
                                            <div className="min-w-fit">{t('global.products')}</div>
                                            <div className="h-[1px] w-full bg-gray-400 mt-1" />
                                        </div>
                                        <BaseTable
                                            scroll={{ x: 'max-content' }}
                                            bordered
                                            columns={columns}
                                            dataSource={fields}
                                            pagination={false}
                                            rowKey="key"
                                            locale={{
                                                emptyText: (
                                                    <Empty
                                                        className={errors?.length ? 'stroke-red-600' : undefined}
                                                        description={
                                                            errors.length ? (
                                                                <span className="text-red-600">{errors?.[0]}</span>
                                                            ) : (
                                                                t('global.message.empty')
                                                            )
                                                        }
                                                    />
                                                ),
                                            }}
                                        />
                                    </div>
                                );
                            }}
                        </Form.List>
                    </div>
                </div>
                <Row
                    align="middle"
                    gutter={[16, 8]}
                    className="w-full col-span-2 sticky bottom-0 px-2 py-4 left-4 bg-white z-10 border-t border-gray-200"
                >
                    <Col span={12}>
                        <span>
                            {t('sales.total_product')}: <strong>{totalQuantity ? InputHelper.formatNumber(totalQuantity) : 0}</strong>
                        </span>
                    </Col>
                    <Col span={24} className="flex justify-end items-center pt-2 col-span-2 gap-2">
                        {!isEdit && (
                            <BaseCheckbox
                                disabled={isEdit && (status === LogisticStatusEnum.CANCELED || status === LogisticStatusEnum.COMPLETED)}
                                name="isSaveAdd"
                                labelCheckbox={t('global.save_and_add')}
                            />
                        )}
                        <BaseButton
                            label={
                                isEdit && (status === LogisticStatusEnum.CANCELED || status === LogisticStatusEnum.COMPLETED)
                                    ? t('global.back')
                                    : t('global.popup.reject')
                            }
                            onClick={handleClose}
                        />
                        {isEdit && (
                            <BaseButton
                                disabled={status === LogisticStatusEnum.CANCELED || status === LogisticStatusEnum.COMPLETED}
                                onClick={() => setIsConfirm(true)}
                                label={t('global.popup.finish')}
                                type="primary"
                            />
                        )}
                        <BaseButton
                            disabled={isEdit && (status === LogisticStatusEnum.CANCELED || status === LogisticStatusEnum.COMPLETED)}
                            label={t('global.popup.save')}
                            type="primary"
                            htmlType="submit"
                        />
                    </Col>
                </Row>
            </Form>
            <AddNewProductModal ref={addModalRef} />
            <ProductConfig ref={productConfigRef} />
            <BaseModal
                children={<ConfirmStatus status={currentStatus} setStatus={setCurrentStatus} />}
                title={t('logistics.order.confirmation')}
                open={isConfirm}
                onCancel={handleCloseConfirm}
                onOk={handleOk}
            />
        </div>
    );
};

export default AddEditEnterWarehouse;
