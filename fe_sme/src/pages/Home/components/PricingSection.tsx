import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { CheckOutlined, CrownFilled, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface Plan {
    id: string;
    name: string;
    price: string;
    period?: string;
    badge?: string;
    badgeColor?: string;
    highlighted?: boolean;
    description: string;
    features: string[];
    cta: string;
    ctaStyle: string;
}

const PricingSection = () => {
    const navigate = useNavigate();
    const { t } = useLocale();

    const PLANS: Plan[] = [
        {
            id: 'basic',
            name: t('home.pricing.basic.name'),
            price: t('home.pricing.basic.price'),
            description: t('home.pricing.basic.desc'),
            badge: t('home.pricing.basic.badge'),
            badgeColor: 'bg-gray-100 text-gray-600',
            features: [
                t('home.pricing.basic.feature1'),
                t('home.pricing.basic.feature2'),
                t('home.pricing.basic.feature3'),
                t('home.pricing.basic.feature4'),
                t('home.pricing.basic.feature5'),
            ],
            cta: t('home.pricing.basic.cta'),
            ctaStyle: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
        },
        {
            id: 'pro',
            name: t('home.pricing.pro.name'),
            price: '499.000',
            period: t('home.pricing.pro.period'),
            description: t('home.pricing.pro.desc'),
            features: [
                t('home.pricing.pro.feature1'),
                t('home.pricing.pro.feature2'),
                t('home.pricing.pro.feature3'),
                t('home.pricing.pro.feature4'),
                t('home.pricing.pro.feature5'),
                t('home.pricing.pro.feature6'),
            ],
            cta: t('home.pricing.pro.cta'),
            ctaStyle: 'border border-blue-300 text-blue-600 hover:bg-blue-50',
        },
        {
            id: 'business',
            name: t('home.pricing.business.name'),
            price: '1.499.000',
            period: t('home.pricing.business.period'),
            description: t('home.pricing.business.desc'),
            badge: t('home.pricing.business.badge'),
            badgeColor: 'bg-blue-600 text-white',
            highlighted: true,
            features: [
                t('home.pricing.business.feature1'),
                t('home.pricing.business.feature2'),
                t('home.pricing.business.feature3'),
                t('home.pricing.business.feature4'),
                t('home.pricing.business.feature5'),
                t('home.pricing.business.feature6'),
                t('home.pricing.business.feature7'),
            ],
            cta: t('home.pricing.business.cta'),
            ctaStyle: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200',
        },
        {
            id: 'enterprise',
            name: t('home.pricing.enterprise.name'),
            price: t('home.pricing.enterprise.price'),
            description: t('home.pricing.enterprise.desc'),
            badge: t('home.pricing.enterprise.badge'),
            badgeColor: 'bg-purple-100 text-purple-700',
            features: [
                t('home.pricing.enterprise.feature1'),
                t('home.pricing.enterprise.feature2'),
                t('home.pricing.enterprise.feature3'),
                t('home.pricing.enterprise.feature4'),
                t('home.pricing.enterprise.feature5'),
                t('home.pricing.enterprise.feature6'),
            ],
            cta: t('home.pricing.enterprise.cta'),
            ctaStyle: 'border border-purple-300 text-purple-700 hover:bg-purple-50',
        },
    ];

    return (
        <section id="pricing" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-14">
                    <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-semibold rounded-full mb-4">
                        {t('home.pricing.badge')}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">{t('home.pricing.title')}</h2>
                    <p className="text-lg text-gray-500 max-w-xl mx-auto">{t('home.pricing.subtitle')}</p>
                </div>

                {/* Plans */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                    {PLANS.map(plan => (
                        <div
                            key={plan.id}
                            className={`relative bg-white rounded-2xl p-6 flex flex-col gap-5 transition-all duration-200 ${
                                plan.highlighted
                                    ? 'border-2 border-blue-600 shadow-xl shadow-blue-100 scale-[1.02]'
                                    : 'border border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <span
                                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${plan.badgeColor}`}
                                >
                                    {plan.highlighted && <CrownFilled className="mr-1" />}
                                    {plan.badge}
                                </span>
                            )}

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                    {plan.highlighted && <ThunderboltOutlined className="text-blue-500" />}
                                </div>
                                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                                <div className="flex items-end gap-1">
                                    <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                                    {plan.period && <span className="text-sm text-gray-400 mb-1">{plan.period}</span>}
                                </div>
                            </div>

                            <ul className="space-y-2.5 flex-1">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                                        <CheckOutlined className="text-green-500 flex-shrink-0 mt-0.5" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => navigate(AppRouters.LOGIN)}
                                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${plan.ctaStyle}`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>

                <p className="text-center text-sm text-gray-400 mt-8">
                    {t('home.pricing.footer_prefix')} <strong>{t('home.pricing.footer_bold')}</strong> {t('home.pricing.footer_suffix')}
                </p>
            </div>
        </section>
    );
};

export default PricingSection;
