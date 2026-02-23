import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { ArrowRightOutlined, PlayCircleOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
    const navigate = useNavigate();
    const { t } = useLocale();

    const STATS = [
        { value: '500+', label: t('home.hero.stat.companies') },
        { value: '98%', label: t('home.hero.stat.satisfaction') },
        { value: '3x', label: t('home.hero.stat.faster') },
        { value: '0đ', label: t('home.hero.stat.cost') },
    ];

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-blue-800 pt-20 pb-28">
            {/* Grid overlay */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Glow blob */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-500 opacity-10 blur-3xl pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Badge */}
                <div className="flex justify-center mb-8">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium backdrop-blur-sm">
                        <StarFilled className="text-yellow-400 text-xs" />
                        {t('home.hero.badge')}
                    </span>
                </div>

                {/* Heading */}
                <h1 className="text-center text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
                    {t('home.hero.title_1')}
                    <br />
                    <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">{t('home.hero.title_2')}</span>
                    <br />
                    {t('home.hero.title_3')}
                </h1>

                {/* Subheading */}
                <p className="text-center text-lg sm:text-xl text-blue-100/80 max-w-2xl mx-auto mb-10 leading-relaxed">{t('home.hero.subtitle')}</p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <button
                        onClick={() => navigate(AppRouters.REGISTER)}
                        className="group flex items-center gap-2 px-8 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-400/40 transition-all duration-200 text-base w-full sm:w-auto justify-center"
                    >
                        {t('home.hero.btn.trial')}
                        <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform duration-200" />
                    </button>
                    <button
                        onClick={() => navigate(AppRouters.LOGIN)}
                        className="flex items-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl backdrop-blur-sm transition-all duration-200 text-base w-full sm:w-auto justify-center"
                    >
                        <PlayCircleOutlined />
                        {t('home.hero.btn.demo')}
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-white/10 pt-10">
                    {STATS.map(stat => (
                        <div key={stat.label} className="text-center">
                            <div className="text-3xl font-extrabold text-white mb-1">{stat.value}</div>
                            <div className="text-sm text-blue-200/70">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
