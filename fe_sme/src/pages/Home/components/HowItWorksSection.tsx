import { useLocale } from '@/i18n';
import { BranchesOutlined, CheckCircleFilled, RocketOutlined, SettingOutlined } from '@ant-design/icons';

const HowItWorksSection = () => {
    const { t } = useLocale();

    const STEPS = [
        {
            step: '01',
            icon: <SettingOutlined className="text-3xl text-blue-600" />,
            title: t('home.how_it_works.step1.title'),
            desc: t('home.how_it_works.step1.desc'),
            checks: [t('home.how_it_works.step1.check1'), t('home.how_it_works.step1.check2'), t('home.how_it_works.step1.check3')],
        },
        {
            step: '02',
            icon: <BranchesOutlined className="text-3xl text-purple-600" />,
            title: t('home.how_it_works.step2.title'),
            desc: t('home.how_it_works.step2.desc'),
            checks: [t('home.how_it_works.step2.check1'), t('home.how_it_works.step2.check2'), t('home.how_it_works.step2.check3')],
        },
        {
            step: '03',
            icon: <RocketOutlined className="text-3xl text-green-600" />,
            title: t('home.how_it_works.step3.title'),
            desc: t('home.how_it_works.step3.desc'),
            checks: [t('home.how_it_works.step3.check1'), t('home.how_it_works.step3.check2'), t('home.how_it_works.step3.check3')],
        },
    ];

    return (
        <section id="how-it-works" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-1.5 bg-green-50 text-green-600 text-sm font-semibold rounded-full mb-4">
                        {t('home.how_it_works.badge')}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">{t('home.how_it_works.title')}</h2>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto">{t('home.how_it_works.subtitle')}</p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connector line (desktop) */}
                    <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200" />

                    {STEPS.map((step, idx) => (
                        <div key={step.step} className="relative flex flex-col items-center text-center gap-5">
                            {/* Step number bubble */}
                            <div className="relative z-10 w-20 h-20 bg-white border-4 border-gray-100 rounded-2xl flex items-center justify-center shadow-md">
                                {step.icon}
                                <span className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {idx + 1}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed mb-4">{step.desc}</p>
                            </div>

                            <ul className="w-full space-y-2">
                                {step.checks.map(check => (
                                    <li key={check} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2">
                                        <CheckCircleFilled className="text-green-500 flex-shrink-0" />
                                        {check}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
