import { AppRouters } from '@/constants';
import { COMMON_STATUS } from '@/core/components/Status/RefundTag';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Col, Dropdown, Form, Row, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';

import { InputHelper, formatMoney, isAdmin } from '@/utils/helpers';

const { Text } = Typography;

interface SummaryItemProps {
    label: string;
    value: React.ReactNode;
    unit?: string;
    color?: string;
}

const SummaryItem = ({ label, value, unit, color = 'text-blue-600' }: SummaryItemProps) => {
    return (
        <div className="flex flex-col">
            <Text className="text-sm text-gray-500 font-medium whitespace-nowrap">{label}</Text>
            <Text className={`text-lg font-bold ${color}`}>
                {value} {unit}
            </Text>
        </div>
    );
};

const AddOrEditFooter = ({ initialStatus }: { initialStatus?: number }) => {
    const { t } = useLocale();
    const navigate = useNavigate();
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};

    const isadminLTBMA = isAdmin(currentUser);

    const products = Form.useWatch('details') || [];
    const form = Form.useFormInstance();
    const refundStatus = Form.useWatch('status', { form, preserve: true });

    const STATUS_CONFIG: Record<number, { label: string; color: 'default' | 'success'; icon: React.ReactNode }> = {
        [COMMON_STATUS.NOT_REFUND]: { label: t('sales.status.not_refund'), color: 'default', icon: <ClockCircleOutlined /> },
        [COMMON_STATUS.REFUNDED]: { label: t('sales.status.refunded'), color: 'success', icon: <CheckCircleOutlined /> },
    };

    const summary = useMemo(() => {
        return products.reduce(
            (acc: any, item: any) => {
                const quantity = item?.quantity || 0;
                const returnQuantity = item?.returnQuantity || 0;
                const importprice = item?.importprice || 0;
                const weight = item?.weight || 1;

                // Tổng đơn mua hàng gốc
                acc.totalQuantity += quantity;
                acc.totalAmount += importprice * quantity * weight;

                // Tổng hoàn trả
                if (returnQuantity > 0) {
                    acc.totalReturnQuantity += returnQuantity;
                    acc.refundTotal += importprice * returnQuantity * weight;
                }

                return acc;
            },
            {
                totalQuantity: 0,
                totalReturnQuantity: 0,
                totalAmount: 0,
                refundTotal: 0,
            },
        );
    }, [products]);

    const { totalQuantity, totalReturnQuantity, totalAmount, refundTotal } = summary;

    const handleExit = () => {
        navigate(AppRouters.PURCHASE_REFUND);
    };

    const isEmpty = products.length === 0;

    return (
        <Row
            gutter={16}
            align="middle"
            className="
                sticky bottom-0 left-0 z-10
                w-full bg-white
                border-t border-gray-200
                px-4 py-3
                shadow-[0_-2px_8px_rgba(0,0,0,0.05)]
            "
        >
            <Col span={4}>
                <SummaryItem
                    label={t('purchase_refund.total_product.invoice')}
                    value={InputHelper.formatNumber(totalQuantity)}
                    unit={t('dashboard.overview.total_product')}
                />
            </Col>

            <Col span={4}>
                <SummaryItem
                    label={t('purchase_refund.total_price.purchase')}
                    value={isadminLTBMA ? formatMoney(totalAmount) : '***'}
                    color="text-blue-600"
                />
            </Col>

            <Col span={4}>
                <SummaryItem
                    label={t('purchase_refund.total_product.refund')}
                    value={InputHelper.formatNumber(totalReturnQuantity)}
                    unit={t('dashboard.overview.total_product')}
                    color="text-red-600"
                />
            </Col>

            <Col span={4}>
                <SummaryItem label={t('purchase_refund.total_refund')} value={isadminLTBMA ? formatMoney(refundTotal) : '***'} color="text-red-600" />
            </Col>

            <Col span={8} className="flex justify-end items-end gap-2">
                <div className="flex items-center gap-1 mr-2">
                    <Text className="text-base">{t('global.status')}:</Text>
                    <Form.Item name="status" className="mb-0">
                        <Dropdown
                            trigger={['click']}
                            disabled={initialStatus === COMMON_STATUS.REFUNDED}
                            menu={{
                                items: Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({
                                    key: value,
                                    label: (
                                        <div className="flex items-center gap-2">
                                            <span>{cfg.icon}</span>
                                            <span>{cfg.label}</span>
                                        </div>
                                    ),
                                })),
                                onClick: ({ key }) => form.setFieldValue('status', Number(key)),
                            }}
                        >
                            <Tag
                                className="cursor-pointer px-3 py-1 text-sm flex items-center gap-2 min-w-[160px] justify-center hover:!border-colorPrimary transition-colors"
                                color={STATUS_CONFIG[refundStatus]?.color}
                            >
                                {STATUS_CONFIG[refundStatus]?.icon}
                                {STATUS_CONFIG[refundStatus]?.label}
                            </Tag>
                        </Dropdown>
                    </Form.Item>
                </div>

                <BaseButton label={t('global.popup.reject')} disabled={false} onClick={handleExit} />
                <BaseButton
                    label={t('global.popup.save')}
                    type="primary"
                    htmlType="submit"
                    disabled={isEmpty || initialStatus === COMMON_STATUS.REFUNDED}
                />
            </Col>
        </Row>
    );
};

export default AddOrEditFooter;
