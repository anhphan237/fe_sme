import { useLocale } from "@/i18n";
import { FEATURE_ITEMS } from "../landing.constants";

export default function LandingFeatures() {
  const { t } = useLocale();

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand bg-blue-50 rounded-full mb-4">
            {t("landing.features.badge")}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-4">
            {t("landing.features.title")}
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            {t("landing.features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURE_ITEMS.map((feature) => (
            <div
              key={feature.titleKey}
              className="group p-6 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 bg-white">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-xl ${feature.iconBg}`}>
                {feature.icon}
              </div>
              <h3 className="font-semibold text-ink mb-2 group-hover:text-brand transition-colors">
                {t(feature.titleKey)}
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
