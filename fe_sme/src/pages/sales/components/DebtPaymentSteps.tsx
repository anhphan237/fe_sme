import { useLocale } from '@/i18n';
import { Steps } from 'antd';
import clsx from 'clsx';

import { formatDateTime } from '@/utils/format-datetime';
import { formatMoney } from '@/utils/helpers';

interface IDebtTransactionDisplay {
    id?: string;
    amount: number;
    createdByName?: string;
    personInCharge?: string;

    transactionDate: string;
    paymentMethodName?: string;
    description?: string;
    paymentType?: string;
    remainingAmountAfterPayment?: number | null;
    returnReason?: string;
}

interface DebtPaymentStepsProps {
    transactions: IDebtTransactionDisplay[];
    debtInfo: {
        totalAmount: number;
        paidAmount: number;
        remainingAmount: number;
    };
    createdDate?: string;
    type?: 'purchase' | 'sale';
}

const DebtPaymentSteps = ({ transactions = [], debtInfo, createdDate, type = 'sale' }: DebtPaymentStepsProps) => {
    const { t } = useLocale();

    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

    // const calculatedPaidAmount = sortedTransactions.reduce((sum, t) => sum + t.amount, 0);
    // const calculatedRemainingAmount = debtInfo.totalAmount - calculatedPaidAmount;

    // const actualPaidAmount = sortedTransactions.length > 0 ? calculatedPaidAmount : debtInfo.paidAmount || 0;
    // const actualRemainingAmount = sortedTransactions.length > 0 ? calculatedRemainingAmount : (debtInfo.remainingAmount ?? debtInfo.totalAmount);

    const actualRemainingAmount =
        debtInfo.remainingAmount === 0 && debtInfo.paidAmount === 0 ? debtInfo.totalAmount : (debtInfo.remainingAmount ?? 0);

    const actualPaidAmount = debtInfo.paidAmount || 0;

    // const calculateRemainingAfterTransaction = (index: number) => {
    //     const paidUpToIndex = sortedTransactions.slice(0, index + 1).reduce((sum, t) => sum + t.amount, 0);
    //     return debtInfo.totalAmount - paidUpToIndex;
    // };

    const isFullyPaid = actualRemainingAmount <= 0 && actualPaidAmount > 0;

    const steps = [
        {
            title: t('finance_accounting.debt_created'),
            status: 'finish' as const,
            description: (
                <div>
                    <p>
                        {t('finance_accounting.debt_created_at', {
                            date: <strong>{createdDate ? formatDateTime(createdDate) : '-'}</strong>,
                        })}
                    </p>
                    <p>
                        {t('finance_accounting.total_debt')}: <strong className="text-red-600">{formatMoney(debtInfo.totalAmount)}</strong>
                    </p>
                </div>
            ),
        },
        ...sortedTransactions.map((transaction, index) => {
            const isReturnTransaction =
                (type === 'purchase' && transaction.paymentType === 'Trả hàng mua') ||
                (type === 'sale' && transaction.paymentType === 'Đơn hàng trả');

            return {
                title: (
                    <span
                        className={clsx('font-bold', {
                            'text-green-600': transaction.amount > 0,
                            'text-red-600': transaction.amount < 0,
                        })}
                    >
                        {t('finance_accounting.payment')} {index + 1}: {formatMoney(transaction.amount)}
                    </span>
                ),
                status: 'finish' as const,
                description: (
                    <div className="space-y-2">
                        {transaction.paymentType && (
                            <div>
                                <span className="font-medium">{t('finance_accounting.payment_type')}: </span>
                                <strong>{transaction.paymentType}</strong>
                            </div>
                        )}
                        <div>
                            <span className="font-medium">{t('supplier.person_in_charge')}: </span>
                            <strong>{transaction.createdByName || transaction.personInCharge}</strong>{' '}
                        </div>
                        <div>
                            <span className="font-medium">{t('history.payment_date')}: </span>
                            <strong>{formatDateTime(transaction.transactionDate)}</strong>
                        </div>
                        {!isReturnTransaction && transaction.paymentMethodName && (
                            <div>
                                <span className="font-medium">{t('finance_accounting.transaction_type')}: </span>
                                <strong>{transaction.paymentMethodName}</strong>
                            </div>
                        )}
                        {isReturnTransaction && transaction.returnReason && (
                            <div>
                                <span className="font-medium">{t('finance_accounting.reason_return')}: </span>
                                <strong>{transaction.returnReason}</strong>
                            </div>
                        )}
                        {!isReturnTransaction && transaction.description && (
                            <div>
                                <span className="font-medium">{t('finance_accounting.content')}: </span>
                                <strong>{transaction.description}</strong>
                            </div>
                        )}
                        {!isReturnTransaction &&
                            transaction.remainingAmountAfterPayment !== null &&
                            transaction.remainingAmountAfterPayment !== undefined && (
                                <div>
                                    <span className="font-medium">{t('finance_accounting.remaining')}: </span>
                                    <strong
                                        className={clsx({
                                            'text-green-600': (transaction.remainingAmountAfterPayment ?? 0) <= 0,
                                            'text-red-600': (transaction.remainingAmountAfterPayment ?? 0) > 0,
                                        })}
                                    >
                                        {formatMoney(transaction.remainingAmountAfterPayment ?? 0)}
                                    </strong>
                                </div>
                            )}
                    </div>
                ),
            };
        }),
        {
            title: isFullyPaid ? t('finance_accounting.payment_completed') : t('finance_accounting.awaiting_payment'),
            status: isFullyPaid ? ('finish' as const) : ('wait' as const),
            description: isFullyPaid ? (
                <div>
                    <p className="text-green-600 font-bold">{t('finance_accounting.debt_fully_paid')}</p>
                    <p>
                        {t('finance_accounting.total_paid')}: <strong className="text-green-600">{formatMoney(actualPaidAmount)}</strong>
                    </p>
                </div>
            ) : (
                <div>
                    <p>
                        {t('finance_accounting.remaining_amount')}: <strong className="text-red-600">{formatMoney(actualRemainingAmount)}</strong>
                    </p>
                    <p>
                        {t('finance_accounting.paid_amount')}: <strong className="text-green-600">{formatMoney(actualPaidAmount)}</strong>
                    </p>
                </div>
            ),
        },
    ];

    return (
        <div className="relative mt-5 px-5 py-4 box-border bg-gray-50 rounded">
            <div className="absolute -top-4 left-1/2 text-lg bg-white px-2 py-1 border border-gray-50 -translate-x-1/2">
                {type === 'purchase' ? t('purchase_invoice.settlement_info') : t('sales.payment_info')}
            </div>
            <Steps direction="vertical" items={steps} />
        </div>
    );
};

export default DebtPaymentSteps;
