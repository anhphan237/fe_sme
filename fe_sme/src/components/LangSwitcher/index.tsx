import { useState, useEffect, useRef } from "react";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import type { Locale } from "@/stores/user.store";

const LANGUAGES: {
  value: Locale;
  flag: string;
  label: string;
  native: string;
}[] = [
  { value: "vi_VN", flag: "🇻🇳", label: "Tiếng Việt", native: "VI" },
  { value: "en_US", flag: "🇺🇸", label: "English", native: "EN" },
];

export const LangSwitcher = () => {
  const { t } = useLocale();
  const locale = useUserStore((s) => s.locale);
  const setLocale = useUserStore((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.value === locale) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("register.lang.label")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all duration-200
          ${
            open
              ? "border-brand/40 text-brand bg-brand/5"
              : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 bg-white"
          }`}>
        <span className="text-base leading-none">{current.flag}</span>
        <span>{current.native}</span>
        <svg
          className={`w-3 h-3 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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

      <div
        className={`absolute right-0 top-[calc(100%+8px)] w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50
          transition-all duration-200 origin-top-right
          ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            {t("register.lang.label")}
          </p>
        </div>

        {LANGUAGES.map((lang) => {
          const isActive = locale === lang.value;
          return (
            <button
              key={lang.value}
              type="button"
              onClick={() => {
                setLocale(lang.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors
                ${isActive ? "bg-brand/5 text-brand" : "text-gray-700 hover:bg-gray-50"}`}>
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
  );
};

export default LangSwitcher;
