import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { ArrowRightOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const CtaSection = () => {
    const navigate = useNavigate();
    const { t } = useLocale();

    return (
        <section className="py-24 relative overflow-hidden bg-gradient-to-br from-blue-700 to-blue-900">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-400 rounded-full opacity-10 blur-3xl translate-y-1/2 -translate-x-1/4" />

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <span className="inline-block px-4 py-1.5 bg-blue-500/30 border border-blue-300/30 text-blue-100 text-sm font-semibold rounded-full mb-6">
                    {t('home.cta.badge')}
                </span>

                <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
                    {t('home.cta.title_1')}
                    <br />
                    <span className="text-blue-200">{t('home.cta.title_2')}</span>
                </h2>

                <p className="text-xl text-blue-100/80 mb-10 max-w-xl mx-auto">{t('home.cta.subtitle')}</p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(AppRouters.REGISTER)}
                        className="group flex items-center gap-2 px-8 py-3.5 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 shadow-xl shadow-blue-900/30 transition-all duration-200 text-base w-full sm:w-auto justify-center"
                    >
                        {t('home.cta.btn.trial')}
                        <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform duration-200" />
                    </button>
                    <button
                        onClick={() => navigate(AppRouters.LOGIN)}
                        className="flex items-center gap-2 px-8 py-3.5 bg-blue-600/50 hover:bg-blue-600/70 border border-blue-300/30 text-white font-semibold rounded-xl backdrop-blur-sm transition-all duration-200 text-base w-full sm:w-auto justify-center"
                    >
                        <PhoneOutlined />
                        {t('home.cta.btn.contact')}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default CtaSection;
