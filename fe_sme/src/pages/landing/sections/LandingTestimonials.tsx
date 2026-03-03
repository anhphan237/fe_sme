import { useLocale } from "@/i18n";
import { TESTIMONIALS } from "../landing.constants";

export default function LandingTestimonials() {
  const { t } = useLocale();

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand bg-blue-50 rounded-full mb-4">
            {t("landing.testimonials.badge")}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-4">
            {t("landing.testimonials.title")}
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            {t("landing.testimonials.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.nameKey}
              className="bg-white rounded-2xl p-7 border border-stroke shadow-sm flex flex-col gap-4">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-muted text-sm leading-relaxed italic flex-1">
                "{t(item.quoteKey)}"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-stroke">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: item.avatarColor }}>
                  {t(item.nameKey).charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-ink text-sm">
                    {t(item.nameKey)}
                  </div>
                  <div className="text-xs text-muted">{t(item.roleKey)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
