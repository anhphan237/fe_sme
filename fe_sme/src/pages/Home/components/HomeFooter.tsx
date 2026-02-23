import { useLocale } from '@/i18n';

import AppLogo from '@/assets/logo/exps-removebg.png';

const HomeFooter = () => {
    const { t } = useLocale();

    const FOOTER_LINKS = [
        {
            title: t('home.footer.section.product'),
            links: [t('home.footer.link.features'), t('home.footer.link.pricing'), t('home.footer.link.changelog'), t('home.footer.link.roadmap')],
        },
        {
            title: t('home.footer.section.resources'),
            links: [t('home.footer.link.docs'), t('home.footer.link.guide'), t('home.footer.link.blog'), t('home.footer.link.api')],
        },
        {
            title: t('home.footer.section.company'),
            links: [t('home.footer.link.about'), t('home.footer.link.careers'), t('home.footer.link.partners'), t('home.footer.link.press')],
        },
        {
            title: t('home.footer.section.support'),
            links: [t('home.footer.link.help_center'), t('home.footer.link.contact'), t('home.footer.link.status'), t('home.footer.link.community')],
        },
    ];

    return (
        <footer className="bg-gray-950 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-5">
                            <img src={AppLogo} alt="Logo" className="h-8 w-auto brightness-200" />
                            <span className="text-white font-bold text-lg">{t('home.footer.brand.name')}</span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed mb-6">{t('home.footer.brand.desc')}</p>
                        <div className="space-y-1.5 text-sm">
                            <p className="text-gray-400">📧 {t('home.footer.brand.email')}</p>
                            <p className="text-gray-400">📞 {t('home.footer.brand.phone')}</p>
                        </div>
                    </div>

                    {/* Links */}
                    {FOOTER_LINKS.map(section => (
                        <div key={section.title}>
                            <h4 className="text-white font-semibold text-sm mb-4">{section.title}</h4>
                            <ul className="space-y-2.5">
                                {section.links.map(link => (
                                    <li key={link}>
                                        <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500">{t('home.footer.copyright')}</p>
                    <div className="flex gap-6">
                        <a href="#" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                            {t('home.footer.privacy')}
                        </a>
                        <a href="#" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                            {t('home.footer.terms')}
                        </a>
                        <a href="#" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                            {t('home.footer.cookie')}
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default HomeFooter;
