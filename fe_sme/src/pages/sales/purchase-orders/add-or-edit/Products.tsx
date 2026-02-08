import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Empty, Form, Popconfirm, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { get } from 'lodash';
import React from 'react';

import BaseButton from '@/components/button';
import BaseTable from '@/components/table';
import { notify } from '@/components/toast-message';

import { formatMoney, formatNumber, isAdmin } from '@/utils/helpers';

import { ProductDetail } from '@/interface/sales';

import AddNewProductModal, { AddNewProductModalRef, DataItem } from '../../components/AddNewProductModal';
import AdvancedProductConfig, { AdvancedProductConfigRef } from '../../components/AdvancedProductConfig';
import { Helper } from '../../utils';

const { Text } = Typography;

const ROOT_FIELD = 'details';
const Products = () => {
    const { t } = useLocale();
    const form = Form.useFormInstance();
    const addModalRef = React.useRef<AddNewProductModalRef>(null);
    const advancedProductConfigRef = React.useRef<AdvancedProductConfigRef>(null);
    const watchedDetails = Form.useWatch<ProductDetail[]>(ROOT_FIELD, { form, preserve: true }) || [];
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    // const isadminLTBMA = isAdmin(currentUser);

    const handleAddProduct = ({ listProducts }: { listProducts: DataItem[] }) => {
        const items = form.getFieldValue(ROOT_FIELD) || [];

        const newProducts =
            listProducts?.map((prod, index) => {
                const newProd = Helper.purchaseProductToForm(prod);
                newProd.weightTheoretical = newProd.weightTheoretical || 0;
                if (!newProd.quantity) newProd.quantity = 1;
                if (items[index]?.id) {
                    (newProd as any).id = items[index].id;
                }

                if (prod.lastImportPrice !== undefined) {
                    newProd.importprice = prod.lastImportPrice;
                } else if (prod.sellingPrice !== undefined) {
                    newProd.importprice = prod.sellingPrice;
                }

                if (prod._isPromotional) {
                    newProd._isPromotional = true;
                    if (prod._promotionalPrice !== undefined) {
                        newProd.importprice = prod._promotionalPrice;
                    }
                }

                return newProd;
            }) ?? [];

        form.setFieldsValue({ details: newProducts });
    };

    const handleOpenModal = async () => {
        try {
            const list = form.getFieldValue('details') || [];

            const defaultSelected = list.map((item: any) => {
                const product = Helper.purchaseFormToProduct(item);
                if (item.importprice !== undefined) {
                    product.lastImportPrice = item.importprice;
                }
                if (item._isPromotional) {
                    return {
                        ...product,
                        _isPromotional: true,
                        _promotionalPrice: item.importprice,
                    };
                }
                return product;
            });

            const { data } = (await addModalRef.current?.open(defaultSelected)) ?? {};
            if (!data) {
                throw new Error('No data');
            }

            handleAddProduct({ listProducts: data });
        } catch (error: any) {
            if (error?.code === -1) return;
            notify.error(t('global.message.error'));
        }
    };

    return (
        <Form.List
            name={ROOT_FIELD}
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
                        fixed: 'left',
                        render: (_: any, __: any, index: number) => index + 1,
                        onCell: () => ({ width: 75 }),
                        onHeaderCell: () => ({ width: 75, minWidth: 75 }),
                    },
                    {
                        title: <span>{t('sales.product_name')}</span>,
                        onCell: () => ({ style: { width: 300 } }),
                        onHeaderCell: () => ({ width: 300, minWidth: 300 }),
                        fixed: 'left',
                        ellipsis: true,
                        className: 'truncate',
                        render: (_, __, index) => {
                            const productName = get(watchedDetails, [fields[index].name, 'productName']);

                            return (
                                <Text className="!inline-block !font-semibold !text-md whitespace-nowrap truncate" title={productName}>
                                    {productName}
                                </Text>
                            );
                        },
                    },
                    {
                        title: (
                            <>
                                {t('sales.quantity')} <span className="text-red-600">*</span>
                            </>
                        ),
                        dataIndex: 'quantity',
                        onCell: () => ({ style: { width: 120, minWidth: 120 } }),
                        onHeaderCell: () => ({ width: 120, minWidth: 120 }),
                        className: 'truncate',
                        render: (_: any, __: any, index: number) => {
                            return (
                                <BaseInputNumber
                                    {...fields[index]}
                                    name={[fields[index].name, 'quantity']}
                                    label=""
                                    min={1}
                                    placeholder={t('sales.quantity')}
                                    formatter={value => formatNumber(value, 0)}
                                    parser={value => value?.replace(/,/g, '') || ''}
                                    formItemProps={{
                                        required: true,
                                        rules: [{ required: true, message: t('global.message.required_field') }],
                                        className: 'w-full',
                                    }}
                                />
                            );
                        },
                    },
                    {
                        title: (
                            <>
                                {t('product.last_import_price')} <span className="text-red-600">*</span>
                            </>
                        ),
                        dataIndex: 'importprice',
                        onCell: () => ({ style: { width: 220 } }),
                        onHeaderCell: () => ({ width: 220, minWidth: 220 }),
                        className: 'truncate',
                        render: (_: any, __: any, index: number) => {
                            return (
                                <BaseInputNumber
                                    {...fields[index]}
                                    name={[fields[index].name, 'importprice']}
                                    label=""
                                    // {...(isadminLTBMA && { min: 0 })}
                                    isMoneyFormat
                                    // isMasked={!isadminLTBMA}
                                    placeholder={t('product.last_import_price')}
                                    formItemProps={{
                                        required: true,
                                        rules: [{ required: true, message: t('global.message.required_field') }],
                                        className: 'w-full',
                                    }}
                                />
                            );
                        },
                    },
                    {
                        title: (
                            <>
                                {t('sales.product_weight_item')} <span className="text-red-600">*</span>
                            </>
                        ),
                        dataIndex: 'weight',
                        onCell: () => ({ style: { width: 180, minWidth: 180 } }),
                        onHeaderCell: () => ({ width: 180, minWidth: 180 }),
                        render: (_: any, __: any, index: number) => {
                            return (
                                <BaseInputNumber
                                    {...fields[index]}
                                    name={[fields[index].name, 'weight']}
                                    label=""
                                    min={0}
                                    placeholder={t('sales.product_weight_item')}
                                    formItemProps={{
                                        required: true,
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
                                        className: 'w-full',
                                    }}
                                />
                            );
                        },
                    },
                    {
                        title: (
                            <>
                                {t('product.add_edit.unit')}
                                <span className="text-red-600">*</span>
                            </>
                        ),
                        dataIndex: 'unit',
                        onCell: () => ({ style: { width: 130 } }),
                        onHeaderCell: () => ({ width: 130, minWidth: 130 }),
                        className: 'truncate',
                        render: (_: any, __: any, index: number) => {
                            return (
                                <BaseInput
                                    {...fields[index]}
                                    name={[fields[index].name, 'unit']}
                                    label=""
                                    placeholder={t('product.add_edit.unit')}
                                    formItemProps={{
                                        required: true,
                                        rules: [{ required: true, message: t('global.message.required_field') }],
                                        className: 'w-full',
                                    }}
                                />
                            );
                        },
                    },
                    {
                        title: t('global.description'),
                        dataIndex: 'description',
                        onCell: () => ({ style: { width: 300 } }),
                        onHeaderCell: () => ({ width: 300, minWidth: 300 }),
                        className: 'truncate',
                        render: (_: any, __: any, index: number) => {
                            return (
                                <BaseTextArea
                                    {...fields[index]}
                                    name={[fields[index].name, 'description']}
                                    label=""
                                    placeholder={t('global.description')}
                                    rows={1}
                                    formItemProps={{
                                        className: 'w-full',
                                    }}
                                />
                            );
                        },
                    },
                    {
                        title: <span>{t('sales.actual_price')}</span>,
                        dataIndex: 'amount',
                        width: 130,
                        align: 'right',
                        fixed: 'right',
                        onCell: () => ({ style: { width: 130 } }),
                        onHeaderCell: () => ({ width: 130, minWidth: 130 }),
                        className: 'truncate',
                        render: (_: any, __: any, index: number) => {
                            const quantity = get(watchedDetails, [fields[index].name, 'quantity']) || 1;
                            const importPrice = get(watchedDetails, [fields[index].name, 'importprice']) || 0;
                            const weight = get(watchedDetails, [fields[index].name, 'weight']);
                            // if (!isadminLTBMA) {
                            //     return <Text className="truncate">***</Text>;
                            // }

                            return <Text className="truncate">{formatMoney(importPrice * quantity * weight)}</Text>;
                        },
                    },
                    {
                        dataIndex: 'actions',
                        align: 'center',
                        className: 'text-center',
                        fixed: 'right',
                        onCell: () => ({ width: 80 }),
                        onHeaderCell: () => ({ width: 80, minWidth: 80 }),
                        render: (_: any, __: any, index: number) => (
                            <Popconfirm
                                title={t('user.delete.message')}
                                onConfirm={() => remove(fields[index].name)}
                                okText={t('global.popup.ok')}
                                cancelText={t('global.popup.reject')}
                                placement="left"
                            >
                                <BaseButton icon={<DeleteOutlined />} type="text" danger />
                            </Popconfirm>
                        ),
                    },
                ];
                return (
                    <>
                        <div className="col-span-6 space-y-4">
                            <div className="col-span-6 font-bold flex justify-center items-center gap-2">
                                <div className="min-w-fit">
                                    {t('global.products')} <span className="text-red-600">*</span>
                                </div>
                                <div className="h-[1px] w-full bg-gray-400 mt-1" />
                                <BaseButton icon={<PlusOutlined />} label={t('Add new')} type="primary" onClick={() => handleOpenModal()} />
                            </div>
                            <BaseTable
                                key={'customerContactPersons'}
                                bordered
                                className={`${errors.length ? 'border rounded-lg border-solid !border-red-600' : ''}`}
                                locale={{
                                    emptyText: (
                                        <Empty
                                            className={errors?.length ? 'stroke-red-600' : undefined}
                                            description={
                                                errors.length ? <span className="text-red-600">{errors?.[0]}</span> : t('global.message.empty')
                                            }
                                        />
                                    ),
                                }}
                                columns={columns}
                                dataSource={fields}
                                pagination={false}
                                rowKey="key"
                            />
                        </div>
                        <AddNewProductModal ref={addModalRef} showInventory={false} showPromotionalTab={false} showLastImportPrice={true} />
                        <AdvancedProductConfig ref={advancedProductConfigRef} />
                    </>
                );
            }}
        </Form.List>
    );
};

export default Products;
