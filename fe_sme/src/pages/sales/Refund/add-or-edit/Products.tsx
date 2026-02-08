import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseInput from '@/core/components/Input/InputWithLabel';
import { useLocale } from '@/i18n';
import { Empty, Form, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { get } from 'lodash';

import BaseTable from '@/components/table';

import { InputHelper, formatMoney, formatNumber } from '@/utils/helpers';

import { RegexValidate } from '@/constants/global';

import { ProductDetail } from '@/interface/sales';

import { sellingPriceByItem } from '../../utils';

const { Text } = Typography;

const ROOT_FIELD = 'details';
const Products = () => {
    const { t } = useLocale();
    const form = Form.useFormInstance();
    const watchedDetails = Form.useWatch<ProductDetail[]>(ROOT_FIELD, { form, preserve: true }) || [];

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
                        width: 50,
                        render: (_: any, __: any, index: number) => index + 1,
                        onCell: () => ({ width: 50 }),
                        onHeaderCell: () => ({ width: 50 }),
                        fixed: 'left',
                    },
                    {
                        title: <span>{t('sales.product_name')}</span>,
                        width: 300,
                        onCell: () => ({ style: { width: 300, maxWidth: 450 } }),
                        onHeaderCell: () => ({ width: 300 }),
                        fixed: 'left',
                        ellipsis: true,
                        className: 'truncate',
                        render: (_, __, index) => {
                            const productName = get(watchedDetails, [fields[index].name, 'productName']);
                            const items = get(watchedDetails, [fields[index].name, 'items']);
                            return (
                                <div>
                                    <Text className="!inline-block !font-semibold !text-md whitespace-nowrap truncate" title={productName}>
                                        {productName}
                                    </Text>
                                    <div className="flex flex-col gap-2 text-xs !font-semibold">
                                        {Array.isArray(items) &&
                                            items?.length > 0 &&
                                            items?.map((item: any) => (
                                                <span>
                                                    {item.width}m * {item.length}m * {item.multiplier}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            );
                        },
                    },
                    {
                        title: <span>{t('sales.quantity')}</span>,
                        dataIndex: 'quantity',
                        width: 130,
                        align: 'right',
                        onCell: () => ({ style: { width: 130, maxWidth: 130 } }),
                        onHeaderCell: () => ({ width: 130 }),
                        className: 'truncate',
                        render: (_: any, __: any, index: number) => {
                            const quantity = get(watchedDetails, [fields[index].name, 'quantity']) || 0;
                            return <Text className="truncate">{InputHelper.formatNumber(quantity)}</Text>;
                        },
                    },
                    {
                        title: (
                            <>
                                {t('sales.return_quantity')} <span className="text-red-500">*</span>
                            </>
                        ),
                        dataIndex: 'returnQuantity',
                        width: 100,
                        align: 'right',
                        onCell: () => ({ style: { width: 100, maxWidth: 100 } }),
                        onHeaderCell: () => ({ width: 100 }),
                        className: 'truncate',
                        render: (_: any, __: any, index: number) => {
                            const quantity = get(watchedDetails, [fields[index].name, 'quantity']) || 0;
                            return (
                                <BaseInputNumber
                                    {...fields[index]}
                                    name={[fields[index].name, 'returnQuantity']}
                                    label=""
                                    min={0}
                                    max={quantity}
                                    placeholder={t('sales.return_quantity')}
                                    formatter={value => formatNumber(value || 0, 0)}
                                    parser={value => value?.replace(RegexValidate.QUANTITY_PARSE_PATTERN, '') || ''}
                                    formItemProps={{
                                        required: true,
                                        rules: [{ required: true, message: t('global.message.required_field') }],
                                        className: 'w-full',
                                        initialValue: 0,
                                    }}
                                />
                            );
                        },
                    },
                    {
                        title: <span>{t('product.add_edit.unit')}</span>,
                        dataIndex: 'unit',
                        width: 150,
                        align: 'right',
                        onCell: () => ({ style: { width: 150, maxWidth: 150 } }),
                        onHeaderCell: () => ({ width: 150 }),
                        className: 'truncate',
                        render: (_: any, __: any, index: number) => {
                            const formValues = form.getFieldValue('details') || [];
                            const unit = get(formValues, [fields[index].name, 'unit']);
                            return <Text className="truncate">{unit}</Text>;
                        },
                    },
                    {
                        title: <span>{t('sales.product_weight_item')}</span>,
                        dataIndex: 'weight',
                        width: 130,
                        align: 'right',
                        onCell: () => ({ style: { width: 130, maxWidth: 130 } }),
                        onHeaderCell: () => ({ width: 130 }),
                        className: 'truncate',
                        render: (_: any, __: any, index: number) => {
                            const formValues = form.getFieldValue('details') || [];
                            const weight = get(formValues, [fields[index].name, 'weight']);
                            return <Text className="truncate">{weight}</Text>;
                        },
                    },
                    {
                        title: <span>{t('sales.unit_price')}</span>,
                        dataIndex: 'sellingPrice',
                        width: 120,
                        align: 'right',
                        className: 'truncate',
                        render: (_: any, __: any, index: number) => {
                            return <Text className="truncate">{formatMoney(get(watchedDetails, [fields[index].name, 'sellingPrice']) || 0)}</Text>;
                        },
                    },
                    {
                        title: t('sales.actual_price'),
                        dataIndex: 'amount',
                        width: 130,
                        align: 'right',
                        className: 'truncate',
                        onCell: () => ({ style: { width: 130, maxWidth: 130 } }),
                        onHeaderCell: () => ({ width: 130 }),
                        render: (_: any, __: any, index: number) => {
                            const dataItem = get(watchedDetails, [index]) as any;
                            const returnQuantity = dataItem?.returnQuantity || 0;
                            const price = sellingPriceByItem(
                                {
                                    ...dataItem,
                                    quantity: returnQuantity,
                                },
                                'sale',
                            );
                            return <Text className="truncate font-semibold">{price ? formatMoney(price) : 0}</Text>;
                        },
                    },
                    {
                        title: t('sales.product_status'),
                        dataIndex: 'productStatus',
                        width: 250,
                        align: 'center',
                        fixed: 'right',
                        onCell: () => ({ style: { width: 250, maxWidth: 250 } }),
                        onHeaderCell: () => ({ width: 250 }),
                        className: 'truncate',
                        render: (_: any, __: any, index: number) => {
                            return (
                                <BaseInput
                                    {...fields[index]}
                                    name={[fields[index].name, 'productStatus']}
                                    label=""
                                    maxLength={200}
                                    placeholder={t('sales.product_status')}
                                    formItemProps={{
                                        className: 'w-full',
                                    }}
                                />
                            );
                        },
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
                            </div>
                            <BaseTable
                                scroll={{ x: 'max-content' }}
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
                    </>
                );
            }}
        </Form.List>
    );
};

export default Products;
