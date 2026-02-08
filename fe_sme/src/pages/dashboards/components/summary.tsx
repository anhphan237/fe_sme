import { apiGetDashboardSummary } from '@/api/dashboard.api';
import { useLocale } from '@/i18n';
import { ClockCircleOutlined, CodeSandboxOutlined, CreditCardOutlined, DollarOutlined, FundOutlined } from '@ant-design/icons';
import { Skeleton } from 'antd';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import { formatCurrency } from '@/utils/helpers';

import { ISaleData, ISummarySaleData, SummarySaleData } from '@/interface/dashboard';

type BoxType = 'draft' | 'invoice' | 'return' | 'expense' | 'success' | 'debt';
const Box = (props: {
    title: string | React.ReactNode;
    content: ISaleData;
    type: BoxType;
    isLoading: boolean;
    display: { icon: React.ReactNode; bgColor: string; iconBgColor: string };
}) => {
    const { title, content, type, display, isLoading } = props;
    const { totalAmount = 0, totalItem = 0, totalQuantity = 0, totalSale = 0 } = content ?? {};
    const { t } = useLocale();

    if (isLoading) {
        return (
            <div className={`${display.bgColor} rounded-2xl p-4 shadow-sm`}>
                <div className="flex items-start space-x-4">
                    <Skeleton.Avatar size={56} shape="circle" active />
                    <div className="flex flex-col flex-1 min-w-0">
                        <Skeleton.Input size="small" active className="!w-32 !h-5 mb-2" />
                        <Skeleton.Input size="large" active className="!w-full !h-10" />
                    </div>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (type) {
            case 'draft':
                return (
                    <>
                        <p className="text-6xl font-semibold">
                            {totalItem}
                            <span className="text-sm font-normal ml-1">{t('dashboard.order')}</span>
                        </p>
                        <p className="flex gap-2 ml-2">
                            <span
                                title={`${t('dashboard.overview.sales')}: ${formatCurrency(totalAmount)}`}
                                className={clsx('text-xs font-semibold italic', totalAmount > 0 ? ' text-green-700' : '')}
                            >
                                {formatCurrency(totalAmount)}/
                                <span className="text-xs ">{`${totalQuantity} ${t('dashboard.overview.total_product')}`}</span>
                            </span>
                        </p>
                    </>
                );
            case 'invoice':
                return (
                    <>
                        <p className="text-6xl font-semibold">
                            {totalItem}
                            <span className="text-sm font-normal ml-1">{t('sales.invoice')}</span>
                        </p>
                        <p className="flex gap-2 ml-2">
                            <span
                                title={`${t('dashboard.overview.sales')}: ${formatCurrency(totalAmount)}`}
                                className={clsx('text-xs font-semibold italic', totalAmount > 0 ? ' text-green-700' : '')}
                            >
                                {formatCurrency(totalAmount)}/
                                <span className="text-xs ">{`${totalQuantity} ${t('dashboard.overview.total_product')}`}</span>
                            </span>
                        </p>
                    </>
                );
            case 'return':
                return (
                    <>
                        <p className="text-6xl font-semibold">
                            {totalItem}
                            <span className="text-sm font-normal ml-1">{t('dashboard.order')}</span>
                        </p>
                        <p className="flex gap-2 ml-2">
                            <span
                                title={`${t('dashboard.overview.sales')}: ${formatCurrency(totalAmount)}`}
                                className={clsx('text-xs font-semibold italic', totalAmount > 0 ? ' text-green-700' : '')}
                            >
                                {formatCurrency(totalAmount)}/
                                <span className="text-xs ">{`${totalQuantity} ${t('dashboard.overview.total_product')}`}</span>
                            </span>
                        </p>
                    </>
                );
            case 'expense':
                return (
                    <>
                        <p className="text-6xl font-semibold">
                            {totalItem}
                            <span className="text-sm font-normal ml-1">{t('Expense')}</span>
                        </p>
                        <p className="flex gap-2 ml-2">
                            <span
                                title={`${t('dashboard.overview.sales')}: ${formatCurrency(totalAmount)}`}
                                className={clsx('text-xs font-semibold italic', totalAmount > 0 ? ' text-green-700' : '')}
                            >
                                {formatCurrency(totalAmount)}/
                                <span className="text-xs ">{`${totalQuantity} ${t('finance_accounting.payment_slip.item')}`}</span>
                            </span>
                        </p>
                    </>
                );
            case 'debt':
                return (
                    <>
                        <p className="text-6xl font-semibold">
                            {totalItem}
                            <span className="text-sm font-normal ml-1">{t('sales.invoice')}</span>
                        </p>
                        <p className="flex gap-2 ml-2">
                            <span
                                title={`${t('dashboard.overview.sales')}: ${formatCurrency(totalAmount)}`}
                                className={clsx('text-xs font-semibold italic', totalAmount > 0 ? ' text-green-700' : '')}
                            >
                                {formatCurrency(totalAmount)}/
                                <span className="text-xs ">{`${totalQuantity} ${t('finance_accounting.invoice.items')}`}</span>
                            </span>
                        </p>
                    </>
                );
            default:
                return (
                    <>
                        <p className="text-6xl font-semibold">
                            {totalItem}
                            <span className="text-sm font-normal ml-1">{t('dashboard.order')}</span>
                        </p>
                        <p className="flex gap-2 ml-2">
                            <span
                                title={`${t('dashboard.overview.sales')}: ${formatCurrency(totalAmount)}`}
                                className={clsx('text-xs font-semibold italic', totalAmount > 0 ? ' text-green-700' : '')}
                            >
                                {formatCurrency(totalAmount)}/
                                <span className="text-xs ">{`${totalQuantity} ${t('dashboard.overview.total_product')}`}</span>
                            </span>
                        </p>
                    </>
                );
        }
    };

    return (
        <div
            className={`${display.bgColor} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300 w-full relative flex justify-between items-center`}
        >
            <div className="px-2 py-1 bg-white shadow text-center font-medium rounded-lg mb-4 absolute top-[-15px] right-4">
                <span>{title}</span>
            </div>
            <div className={`${display.iconBgColor} w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0`}>
                <div className="text-white text-2xl">{display.icon}</div>
            </div>
            <div className="flex flex-col justify-between items-start">{renderContent()}</div>
        </div>
    );
};
//     return (
//         <div
//             className={`${display.bgColor} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300 w-full relative flex justify-between items-center`}
//         >
//             <div className="px-2 py-1 bg-white shadow text-center font-medium rounded-lg mb-4 absolute top-[-15px] right-4">
//                 <span>{title}</span>
//             </div>
//             <div className={`${display.iconBgColor} w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0`}>
//                 <div className="text-white text-2xl">{display.icon}</div>
//             </div>
//             <div className="flex flex-col justify-between items-start">
// <p className="text-6xl font-semibold">
//     {totalItem}
//     <span className="text-sm font-normal ml-1">{t('dashboard.order')}</span>
// </p>
// <p className="flex gap-2 ml-2">
//     <span
//         title={`${t('dashboard.overview.sales')}: ${formatCurrency(totalAmount)}`}
//         className={clsx('text-xs font-semibold italic', totalAmount > 0 ? ' text-green-700' : '')}
//     >
//         {formatCurrency(totalAmount)}/<span className="text-xs ">{`${totalQuantity} ${t('dashboard.overview.total_product')}`}</span>
//     </span>
// </p>
//             </div>
//         </div>
//     );
// };

type Props = {
    from: string;
    to: string;
};

const SummaryInfo: React.FC<Props> = (props: Props) => {
    const { from, to } = props;
    const { t } = useLocale();

    const [summarySaleData, setSummarySaleData] = useState<ISummarySaleData>(new SummarySaleData());

    useEffect(() => {
        if (!from || !to) return;
        setTimeout(() => {
            initData();
        }, 500);
    }, [from, to]);

    const initData = async () => {
        const resp = await apiGetDashboardSummary(from, to);
        if (!resp?.succeeded) return;
        const data: ISummarySaleData = resp?.data;
        setSummarySaleData(data);
    };

    return (
        <div className="pt-5 flex gap-4 xs:flex-col xs:gap-6">
            <Box
                title={t('dashboard.overview.pending')}
                type="draft"
                content={summarySaleData?.orderDraft}
                isLoading={false}
                display={{ bgColor: 'bg-blue-50', icon: <CodeSandboxOutlined />, iconBgColor: 'bg-slate-600' }}
            />
            <Box
                title={t('sales.invoice')}
                type="invoice"
                content={summarySaleData?.invoice}
                isLoading={false}
                display={{ bgColor: 'bg-yellow-50', icon: <DollarOutlined />, iconBgColor: 'bg-yellow-600' }}
            />
            <Box
                title={t('sales.invoice.return')}
                type="return"
                content={summarySaleData?.orderReturn}
                isLoading={false}
                display={{ bgColor: 'bg-red-50', icon: <ClockCircleOutlined />, iconBgColor: 'bg-red-600' }}
            />
            <Box
                title={t('Expense')}
                type="expense"
                content={summarySaleData?.paymentSlip}
                isLoading={false}
                display={{ bgColor: 'bg-orange-50', icon: <CreditCardOutlined />, iconBgColor: 'bg-orange-600' }}
            />
            <Box
                title={t('Debt')}
                type="debt"
                content={summarySaleData?.debt}
                isLoading={false}
                display={{ bgColor: 'bg-green-50', icon: <FundOutlined />, iconBgColor: 'bg-green-600' }}
            />
            {/* <Box
                title={t('dashboard.overview.reconciled')}
                type="success"
                content={summarySaleData?.orderSuccess}
                isLoading={false}
                display={{ bgColor: 'bg-blue-50', icon: <CheckCircleOutlined />, iconBgColor: 'bg-blue-600' }}
            /> */}
        </div>
    );
};

export default React.memo(SummaryInfo);
