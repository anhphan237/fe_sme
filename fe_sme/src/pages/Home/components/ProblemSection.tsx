import { useLocale } from '@/i18n';
import { AlertOutlined, ClockCircleOutlined, DisconnectOutlined, FrownOutlined } from '@ant-design/icons';

const ProblemSection = () => {
    const { t } = useLocale();

    const PROBLEMS = [
        {
            icon: <ClockCircleOutlined className="text-3xl text-red-400" />,
            title: t('home.problem.1.title'),
            desc: t('home.problem.1.desc'),
            bg: 'bg-red-50',
            border: 'border-red-100',
        },
        {
            icon: <DisconnectOutlined className="text-3xl text-orange-400" />,
            title: t('home.problem.2.title'),
            desc: t('home.problem.2.desc'),
            bg: 'bg-orange-50',
            border: 'border-orange-100',
        },
        {
            icon: <AlertOutlined className="text-3xl text-yellow-500" />,
            title: t('home.problem.3.title'),
            desc: t('home.problem.3.desc'),
            bg: 'bg-yellow-50',
            border: 'border-yellow-100',
        },
        {
            icon: <FrownOutlined className="text-3xl text-purple-400" />,
            title: t('home.problem.4.title'),
            desc: t('home.problem.4.desc'),
            bg: 'bg-purple-50',
            border: 'border-purple-100',
        },
    ];

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-14">
                    <span className="inline-block px-4 py-1.5 bg-red-50 text-red-600 text-sm font-semibold rounded-full mb-4">
                        {t('home.problem.badge')}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">{t('home.problem.title')}</h2>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">{t('home.problem.subtitle')}</p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {PROBLEMS.map(item => (
                        <div
                            key={item.title}
                            className={`${item.bg} border ${item.border} rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-200`}
                        >
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">{item.icon}</div>
                            <h3 className="text-base font-bold text-gray-800">{item.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProblemSection;
