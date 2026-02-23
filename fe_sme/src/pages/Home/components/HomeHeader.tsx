import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/stores';
import { MenuOutlined, RocketOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { setUser } from '@/stores/user.store';

import usIconSrc from '@/assets/icons/us.svg';
import vnIconSrc from '@/assets/icons/vn.svg';
import AppLogo from '@/assets/logo/exps-removebg.png';

const HomeHeader = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { t } = useLocale();
    const { logged, locale, onboardingStep } = useAppSelector(state => state.user);
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleLocale = () => {
        dispatch(setUser({ locale: locale === 'vi_VN' ? ('en_US' as any) : ('vi_VN' as any) }));
    };

    const NAV_LINKS = [
        { label: t('home.header.nav.features'), href: '#features' },
        { label: t('home.header.nav.how_it_works'), href: '#how-it-works' },
        { label: t('home.header.nav.pricing'), href: '#pricing' },
    ];

    const handleLogin = () => navigate(AppRouters.LOGIN);
    const handleRegister = () => navigate(AppRouters.REGISTER);
    const handleDashboard = () => {
        if (onboardingStep && onboardingStep !== 'done') {
            const STEP_ROUTE: Record<string, string> = {
                org_setup: AppRouters.ORG_SETUP,
                plan_selection: AppRouters.PLAN_SELECTION,
            };
            navigate(STEP_ROUTE[onboardingStep] ?? AppRouters.ORG_SETUP);
        } else {
            navigate(AppRouters.DASHBOARDS);
        }
    };

    const scrollTo = (href: string) => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        setMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src={AppLogo} alt="Logo" className="h-9 w-auto" />
                        <div className="hidden sm:flex flex-col leading-none">
                            <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                                {t('home.header.logo.name')}
                            </span>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('home.header.logo.subtitle')}</span>
                        </div>
                    </div>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map(link => (
                            <button
                                key={link.href}
                                onClick={() => scrollTo(link.href)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            >
                                {link.label}
                            </button>
                        ))}
                    </nav>

                    {/* CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* Language switcher */}
                        <button
                            onClick={toggleLocale}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 transition-all duration-200"
                        >
                            <img src={locale === 'vi_VN' ? vnIconSrc : usIconSrc} alt="lang" className="w-4 h-4 rounded-sm object-cover" />
                            <span>{locale === 'vi_VN' ? 'VI' : 'EN'}</span>
                        </button>
                        {logged ? (
                            <button
                                onClick={handleDashboard}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all duration-200"
                            >
                                <RocketOutlined />
                                {t('home.header.btn.dashboard')}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleLogin}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors duration-200"
                                >
                                    {t('home.header.btn.login')}
                                </button>
                                <button
                                    onClick={handleRegister}
                                    className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-blue-200 hover:shadow-md transition-all duration-200"
                                >
                                    {t('home.header.btn.free_trial')}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <MenuOutlined className="text-lg" />
                    </button>
                </div>

                {/* Mobile dropdown */}
                {menuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-100 space-y-1">
                        {NAV_LINKS.map(link => (
                            <button
                                key={link.href}
                                onClick={() => scrollTo(link.href)}
                                className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                                {link.label}
                            </button>
                        ))}
                        <button
                            onClick={toggleLocale}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                        >
                            <img src={locale === 'vi_VN' ? vnIconSrc : usIconSrc} alt="lang" className="w-4 h-4 rounded-sm object-cover" />
                            {locale === 'vi_VN' ? 'Tiếng Việt' : 'English'}
                        </button>
                        <div className="pt-3 flex flex-col gap-2 px-1">
                            <button
                                onClick={handleLogin}
                                className="w-full py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                {t('home.header.btn.login')}
                            </button>
                            <button
                                onClick={handleRegister}
                                className="w-full py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
                            >
                                {t('home.header.btn.free_trial')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default HomeHeader;
