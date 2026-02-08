import { apiDeleteProduct, apiSearchProductType, apiSearchProducts, apiSearchProductsGroup, apiUpdateQuantityProduct } from '@/api/category.api';
import { AppRouters, DefaultMappingPermission, DefaultRoles, DefaultTenantCode, ENV_CONFIG } from '@/constants';
import ExportModal, { ExportModalRef } from '@/core/components/FileManager/ExportModal';
import ImportModal, { ImportModalRef } from '@/core/components/FileManager/ImportModal';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseModal from '@/core/components/Modal/BaseModal';
import BaseSelect from '@/core/components/Select/BaseSelect';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import { PRODUCT_STATUS } from '@/core/components/Status/ProductTag';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { DeleteOutlined, FileAddOutlined } from '@ant-design/icons';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Form, Select, Tooltip, Typography } from 'antd';
import Popconfirm from 'antd/es/popconfirm';
import { debounce, isEmpty } from 'lodash';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';
import Search from '@/components/search';
import ProductTable, { MyTableProps } from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatMoney, formatNumber, handleCommonError, isAdmin, parseAttributes } from '@/utils/helpers';

import { PageFilter } from '@/interface/common';

const { Column } = ProductTable;
const { Text } = Typography;
export interface ColumnType {
    id: string;
    name: string;
    code: string;
    description: string;
    price: number;
    costPrice: number;
    quantityInStock: number;
    unit: string;
    image: string | null;
    attributeJson: string;
    lastImportPrice: number;
    status: number;
    productType: {
        productGroupId: string;
        productGroupCode: string;
        productGroupName: string;
        id: string;
        name: string;
        code: string;
        attributeJson: string;
        created: string;
        lastModified: string | null;
    };
    created: string;
    lastModified: string | null;
}

interface CategoryType {
    id: string;
    code: string;
    name: string;
}

interface ProductCategoryProps<T extends Object = any> {
    tableProps?: Omit<MyTableProps<T>, 'rowKey' | 'dataSource' | 'pagination'>;
    editable?: boolean;
    onRefetchData?: (newData: T) => void;
    filterActiveOnly?: boolean;
    showLastImportPrice?: boolean;
}

