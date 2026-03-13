import { useState } from "react";
import { useLocale } from "@/i18n";
import { FAQ_ITEMS } from "../landing.constants";

const LandingFAQ = () => {
  const { t } = useLocale();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand bg-blue-50 rounded-full mb-4">
            {t("landing.faq.badge")}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-4">
            {t("landing.faq.title")}
          </h2>
          <p className="text-muted text-lg">{t("landing.faq.subtitle")}</p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.questionKey}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-blue-100 shadow-md shadow-blue-50"
                    : "border-stroke"
                }`}>
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">
                  <span
                    className={`font-semibold text-sm pr-4 ${isOpen ? "text-brand" : "text-ink"}`}>
                    {t(item.questionKey)}
                  </span>
                  <svg
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-brand" : "text-muted"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`transition-all duration-200 ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  } overflow-hidden`}>
                  <div className="px-6 pb-5 text-sm text-muted leading-relaxed">
                    {t(item.answerKey)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingFAQ;
