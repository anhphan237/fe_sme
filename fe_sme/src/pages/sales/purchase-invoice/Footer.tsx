import { AppRouters } from '@/constants';
import { COMMON_STATUS } from '@/core/components/Status/PaymentTag';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { Col, Form, Row, Typography } from 'antd';
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Helper } from '@pages/sales/utils';

import BaseButton from '@/components/button';

import { InputHelper, formatMoney, isAdmin } from '@/utils/helpers';

import QuickPayPurchase from '../components/QuickPayPurchase';

const { Text } = Typography;
const AddOrEditFooter = ({ refetch, refetchDebtTransactions }: { refetch: () => void; refetchDebtTransactions?: () => void }) => {
    const { t } = useLocale();
    const { id } = useParams<{ id: string }>();
    const form = Form.useFormInstance();
    const navigate = useNavigate();
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    const isEdit = !!id && id !== 'add';

    // const isadminLTBMA = isAdmin(currentUser);
    const products = Form.useWatch('details', { form, preserve: true }) || [];
    const supplier = Form.useWatch('supplier', { form, preserve: true }) || [];
    const deliveryFee = Form.useWatch('deliveryFee', { form, preserve: true }) || 0;
    const status = Form.useWatch('status', { form, preserve: true });
    const discount = Form.useWatch('discountAmount', { form, preserve: true }) || 0;
    const previousDebt = Form.useWatch('previousDebt', { form, preserve: true }) || 0;
    const debtDocumentId = Form.useWatch('debtDocumentId', { form, preserve: true });
    const totalAmount = Form.useWatch('totalAmount', { form, preserve: true });
    const totalAmountPaid = Form.useWatch('totalAmountPaid', { form, preserve: true });
    const purchaseDate = Form.useWatch('purchaseDate', { form, preserve: true });
    const personInCharge = Form.useWatch(['personInCharge'], { form, preserve: true });
    const { totalQuantity } = Helper.sumUp(products);
    const quickPayRef = useRef<any>(null);

    const actualMoney =
        products?.reduce((sum: number, item: any) => {
            const price = (item?.importprice || 0) * (item?.quantity || 0) * (item?.weight || 1);
            return sum + price;
        }, 0) || 0;
    const totalPrice = actualMoney + deliveryFee + previousDebt - discount;

    const handleExit = () => {
        navigate(AppRouters.PURCHASE_INVOICE);
    };

    const handleQuickPay = async () => {
        try {
            await quickPayRef?.current?.open({
                debtDocumentId,
                purchaseDate,
                remainingAmount: totalAmount - totalAmountPaid,
                personInCharge: personInCharge,
                isEditMode: isEdit,
            });

            refetchDebtTransactions?.();
            refetch();
        } catch (error) {}
    };

    return (
        <>
            <Row
                align="bottom"
                gutter={[16, 8]}
                className="w-full col-span-6 sticky bottom-0 px-4 py-2 left-0 bg-white z-10 border-t border-gray-200"
            >
                <Col span={12}>
                    <Text className="text-right whitespace-nowrap text-lg font-semibold">{`${t('sales.total_product')}: `}</Text>
                    <Text className={`font-bold text-xl`}>{totalQuantity ? InputHelper.formatNumber(totalQuantity) : 0}</Text>
                </Col>

                <Col span={12} className="text-right">
                    <Text className="text-right whitespace-nowrap text-lg font-semibold">{`${t('sales.total_price')}: `}</Text>
                    <Text className={`font-bold text-xl`}>{formatMoney(totalPrice)}</Text>
                </Col>
                <Col span={24} className="flex justify-end items-center pt-2 col-span-5 gap-2">
                    <BaseButton label={t('global.back')} disabled={false} onClick={handleExit} />
                    <BaseButton
                        type="primary"
                        label={t('purchase_invoice_paid')}
                        disabled={![COMMON_STATUS.PENDING, COMMON_STATUS.PROCESSING].includes(status) || !personInCharge?.userId}
                        onClick={handleQuickPay}
                    />
                </Col>
            </Row>
            <QuickPayPurchase
                ref={quickPayRef}
                data={{
                    supplierName: supplier?.supplierName,
                    address: supplier?.supplierAddress,
                    phone: supplier?.supplierPhone,
                    code: form.getFieldValue('purchaseCode'),
                    details: products,
                    previousDebt: previousDebt,
                    deliveryFee: deliveryFee,
                    discount: discount,
                    total: form.getFieldValue('totalAmount'),
                    purchaseDate: purchaseDate,
                    totalAmountPaid: totalAmountPaid,
                }}
            />
        </>
    );
};

export default AddOrEditFooter;
