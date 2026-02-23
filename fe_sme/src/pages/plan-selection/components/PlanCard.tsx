import type { BillingPlan } from '@/interface/gateway';

interface PlanCardProps {
    plan: BillingPlan;
    isSelected: boolean;
    onSelect: (id: BillingPlan['id']) => void;
}

/** Äá»‹nh dáº¡ng giÃ¡ tiá»n sang VNÄ */
function formatPrice(plan: BillingPlan): string {
    if (plan.priceMonthly === 0) return 'Miá»…n phÃ­';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.priceMonthly) + '/thÃ¡ng';
}

export default function PlanCard({ plan, isSelected, onSelect }: PlanCardProps) {
    const isFree = plan.priceMonthly === 0;

    return (
        <div
            onClick={() => onSelect(plan.id)}
            className={`
                relative rounded-2xl border-2 p-6 cursor-pointer transition-all
                ${
                    isSelected
                        ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                }
            `}
        >
            {/* Badge "Miá»…n phÃ­" */}
            {isFree && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Miá»…n phÃ­ mÃ£i
                </span>
            )}

            {/* TÃªn gÃ³i */}
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

            {/* Sá»‘ lÆ°á»£ng ngÆ°á»i dÃ¹ng */}
            <p className="text-xs text-gray-500 mb-3">Tá»‘i Ä‘a {plan.maxUsers} ngÆ°á»i dÃ¹ng</p>

            {/* MÃ´ táº£ */}
            {plan.description && <p className="text-xs text-gray-500 mb-3">{plan.description}</p>}

            {/* GiÃ¡ */}
            <p className={`text-2xl font-extrabold mb-4 ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>{formatPrice(plan)}</p>

            {/* TÃ­nh nÄƒng */}
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