const ProductCategory = ({
    editable = true,
    tableProps,
    onRefetchData,
    filterActiveOnly = false,
    showLastImportPrice = false,
}: ProductCategoryProps) => {
    const [filter, setFilter] = useState<PageFilter>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
        filters: [{ key: 'status', value: [PRODUCT_STATUS.ACTIVE] }],
    });
    const [quantityData, setQuantityData] = useState<{ id: string; quantityInStock: number; price: number } | null>(null);
    const importRef = useRef<ImportModalRef>(null);
    const exportRef = useRef<ExportModalRef>(null);

    const [form] = Form.useForm();
    const productGroupIds = Form.useWatch('productGroupIds', form);
    const productTypeIds = Form.useWatch('productTypeIds', form);
    const searchType = Form.useWatch('searchType', form);
    const navigate = useNavigate();
    const { t } = useLocale();
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.PRODUCT_MANAGEMENT]);
    const onSearchType = useMemo(() => debounce((val: string) => form.setFieldValue('searchType', val), 500), []);
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    // const isadminLTBMA = isAdmin(currentUser);

    const { data, refetch, isFetching } = useQuery({
        queryKey: ['getListProduct', filter, productTypeIds, filterActiveOnly],
        queryFn: async () => {
            const res = await apiSearchProducts(
                {
                    ...filter,
                    filters: [
                        ...(productTypeIds?.length > 0 ? [{ key: 'productTypeId', value: productTypeIds }] : []),
                        ...(filterActiveOnly ? [{ key: 'status', value: [PRODUCT_STATUS.ACTIVE] }] : filter.filters || []),
                    ],
                },
                { loading: false },
            );
            if (res?.data) {
                onRefetchData?.(res.data);
            }
            return res;
        },
    });
    const { data: dataType } = useQuery({
        queryKey: ['getListProductTypeChooseProduct', productGroupIds, searchType],
        queryFn: async () => {
            const res = await apiSearchProductType(
                {
                    pageNumber: 1,
                    pageSize: 20,
                    search: searchType,
                    filters: [
                        {
                            key: 'productGroupId',
                            value: productGroupIds,
                        },
                    ],
                },
                { loading: false },
            );
            return res?.data?.map((item: { id: string; name: string }) => ({
                value: item?.id,
                label: item?.name,
            }));
        },
        enabled: !!productGroupIds,
    });

    const handleDelete = async (id: string) => {
        try {
            const res = await apiDeleteProduct(id);
            refetch();
            if (res.succeeded) notify.success(t('message.delete_success'));
            else handleCommonError(res, t, t('message.delete_failed'));
        } catch (error) {
            handleCommonError(error, t, t('message.delete_failed'));
        }
    };

    // const handleExport = async () => {
    //     try {
    //         const response = await exportRef.current?.open();
    //         FileHelper.downloadFileFromResponse(response as any);
    //         notify.success(t('global.message.export_success'));
    //     } catch {
    //         notify.error(t('global.message.export_failed'));
    //     }
    // };
    const handleImport = async () => {
        await importRef.current?.open();
    };
    const handleClose = () => {
        setQuantityData(null);
    };

    const handleUpdateQuantity = async (data: any) => {
        const res = await apiUpdateQuantityProduct({ id: quantityData?.id, quantity: data?.quantity, costPrice: data?.costPrice });
        if (res.succeeded) {
            notify.success(t('message.update_success'));
            setQuantityData(null);
            refetch();
        } else notify.error(t('message.failed'));
    };

    const statusOptions = [
        { label: t('product.in_bussiness'), value: PRODUCT_STATUS.ACTIVE },
        { label: t('product.discontinued'), value: PRODUCT_STATUS.INACTIVE },
    ];

    const handleStatusChange = (values: number[]) => {
        setFilter(prev => ({
            ...prev,
            pageNumber: 1,
            filters: values.length ? [{ key: 'status', value: values }] : undefined,
        }));
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between mb-2 mx-2 gap-2">
                <div className="flex gap-2 grow">
                    {editable && (
                        <>
                            <BaseButton
                                className="mb-2"
                                onClick={() => navigate(AppRouters.PRODUCT_MANAGEMENT_ADD)}
                                icon={<FileAddOutlined />}
                                label="Add new"
                                disabled={!isFullPermission}
                            />
                            <BaseButton
                                onClick={handleImport}
                                label={t('global.upload')}
                                icon={<FontAwesomeIcon icon={faUpload} />}
                                disabled={!isFullPermission}
                            />
                            {/*  <BaseButton onClick={handleExport} label={t('global.download')} icon={<FontAwesomeIcon icon={faDownload} />} /> */}
                        </>
                    )}
                </div>
                <Form form={form} clearOnDestroy className="flex justify-end gap-2 w-2/3">
                    {editable && (
                        <InfiniteScrollSelect
                            name="productGroupIds"
                            queryKey={['getListProductGroupChooseProductv2']}
                            placeholder={t('Select product group')}
                            onChange={() =>
                                form.setFieldsValue({
                                    productTypeIds: [],
                                    searchType: '',
                                })
                            }
                            mode="multiple"
                            formItemProps={{ className: 'w-full' }}
                            maxTagCount="responsive"
                            showSearch
                            allowClear
                            fetchData={async ({ pageNumber, pageSize, search }) => {
                                const resp = await apiSearchProductsGroup({ pageNumber, pageSize, search }, { loading: false });
                                return resp.data;
                            }}
                        />
                    )}
                    {editable && (
                        <BaseSelect
                            name="productTypeIds"
                            onSearch={onSearchType}
                            onChange={() => setFilter({ ...filter, pageNumber: 1 })}
                            disabled={isEmpty(productGroupIds)}
                            placeholder={t('Select product type')}
                            maxTagCount="responsive"
                            mode="multiple"
                            allowClear
                            options={dataType || []}
                            formItemProps={{ className: 'w-full' }}
                            optionFilterProp="label"
                        />
                    )}
                    {editable && (
                        <Select
                            mode="multiple"
                            className="w-full !mb-2"
                            placeholder={t('sales.invoice_status')}
                            value={(filter.filters?.find(f => f.key === 'status')?.value as number[]) || []}
                            onChange={handleStatusChange}
                            options={statusOptions}
                            allowClear
                            showSearch={false}
                            maxTagCount="responsive"
                        />
                    )}
                    <Search
                        placeholder={t('global.search_table')}
                        allowClear
                        className="btn-search-table"
                        onSearch={value => {
                            setFilter({ ...filter, pageNumber: 1, search: value });
                        }}
                    />
                </Form>
            </div>

            <ProductTable<ColumnType>
                dataSource={data?.data || []}
                rowKey={record => record.id}
                bordered={!editable}
                loading={isFetching}
                pagination={{
                    current: filter.pageNumber,
                    pageSize: filter.pageSize,
                    total: data?.totalItems,
                    onChange: (page, pageSize) => {
                        setFilter({ ...filter, pageNumber: page, pageSize });
                    },
                }}
                {...tableProps}
            >
                <Column
                    title={<div className="flex justify-center items-center">{t('category.list.index')}</div>}
                    dataIndex="index"
                    width={40}
                    key="index"
                    fixed="left"
                    onCell={() => ({ width: 40 })}
                    onHeaderCell={() => ({ style: { width: 40 } })}
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('product.add_edit.code')}
                    dataIndex="code"
                    ellipsis
                    width={120}
                    key="code"
                    fixed="left"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span className="cursor-pointer" onClick={() => navigate(`${AppRouters.PRODUCT_MANAGEMENT}/${record.id}`)}>
                                    {record.code}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    ellipsis
                    title={t('product.add_edit.name')}
                    dataIndex="name"
                    key="name"
                    fixed="left"
                    width={300}
                    onCell={() => ({ width: 300 })}
                    onHeaderCell={() => ({ style: { width: 300, maxWidth: 350 } })}
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="flex flex-col gap-1 max-w-[350px]">
                                <Text className="inline-block !text-base whitespace-nowrap truncate max-w-full" title={record.name}>
                                    {record.name}
                                </Text>
                            </div>
                        );
                    }}
                />
                <Column title={t('supplier.add_edit.name')} ellipsis width={160} dataIndex="supplierName" key="supplierName" />

                <Column
                    title={t('Thuộc tính')}
                    dataIndex="status"
                    key="status"
                    ellipsis
                    width={250}
                    align="center"
                    render={(_, record: ColumnType) => (
                        <div className="flex flex-col gap-1">
                            {parseAttributes(record.attributeJson)?.map(item => (
                                <div className="flex gap-1">
                                    <strong>{item.attributeName}:</strong>
                                    <span title={item.attributeValue} className="max-w-96 truncate">
                                        {item.attributeValue}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                />
                <Column
                    ellipsis
                    width={120}
                    title={t('logistics.inventory')}
                    dataIndex="quantityInStock"
                    key="quantityInStock"
                    fixed="right"
                    align="right"
                    render={(_, record: ColumnType) => {
                        const quantity = record?.quantityInStock ?? 0;
                        const isZeroOrNegative = quantity <= 0;

                        return <span className={`font-medium ${isZeroOrNegative ? 'text-red-500' : 'text-blue-500'}`}>{formatNumber(quantity)}</span>;
                    }}
                />
                {!showLastImportPrice && (
                    <Column
                        width={80}
                        title={t('sales.sale_price')}
                        align="right"
                        ellipsis
                        key="price"
                        render={(_, record: ColumnType) => formatMoney(record?.price)}
                    />
                )}
                {showLastImportPrice && (
                    <Column
                        width={120}
                        title={t('product.last_import_price')}
                        align="right"
                        ellipsis
                        key="lastImportPrice"
                        render={(_, record: ColumnType) => formatMoney(record?.lastImportPrice || 0)}
                    />
                )}
                {editable && (
                    <Column
                        width={120}
                        title={t('product.last_import_price')}
                        align="right"
                        ellipsis
                        key="lastImportPrice"
                        render={(_, record: ColumnType) => formatMoney(record?.lastImportPrice || 0)}
                    />
                )}
                {editable && (
                    <Column
                        fixed="right"
                        align="center"
                        width={80}
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
                )}
            </ProductTable>
            {editable && (
                <ImportModal
                    ref={importRef}
                    mode="product"
                    templateType="Products"
                    fullUrl={`${ENV_CONFIG.API}/${ENV_CONFIG.API_VERSION}/Product/import`}
                    title={t('product.import')}
                    onUploadSuccess={() => refetch()}
                />
            )}
            {editable && <ExportModal ref={exportRef} submitLabel={t('global.download')} />}
            <BaseModal
                title={t('product.update_quantity')}
                open={!!quantityData}
                onCancel={handleClose}
                centered={true}
                footer={false}
                destroyOnClose
            >
                <Form
                    name="form-customer-partner-type"
                    layout="vertical"
                    className="w-full grid grid-cols-2 gap-4 mt-4"
                    onFinish={handleUpdateQuantity}
                    autoComplete="off"
                    initialValues={quantityData || {}}
                    onKeyDown={e => {
                        if (e.key === 'Enter') e.preventDefault();
                    }}
                    disabled={!isFullPermission}
                    clearOnDestroy
                >
                    <BaseInputNumber
                        label={t('logistics.inventory')}
                        placeholder={t('logistics.inventory')}
                        name="quantityInStock"
                        isNumberFormat
                        disabled
                        min={0}
                    />
                    <BaseInputNumber
                        label={t('product.capital_price')}
                        isMoneyFormat
                        placeholder={t('product.capital_price')}
                        name="price"
                        disabled
                    />
                    <BaseInputNumber
                        label={t('sales.add_quantity')}
                        placeholder={t('sales.add_quantity')}
                        name="quantity"
                        isNumberFormat
                        min={0}
                        formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }], className: 'col-span-2' }}
                    />
                    <BaseInputNumber
                        label={t('sales.add_price')}
                        placeholder={t('sales.add_price')}
                        name="costPrice"
                        isMoneyFormat
                        min={0}
                        formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }], className: 'col-span-2' }}
                    />
                    <Form.Item className="col-span-2 flex justify-end items-center !mb-0 mt-4">
                        <BaseButton label={t('global.popup.reject')} onClick={handleClose} className="mr-2" disabled={false} />
                        <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" />
                    </Form.Item>
                </Form>
            </BaseModal>
        </div>
    );
};

export default ProductCategory;
