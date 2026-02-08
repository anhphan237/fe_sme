import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { Empty, Form, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { get } from 'lodash';

import BaseTable from '@/components/table';

import { InputHelper, formatMoney, isAdmin } from '@/utils/helpers';

import { ProductDetail } from '@/interface/sales';

const { Text } = Typography;

const ROOT_FIELD = 'details';
const Products = () => {
    const { t } = useLocale();
    const form = Form.useFormInstance();
    const watchedDetails = Form.useWatch<ProductDetail[]>(ROOT_FIELD, { form, preserve: true }) || [];
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};

    // const isadminLTBMA = isAdmin(currentUser);

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
                            return (
                                <Text className="!inline-block !font-semibold !text-md whitespace-nowrap truncate" title={productName}>
                                    {productName}
                                </Text>
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
                        title: <span>{t('product.add_edit.unit')}</span>,
                        dataIndex: 'unit',
                        width: 130,
                        align: 'right',
                        onCell: () => ({ style: { width: 130, maxWidth: 130 } }),
                        onHeaderCell: () => ({ width: 130 }),
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
                        title: <span>{t('purchase_invoice.import_price')}</span>,
                        dataIndex: 'importprice',
                        width: 120,
                        align: 'right',
                        className: 'truncate',
                        render: (_: any, __: any, index: number) => {
                            return <Text className="truncate">{formatMoney(get(watchedDetails, [fields[index].name, 'importprice']) || 0)}</Text>;
                        },
                    },
                    {
                        title: t('sales.actual_price'),
                        width: 200,
                        align: 'right',
                        render: (_: any, __: any, index: number) => {
                            const dataItem = get(watchedDetails, [fields[index].name]);
                            const price = (dataItem?.importprice || 0) * (dataItem?.quantity || 0) * (dataItem?.weight || 1);
                            return price ? formatMoney(price) : '-';
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
