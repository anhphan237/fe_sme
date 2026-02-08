import { apiAddProduct, apiGetProduct, apiSearchProductType, apiSearchProductsGroup, apiUpdateProduct } from '@/api/category.api';
import { apiSearchSupplierInfo } from '@/api/supplier.api';
import { APP_CONFIG, AppRouters, DefaultMappingPermission, DefaultRoles, ENV_CONFIG } from '@/constants';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseSelect from '@/core/components/Select/BaseSelect';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Checkbox, Table, Tabs, Tooltip, Upload } from 'antd';
import Form from 'antd/es/form';
import { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import BaseButton from '@/components/button';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { convertAttributes, parseAttributes } from '@/utils/helpers';

import type { IAddEditProduct, ICategoryData } from '@/interface/category';
import { UserCustomer } from '@/interface/sales';

import ProductHistoryTable from './ProductHistoryTable';
import './index.less';

const AddEditProduct = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const isEdit = !!id;
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [form] = Form.useForm();
    const productGroupId = Form.useWatch('productGroupId', form);
    const dispatch = useDispatch();
    const { t } = useLocale();
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};

    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.PRODUCT_MANAGEMENT]);
    const isAdmin = currentUser?.roles?.some(role => role.code === DefaultRoles.ADMIN || role.code === DefaultRoles.SUPER_ADMIN) ?? false;

    const { data: formData } = useQuery({
        queryKey: ['getDetailCustomerInfo', id],
        queryFn: async () => {
            const res = await apiGetProduct(id!);
            if (res?.data) {
                const tempData = res?.data;
                const initData = {
                    ...tempData,
                    productGroupId: tempData.productType?.productGroupId,
                    productGroupName: tempData.productType?.productGroupName,
                    productTypeName: tempData.productType?.name,
                    productTypeId: tempData.productType?.id,
                    attributeJson: parseAttributes(tempData?.attributeJson),
                };
                form.setFieldsValue(initData);
                initData.image && setFileList([{ url: `${ENV_CONFIG.STORAGE}${initData.image}`, name: initData.code || '', uid: initData.id || '' }]);
            }
            return res?.data;
        },
        enabled: isEdit,
    });

    const { data: dataType } = useQuery({
        queryKey: ['getListProductTypev3', productGroupId],
        queryFn: async () => {
            const res = await apiSearchProductType(
                {
                    pageNumber: 1,
                    pageSize: 20,
                    filters: [
                        {
                            key: 'productGroupId',
                            value: [productGroupId],
                        },
                    ],
                },
                { loading: false },
            );
            return res?.data?.map((item: ICategoryData) => ({
                value: item?.id,
                label: item?.name,
                ...item,
            }));
        },
        enabled: !!productGroupId,
    });

    useEffect(() => {
        if (!id) return;
        dispatch(
            setBreadCrumbs({
                [id]: t('product.edit.popup.header'),
            }),
        );
    }, [id]);

    const onSave = async (data: IAddEditProduct) => {
        const supplierName = form.getFieldValue('supplierName');
        const params = {
            ...data,
            ...(isEdit && { id: formData?.id }),
            productGroupId: undefined,
            supplierName,
            attributeJson: convertAttributes(data?.attributeJson),
        };

        const res = isEdit ? await apiUpdateProduct(params) : await apiAddProduct(params);
        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
            if (data?.isSaveAdd) {
                form.resetFields();
                form.setFieldsValue({
                    productGroupId: data?.productGroupId,
                    productGroupName: data?.productGroupName,
                    productTypeName: data?.productTypeName,
                    productTypeId: data?.productTypeId,
                    isSaveAdd: true,
                });
                setFileList([]);
            } else {
                navigate(AppRouters.PRODUCT_MANAGEMENT);
            }
        } else notify.error(t('message.failed'));
    };

    const handleUploadChange: UploadProps['onChange'] = info => {
        if (info?.file?.status === 'done') {
            const response = info?.file?.response;
            form.setFieldValue('image', response?.data?.filePath);
        }
        if (info?.fileList?.length === 0) form.setFieldValue('image', '');
        setFileList(info?.fileList);
    };

    const getHeaderUploadImages = () => {
        const token = localStorage.getItem(APP_CONFIG.ACCESS_TOKEN);
        return {
            Authorization: `Bearer ${token?.trim()}`,
        };
    };

    return (
        <div className="flex flex-col my-4 mx-6 p-4 bg-white rounded-lg relative">
            <Tabs defaultActiveKey="1" className="h-full">
                <Tabs.TabPane tab={t('product.tags')} key="1">
                    <Form
                        name="form-product-category"
                        className="flex flex-col justify-between gap-4 h-full"
                        layout="vertical"
                        onFinish={onSave}
                        autoComplete="off"
                        form={form}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                                e.preventDefault();
                            }
                        }}
                        preserve
                        disabled={!isFullPermission}
                        clearOnDestroy
                    >
                        <div className="grid grid-cols-2 gap-4 h-[calc(100vh-240px)]  overflow-auto">
                            <div className="grid grid-cols-2 gap-4 h-fit pr-4 border-r">
                                <BaseInput name="code" label={t('product.add_edit.code')} placeholder={t('product.add_edit.code')} />
                                <InfiniteScrollSelect
                                    name="productGroupId"
                                    queryKey={['getListProductGroupv3']}
                                    label={t('Select product group')}
                                    placeholder={t('Select product group')}
                                    labelRender={value => value?.label || form.getFieldValue('productGroupName')}
                                    formItemProps={{
                                        rules: [{ required: true, message: t('global.message.required_field') }],
                                    }}
                                    onChange={() => {
                                        form.setFieldsValue({ productTypeId: undefined, attributeJson: undefined });
                                    }}
                                    showSearch
                                    fetchData={async ({ pageNumber, pageSize, search }) => {
                                        const resp = await apiSearchProductsGroup({ pageNumber, pageSize, search }, { loading: false });
                                        return resp.data;
                                    }}
                                />
                                <BaseSelect
                                    name="productTypeId"
                                    label={t('Select product type')}
                                    labelRender={value => value?.label || form.getFieldValue('productTypeName')}
                                    placeholder={t('Select product type')}
                                    formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                                    options={dataType || []}
                                    allowClear
                                    onChange={(_, record: any) => form.setFieldValue('attributeJson', parseAttributes(record?.attributeJson))}
                                    optionFilterProp="label"
                                />
                                <BaseInput
                                    name="name"
                                    label={t('product.add_edit.name')}
                                    placeholder={t('product.add_edit.name')}
                                    formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                                />
                                <InfiniteScrollSelect
                                    name="supplierId"
                                    queryKey={['getListSupplierInProduct']}
                                    label={t('sales.supplier')}
                                    placeholder={t('sales.supplier')}
                                    labelRender={value => value?.label || form.getFieldValue('supplierName')}
                                    formItemProps={{
                                        rules: [{ required: true, message: t('global.message.required_field') }],
                                    }}
                                    onChange={(_, record: any) => {
                                        form.setFieldValue('supplierName', record?.nameShort ?? record?.name ?? '');
                                    }}
                                    showSearch
                                    fetchData={async ({ pageNumber, pageSize, search }) => {
                                        const resp = await apiSearchSupplierInfo({ pageNumber, pageSize, search }, { loading: false });
                                        return resp.data;
                                    }}
                                    mapData={(data: UserCustomer[]) =>
                                        data.map((item: UserCustomer) => ({
                                            ...item,
                                            label: item.nameShort ?? item.name ?? '',
                                            value: item.id,
                                        }))
                                    }
                                />
                                <Tooltip title={!isAdmin ? t('product.message.allow') : ''}>
                                    <BaseInputNumber
                                        label={t('product.capital_price')}
                                        placeholder={t('product.capital_price')}
                                        isMoneyFormat
                                        // isMasked={!isAdmin}
                                        name="costPrice"
                                        min={0}
                                        formItemProps={{ rules: [{ required: isAdmin, message: t('global.message.required_field') }] }}
                                        // disabled={!isAdmin}
                                    />
                                </Tooltip>
                                <BaseInputNumber
                                    label={t('product.unit_price')}
                                    placeholder={t('product.unit_price')}
                                    isMoneyFormat
                                    name="price"
                                    min={0}
                                    formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                                />
                                <Tooltip title={!isAdmin ? t('product.message.allow') : ''}>
                                    <BaseInputNumber
                                        label={t('product.sale_price')}
                                        placeholder={t('product.sale_price')}
                                        isMoneyFormat
                                        // isMasked={!isAdmin}
                                        name="lastImportPrice"
                                        min={0}
                                        formItemProps={{ rules: [{ required: isAdmin, message: t('global.message.required_field') }] }}
                                        // disabled={!isAdmin}
                                    />
                                </Tooltip>
                                <BaseInput
                                    name="unit"
                                    label={t('sales.product_unit')}
                                    placeholder={t('sales.product_unit')}
                                    formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                                />
                                <BaseInputNumber
                                    label={t('sales.product_weight')}
                                    placeholder={t('sales.product_weight')}
                                    name="weight"
                                    min={0}
                                    formItemProps={{
                                        initialValue: 1,
                                        rules: [
                                            { required: true, message: t('global.message.required_field') },
                                            {
                                                validator: (_, value) => {
                                                    if (value > 0) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error(t('global.message.must_be_greater_than_zero')));
                                                },
                                            },
                                        ],
                                    }}
                                />
                                <BaseInputNumber
                                    label={t('logistics.inventory')}
                                    placeholder={t('logistics.inventory')}
                                    name="quantityInStock"
                                    min={0}
                                    formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                                />
                                <BaseSelect
                                    name="status"
                                    label={t('global.status')}
                                    placeholder={t('global.status')}
                                    formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                                    options={[
                                        { label: t('product.in_bussiness'), value: 1 },
                                        { label: t('product.discontinued'), value: 0 },
                                    ]}
                                    allowClear
                                    optionFilterProp="label"
                                />
                                <BaseTextArea
                                    name="description"
                                    label={t('product.add_edit.description')}
                                    placeholder={t('product.add_edit.description')}
                                    rows={3}
                                    className="py-[6px]"
                                    classNames={{ textarea: 'rounded-lg' }}
                                    formItemProps={{ className: 'col-span-2' }}
                                />
                                <Form.Item label={t('Product image')} name="image" className="h-[100px] col-span-2">
                                    <Upload
                                        headers={getHeaderUploadImages()}
                                        listType="picture-card"
                                        prefixCls="product-image"
                                        action={`${ENV_CONFIG.API}/${ENV_CONFIG.API_VERSION}/File/Products?override=true`}
                                        accept="image/*"
                                        fileList={fileList}
                                        onChange={handleUploadChange}
                                        showUploadList={{
                                            showPreviewIcon: false,
                                        }}
                                    >
                                        {fileList.length > 0 ? null : (
                                            <BaseButton icon={<UploadOutlined />} label={t('product.add_edit.click_to_upload_image')} />
                                        )}
                                    </Upload>
                                </Form.Item>
                            </div>
                            <Form.List name="attributeJson">
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
                                                    {t('product.attribute_name')}
                                                    <span className="text-red-600">*</span>
                                                </span>
                                            ),
                                            dataIndex: 'attributeName',
                                            width: 200,
                                            render: (_: any, __: any, index: number) => (
                                                <BaseInput
                                                    {...fields[index]}
                                                    name={[fields[index].name, 'attributeName']}
                                                    label=""
                                                    placeholder={t('product.attribute_name')}
                                                    formItemProps={{
                                                        className: 'w-full',
                                                        rules: [{ required: true, message: t('global.message.required_field') }],
                                                    }}
                                                />
                                            ),
                                        },
                                        {
                                            title: <span>{t('product.attribute_value')}</span>,
                                            dataIndex: 'attributeValue',
                                            width: 200,
                                            render: (_: any, __: any, index: number) => (
                                                <BaseInput
                                                    {...fields[index]}
                                                    name={[fields[index].name, 'attributeValue']}
                                                    label=""
                                                    placeholder={t('product.attribute_value')}
                                                    formItemProps={{
                                                        className: 'w-full',
                                                    }}
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
                                        <div className="space-y-4">
                                            <div className="col-span-6 font-bold flex justify-center items-center gap-2">
                                                <div className="min-w-fit">{t('product.attribute')}</div>
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
                        </div>

                        <div className="flex justify-end items-center gap-2 ">
                            {!isEdit && (
                                <Form.Item name="isSaveAdd" valuePropName="checked" className="!mb-0 mr-2">
                                    <Checkbox>{t('global.save_and_add')}</Checkbox>
                                </Form.Item>
                            )}
                            <BaseButton label={t('global.popup.reject')} onClick={() => navigate(AppRouters.PRODUCT_MANAGEMENT)} disabled={false} />
                            <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" />
                        </div>
                    </Form>
                </Tabs.TabPane>
                <Tabs.TabPane tab={t('product.tags.history')} key="2" disabled={!isEdit}>
                    {isEdit && id && (
                        <div className="p-3 bg-white rounded-lg h-[calc(100vh-240px)] overflow-auto">
                            <ProductHistoryTable productId={id} />
                        </div>
                    )}
                </Tabs.TabPane>
            </Tabs>
        </div>
    );
};

export default AddEditProduct;
