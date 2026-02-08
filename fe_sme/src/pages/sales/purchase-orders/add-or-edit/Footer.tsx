import { AppRouters } from '@/constants';
import BaseCheckbox from '@/core/components/Checkbox';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Dropdown, Form, Row, Tag, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import BaseButton from '@/components/button';

import { InputHelper, formatMoney, isAdmin } from '@/utils/helpers';

import { PURCHASE_STATUS } from '@/constants/sales/purchase';

import { Helper } from '../../utils';

const { Text } = Typography;
const AddOrEditFooter = ({ isSubmitting, initialStatus }: { isSubmitting?: boolean; initialStatus?: number }) => {
    const { t } = useLocale();
    const { id } = useParams<{ id?: string }>();
    const form = Form.useFormInstance();
    const navigate = useNavigate();

    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    const isAddNew = !id || id === 'add';
    const products = Form.useWatch('details', { form, preserve: true }) || [];
    const deliveryFee = Form.useWatch('deliveryFee', { form, preserve: true }) || 0;
    const quotationStatus = Form.useWatch('status', { form, preserve: true });
    const discount = Form.useWatch('discountAmount', { form, preserve: true }) || 0;
    const previousDebt = Form.useWatch('previousDebt', { form, preserve: true }) || 0;
    const { totalAmount, totalQuantity } = Helper.sumUp(products, previousDebt);

    const totalPrice = totalAmount + deliveryFee - discount;

    // const isadminLTBMA = isAdmin(currentUser);

    const handleExit = () => {
        navigate(AppRouters.PURCHASE_ORDERS);
    };

    const STATUS_CONFIG: Record<number, { label: string; color: 'default' | 'success' | 'error'; icon: React.ReactNode }> = {
        [PURCHASE_STATUS.DRAFT]: { label: t('global.status.draft'), color: 'default', icon: <ClockCircleOutlined /> },
        [PURCHASE_STATUS.DONE]: { label: t('global.status.done'), color: 'success', icon: <CheckCircleOutlined /> },
        [PURCHASE_STATUS.CANCELLED]: { label: t('global.status.cancelled'), color: 'error', icon: <CloseCircleOutlined /> },
    };

    return (
        <Row align="middle" justify="space-between" className="w-full sticky bottom-0 px-4 py-3 bg-white border-t border-gray-200 z-10">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <Text className="text-lg ">{t('sales.total_product')}:</Text>
                    <Text className="font-semibold text-lg">{InputHelper.formatNumber(totalQuantity || 0)}</Text>
                </div>
                <div className="flex items-center gap-2">
                    <Text className="text-lg ">{t('sales.total_price')}:</Text>
                    <Text className="font-semibold text-lg">{formatMoney(totalPrice)}</Text>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                    <Text className="text-base ">{t('global.status')}:</Text>
                    <Form.Item name="status" className="mb-0">
                        <Dropdown
                            disabled={isSubmitting || initialStatus === PURCHASE_STATUS.DONE || initialStatus === PURCHASE_STATUS.CANCELLED}
                            trigger={['click']}
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
                                className="cursor-pointer px-3 py-1 text-sm flex items-center gap-2 min-w-[130px] justify-center  hover:!border-colorPrimary transition-colors"
                                color={STATUS_CONFIG[quotationStatus]?.color}
                            >
                                {STATUS_CONFIG[quotationStatus]?.icon}
                                {STATUS_CONFIG[quotationStatus]?.label}
                            </Tag>
                        </Dropdown>
                    </Form.Item>
                </div>

                {isAddNew && <BaseCheckbox name="_continueToAdd" labelCheckbox={t('global.save_and_add')} />}

                <BaseButton label={t('global.popup.reject')} disabled={false} onClick={handleExit} />

                <BaseButton
                    label={t('global.popup.save')}
                    type="primary"
                    htmlType="submit"
                    disabled={isSubmitting || initialStatus === PURCHASE_STATUS.DONE || initialStatus === PURCHASE_STATUS.CANCELLED}
                    loading={isSubmitting}
                />
            </div>
        </Row>
    );
};

export default AddOrEditFooter;
