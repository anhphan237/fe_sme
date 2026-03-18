import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import type { Locale } from "@/stores/user.store";

type LangOption = {
  value: Locale;
  flag: string;
  label: string;
  native: string;
};

const LANGUAGES: LangOption[] = [
  { value: "vi_VN", flag: "🇻🇳", label: "Tiếng Việt", native: "VI" },
  { value: "en_US", flag: "🇺🇸", label: "English", native: "EN" },
];

export function LanguageSwitcher() {
  const { t } = useLocale();
  const locale = useUserStore((s) => s.locale);
  const setLocale = useUserStore((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.value === locale) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={t("lang.select")}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700">
        <span className="text-base leading-none">{current.flag}</span>
        <span className="text-[13px] font-medium">{current.native}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[148px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              type="button"
              onClick={() => {
                setLocale(lang.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] transition hover:bg-gray-50 ${
                locale === lang.value
                  ? "font-semibold text-indigo-600"
                  : "text-gray-600"
              }`}>
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
              {locale === lang.value && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
