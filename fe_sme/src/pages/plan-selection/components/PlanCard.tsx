import { useLocale } from '@/i18n';

import type { BillingPlan } from '@/interface/gateway';

interface PlanCardProps {
    plan: BillingPlan;
    isSelected: boolean;
    onSelect: (id: BillingPlan['id']) => void;
}

export default function PlanCard({ plan, isSelected, onSelect }: PlanCardProps) {
    const { t } = useLocale();
    const isFree = plan.priceMonthly === 0;

    const formattedPrice = isFree
        ? t('plan.card.free')
        : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.priceMonthly) + t('plan.card.per_month');

    return (
        <div
            onClick={() => onSelect(plan.id)}
            className={`
                relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200
                ${
                    isSelected
                        ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                }
            `}
        >
            {isFree && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    {t('plan.card.free_badge')}
                </span>
            )}

            <div className="flex items-start justify-between mb-1">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-500 mb-3">{t('plan.card.max_users').replace('{count}', String(plan.maxUsers))}</p>

            {plan.description && <p className="text-xs text-gray-500 mb-3">{plan.description}</p>}

            <p className={`text-2xl font-extrabold mb-4 ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>{formattedPrice}</p>

            <ul className="space-y-1.5">
                {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {feat}
                    </li>
                ))}
            </ul>
        </div>
    );
}
