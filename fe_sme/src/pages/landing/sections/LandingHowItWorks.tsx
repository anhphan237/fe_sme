import { useLocale } from "@/i18n";
import { STEPS_ITEMS, HOW_STATS } from "../landing.constants";

const LandingHowItWorks = () => {
  const { t } = useLocale();

  return (
    <section id="how-it-works" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand bg-blue-50 rounded-full mb-4">
            {t("landing.how.badge")}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-4">
            {t("landing.how.title")}
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            {t("landing.how.subtitle")}
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-transparent via-stroke to-transparent" />

          {STEPS_ITEMS.map((step, index) => (
            <div
              key={step.titleKey}
              className="relative flex flex-col items-center text-center">
              <div className="relative mb-4 z-10">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-stroke shadow-sm flex items-center justify-center text-2xl">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {index + 1}
                </div>
              </div>
              <h3 className="font-semibold text-ink mb-2">
                {t(step.titleKey)}
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                {t(step.descKey)}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_STATS.map((stat) => (
            <div
              key={stat.labelKey}
              className="bg-white rounded-2xl p-8 text-center border border-stroke shadow-sm">
              <div className="font-serif text-4xl font-bold text-brand mb-2">
                {t(stat.valueKey)}
              </div>
              <div className="font-medium text-ink mb-1">
                {t(stat.labelKey)}
              </div>
              <div className="text-sm text-muted">{t(stat.subKey)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingHowItWorks;
