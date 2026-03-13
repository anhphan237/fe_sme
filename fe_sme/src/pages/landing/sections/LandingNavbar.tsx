import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import type { Locale } from "@/stores/user.store";
import { NAV_LINK_KEYS } from "../landing.constants";

const LANGUAGES: {
  value: Locale;
  flag: string;
  label: string;
  native: string;
}[] = [
  { value: "vi_VN", flag: "ðŸ‡»ðŸ‡³", label: "Tiáº¿ng Viá»‡t", native: "VI" },
  { value: "en_US", flag: "ðŸ‡ºðŸ‡¸", label: "English", native: "EN" },
];

const LandingNavbar = () => {
  const { t } = useLocale();
  const locale = useUserStore((s) => s.locale);
  const setLocale = useUserStore((s) => s.setLocale);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.value === locale) ?? LANGUAGES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Top bar â€” transitions from transparent to frosted glass */}
      <div
        className={`transition-all duration-500 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-[0_1px_20px_rgba(0,0,0,0.06)]"
            : "bg-transparent border-b border-transparent"
        }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="h-[68px] flex items-center justify-between gap-8">
            {/* â”€â”€ Logo â”€â”€ */}
            <a href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="relative w-9 h-9">
                {/* gradient ring */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand to-brandDark opacity-90 group-hover:opacity-100 transition-opacity shadow-md shadow-brand/30" />
                <div className="relative flex items-center justify-center w-full h-full">
                  <svg viewBox="0 0 20 20" fill="none" className="w-4.5 h-4.5">
                    <rect
                      x="3"
                      y="2"
                      width="14"
                      height="16"
                      rx="2.5"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M7 7h6M7 10.5h6M7 14h4"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle cx="15" cy="15" r="3.5" fill="white" />
                    <path
                      d="M13.5 15l1 1 2-1.5"
                      stroke="#6C63FF"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col leading-none">
                <span
                  className={`text-[17px] font-bold tracking-tight transition-colors duration-300 ${scrolled ? "text-gray-900" : "text-white"}`}>
                  Onboard<span className="text-brand">IQ</span>
                </span>
                <span
                  className={`text-[9px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${scrolled ? "text-gray-400" : "text-white/50"}`}>
                  SME Platform
                </span>
              </div>
            </a>

            {/* â”€â”€ Desktop Nav â”€â”€ */}
            <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              {NAV_LINK_KEYS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={`relative px-4 py-2 text-[13.5px] font-medium rounded-lg transition-all duration-200 group
                    ${
                      scrolled
                        ? "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}>
                  {t(link.labelKey)}
                  {/* hover underline accent */}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 group-hover:w-4 h-0.5 bg-brand rounded-full transition-all duration-300" />
                </button>
              ))}
            </nav>

            {/* â”€â”€ Language Switcher (desktop dropdown) â”€â”€ */}
            <div ref={langRef} className="relative hidden md:block shrink-0">
              <button
                onClick={() => setLangOpen((o) => !o)}
                aria-label="Switch language"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all duration-200
                  ${
                    langOpen
                      ? scrolled
                        ? "border-brand/40 text-brand bg-brand/5"
                        : "border-white/40 text-white bg-white/15"
                      : scrolled
                        ? "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 bg-white"
                        : "border-white/20 text-white/70 hover:border-white/40 hover:text-white bg-white/5"
                  }`}>
                <span className="text-base leading-none">
                  {currentLang.flag}
                </span>
                <span>{currentLang.native}</span>
                <svg
                  className={`w-3 h-3 opacity-60 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 12 12"
                  fill="none">
                  <path
                    d="M2 4l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Dropdown panel */}
              <div
                className={`absolute right-0 top-[calc(100%+8px)] w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50
                transition-all duration-200 origin-top-right
                ${langOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
                {/* Header */}
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    Language
                  </p>
                </div>
                {LANGUAGES.map((lang) => {
                  const isActive = locale === lang.value;
                  return (
                    <button
                      key={lang.value}
                      onClick={() => {
                        setLocale(lang.value);
                        setLangOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors
                        ${
                          isActive
                            ? "bg-brand/5 text-brand"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}>
                      <span className="text-xl leading-none">{lang.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold leading-tight">
                          {lang.label}
                        </p>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          {lang.native}
                        </p>
                      </div>
                      {isActive && (
                        <svg
                          className="w-4 h-4 text-brand shrink-0"
                          viewBox="0 0 16 16"
                          fill="none">
                          <path
                            d="M3 8l3.5 3.5L13 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* â”€â”€ Desktop CTA â”€â”€ */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <Link
                to="/login"
                className={`px-4 py-2 text-[13.5px] font-medium rounded-lg transition-all duration-200
                  ${
                    scrolled
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}>
                {t("landing.nav.login")}
              </Link>
              <Link
                to="/register-company"
                className="group flex items-center gap-1.5 px-4 py-2 text-[13.5px] font-semibold bg-brand text-white rounded-lg hover:bg-brandDark transition-all duration-200 shadow-md shadow-brand/25 hover:shadow-brand/40 hover:shadow-lg">
                {t("landing.nav.try_free")}
                <svg
                  className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                  viewBox="0 0 16 16"
                  fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            {/* â”€â”€ Mobile Hamburger â”€â”€ */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              className={`md:hidden flex flex-col items-center justify-center w-9 h-9 rounded-lg gap-[5px] transition-colors duration-200
                ${scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"}`}>
              <span
                className={`block h-[1.5px] rounded-full transition-all duration-300 origin-center
                ${mobileOpen ? "w-5 rotate-45 translate-y-[6.5px]" : "w-5"}
                ${scrolled ? "bg-gray-700" : "bg-white"}`}
              />
              <span
                className={`block h-[1.5px] rounded-full transition-all duration-300
                ${mobileOpen ? "w-0 opacity-0" : "w-3.5"}
                ${scrolled ? "bg-gray-700" : "bg-white"}`}
              />
              <span
                className={`block h-[1.5px] rounded-full transition-all duration-300 origin-center
                ${mobileOpen ? "w-5 -rotate-45 -translate-y-[6.5px]" : "w-5"}
                ${scrolled ? "bg-gray-700" : "bg-white"}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* â”€â”€ Mobile Menu â”€â”€ */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out
          ${mobileOpen ? "max-h-[560px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="bg-white/95 backdrop-blur-xl border-b border-gray-200/60 shadow-lg px-6 pt-3 pb-6">
          <nav className="flex flex-col">
            {NAV_LINK_KEYS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="flex items-center gap-3 py-3 text-[14px] font-medium text-gray-500 hover:text-gray-900 border-b border-gray-100 last:border-0 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-brand/40 shrink-0" />
                {t(link.labelKey)}
              </button>
            ))}
          </nav>
          {/* Language picker â€” mobile */}
          <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
            <p className="px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
              Language
            </p>
            {LANGUAGES.map((lang) => {
              const isActive = locale === lang.value;
              return (
                <button
                  key={lang.value}
                  onClick={() => setLocale(lang.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-0
                    ${isActive ? "bg-brand/5" : "hover:bg-gray-50"}`}>
                  <span className="text-2xl leading-none">{lang.flag}</span>
                  <div className="flex-1">
                    <p
                      className={`text-[14px] font-semibold ${isActive ? "text-brand" : "text-gray-800"}`}>
                      {lang.label}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0">
                      <svg
                        className="w-3 h-3 text-white"
                        viewBox="0 0 12 12"
                        fill="none">
                        <path
                          d="M2 6l2.5 2.5L10 3.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 flex flex-col gap-2.5">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="py-2.5 text-[14px] font-medium text-center border border-gray-200 rounded-xl text-gray-700 hover:border-brand hover:text-brand transition-colors">
              {t("landing.nav.login")}
            </Link>
            <Link
              to="/register-company"
              onClick={() => setMobileOpen(false)}
              className="py-2.5 text-[14px] font-semibold text-center bg-brand text-white rounded-xl hover:bg-brandDark transition-colors shadow-md shadow-brand/25">
              {t("landing.nav.try_free")} â†’
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LandingNavbar;
