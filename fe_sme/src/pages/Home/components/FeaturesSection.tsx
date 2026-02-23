import { useLocale } from '@/i18n';
import {
    ApiOutlined,
    BarChartOutlined,
    BellOutlined,
    CreditCardOutlined,
    MessageOutlined,
    OrderedListOutlined,
    RiseOutlined,
    SafetyOutlined,
} from '@ant-design/icons';

const FeaturesSection = () => {
    const { t } = useLocale();

    const FEATURES = [
        {
            icon: <SafetyOutlined />,
            title: t('home.features.1.title'),
            desc: t('home.features.1.desc'),
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            icon: <OrderedListOutlined />,
            title: t('home.features.2.title'),
            desc: t('home.features.2.desc'),
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            icon: <RiseOutlined />,
            title: t('home.features.3.title'),
            desc: t('home.features.3.desc'),
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
        {
            icon: <BellOutlined />,
            title: t('home.features.4.title'),
            desc: t('home.features.4.desc'),
            color: 'text-orange-600',
            bg: 'bg-orange-50',
        },
        {
            icon: <MessageOutlined />,
            title: t('home.features.5.title'),
            desc: t('home.features.5.desc'),
            color: 'text-cyan-600',
            bg: 'bg-cyan-50',
        },
        {
            icon: <ApiOutlined />,
            title: t('home.features.6.title'),
            desc: t('home.features.6.desc'),
            color: 'text-pink-600',
            bg: 'bg-pink-50',
        },
        {
            icon: <BarChartOutlined />,
            title: t('home.features.7.title'),
            desc: t('home.features.7.desc'),
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
        },
        {
            icon: <CreditCardOutlined />,
            title: t('home.features.8.title'),
            desc: t('home.features.8.desc'),
            color: 'text-teal-600',
            bg: 'bg-teal-50',
        },
    ];

    return (
        <section id="features" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-14">
                    <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-semibold rounded-full mb-4">
                        {t('home.features.badge')}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">{t('home.features.title')}</h2>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">{t('home.features.subtitle')}</p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FEATURES.map(feature => (
                        <div
                            key={feature.title}
                            className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
                        >
                            <div
                                className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center ${feature.color} text-2xl group-hover:scale-110 transition-transform duration-200`}
                            >
                                {feature.icon}
                            </div>
                            <h3 className="text-base font-bold text-gray-800 leading-snug">{feature.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
