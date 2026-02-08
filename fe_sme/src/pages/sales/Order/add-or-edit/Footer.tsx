import { apiUpdateQuotationStatus } from '@/api/quotation';
import { AppRouters, ERROR_CODE } from '@/constants';
import BaseCheckbox from '@/core/components/Checkbox';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { Button, Col, Form, Modal, Row, Typography } from 'antd';
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import BaseButton from '@/components/button';
import { notify } from '@/components/toast-message';

import { InputHelper, formatMoney, handleCommonError, isAdmin } from '@/utils/helpers';

import { QUOTATION_TARGET_STATUS } from '@/constants/sales/quotation';

import { Helper } from '../../utils';

const { Text } = Typography;
const AddOrEditFooter = ({
    handleQuickPay,
    handleQuickRefund,
    isSubmitting,
}: {
    refetchDetail?: () => void;
    handleQuickPay?: () => void;
    handleQuickRefund?: () => void;
    isSubmitting?: boolean;
}) => {
    const { t } = useLocale();
    const { id } = useParams<{ id?: string }>();
    const form = Form.useFormInstance();
    const navigate = useNavigate();
    const confirmRef = useRef<any>(null);

    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    const Admin = isAdmin(currentUser);
    const approval = Form.useWatch('approval', { form, preserve: true }) || {};
    const isDraftChecked = Form.useWatch('isDraft', { form, preserve: true });
    const isQuickPayChecked = Form.useWatch('_quickPay', { form, preserve: true });
    const isAddNew = !id || id === 'add';
    const products = Form.useWatch('details', { form, preserve: true }) || [];
    const deliveryFee = Form.useWatch('deliveryFee', { form, preserve: true }) || 0;
    const quotationStatus = Form.useWatch('status', { form, preserve: true });
    const discount = Form.useWatch('discountAmount', { form, preserve: true }) || 0;
    const previousDebt = Form.useWatch('previousDebt', { form, preserve: true }) || 0;
    const { totalAmount, totalQuantity } = Helper.sumUp(products, previousDebt);

    const totalPrice = totalAmount + deliveryFee - discount;

    const handleExit = () => {
        navigate(AppRouters.SALES_ORDER);
    };

    const handleRefundWithConfirm = () => {
        Modal.confirm({
            title: t('global.confirm'),
            content: t('sales.refund.confirm_message'),
            okText: t('global.popup.ok'),
            cancelText: t('global.popup.cancel.text'),
            onOk: () => {
                handleQuickRefund?.();
            },
        });
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
                {/* {currentUser?.tenant?.code === DefaultTenantCode.TDP && (
                    <> */}
                <Col span={4} className="relative">
                    <BaseInputNumber
                        label={t('sales.shipping_fee')}
                        placeholder={t('sales.shipping_fee')}
                        name="deliveryFee"
                        isMoneyFormat
                        min={0}
                        formItemProps={{
                            wrapperCol: { span: 24 },
                        }}
                    />
                </Col>
                <Col span={4}>
                    <BaseInputNumber
                        label={t('sales.discount')}
                        placeholder={t('sales.discount')}
                        name="discountAmount"
                        min={0}
                        isMoneyFormat
                        formItemProps={{
                            wrapperCol: { span: 24 },
                        }}
                    />
                </Col>
                {/* </>
                )} */}

                <Col span={4}>
                    <BaseInputNumber
                        label={t('sales.old_debt')}
                        placeholder={t('sales.old_debt')}
                        name="previousDebt"
                        min={0}
                        isMoneyFormat
                        formItemProps={{
                            wrapperCol: { span: 24 },
                        }}
                    />
                </Col>
                <Col
                    span={12}
                    // span={currentUser?.tenant?.code === DefaultTenantCode.TDP ? 9 : 19}
                    className="flex justify-end items-center pt-2 col-span-5 gap-2"
                >
                    {isAddNew && (
                        <>
                            <BaseCheckbox name="isDraft" labelCheckbox={t('global.draft')} disabled={isQuickPayChecked} />
                            <BaseCheckbox name="_continueToAdd" labelCheckbox={t('global.save_and_add')} className="pl-3" />
                            <BaseCheckbox name="_quickPay" labelCheckbox={t('sales.quick_pay')} className="pl-3" disabled={isDraftChecked} />
                            <BaseButton label={t('global.popup.reject')} disabled={false} onClick={handleExit} />
                            <BaseButton
                                label={t('global.popup.save')}
                                type="primary"
                                htmlType="submit"
                                disabled={isSubmitting}
                                loading={isSubmitting}
                            />
                        </>
                    )}
                    {!isAddNew && (
                        <>
                            {quotationStatus === QUOTATION_TARGET_STATUS.DRAFT && <BaseCheckbox name="isDraft" labelCheckbox={t('global.draft')} />}
                            {[QUOTATION_TARGET_STATUS.REQUEST, QUOTATION_TARGET_STATUS.DRAFT].includes(quotationStatus) && (
                                <BaseButton label={t('global.popup.reject')} disabled={false} onClick={handleExit} />
                            )}
                            {[QUOTATION_TARGET_STATUS.INPROGRESS, QUOTATION_TARGET_STATUS.DONE, QUOTATION_TARGET_STATUS.CANCELLED].includes(
                                quotationStatus,
                            ) && <BaseButton label={t('global.back')} disabled={false} onClick={handleExit} />}

                            {![QUOTATION_TARGET_STATUS.DRAFT, QUOTATION_TARGET_STATUS.CANCELLED].includes(quotationStatus) && (
                                <>
                                    <BaseButton
                                        type="primary"
                                        label={t('finance_accounting.refund')}
                                        onClick={handleRefundWithConfirm}
                                        disabled={false}
                                    />
                                    <BaseButton
                                        type="primary"
                                        label={t('sales.quick_pay')}
                                        disabled={![QUOTATION_TARGET_STATUS.REQUEST, QUOTATION_TARGET_STATUS.INPROGRESS].includes(quotationStatus)}
                                        onClick={handleQuickPay}
                                    />
                                </>
                            )}
                        </>
                    )}
                    {[QUOTATION_TARGET_STATUS.DRAFT, QUOTATION_TARGET_STATUS.REQUEST].includes(quotationStatus) && (
                        <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" disabled={isSubmitting} loading={isSubmitting} />
                    )}
                    {[QUOTATION_TARGET_STATUS.INPROGRESS, QUOTATION_TARGET_STATUS.DONE].includes(quotationStatus) && Admin && (
                        <BaseButton label={t('global.popup.save')} type="primary" htmlType="submit" disabled={isSubmitting} loading={isSubmitting} />
                    )}
                </Col>
            </Row>
        </>
    );
};

export default AddOrEditFooter;
