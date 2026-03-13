import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";

const LandingCTA = () => {
  const { t } = useLocale();

  return (
    <section className="py-24 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm text-blue-200 font-medium mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {t("landing.cta.badge")}
        </div>

        <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-6">
          {t("landing.cta.title")}
        </h2>
        <p className="text-lg text-slate-300 max-w-xl mx-auto mb-10">
          {t("landing.cta.subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            to="/register-company"
            className="w-full sm:w-auto px-8 py-4 bg-brand text-white font-semibold rounded-xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/50 text-base">
            {t("landing.cta.primary")}
          </Link>
          <a
            href="mailto:hello@onboardiq.io"
            className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 text-base">
            {t("landing.cta.secondary")}
          </a>
        </div>

        <p className="text-sm text-slate-400">
          {t("landing.cta.no_credit_card")}
        </p>
      </div>
    </section>
  );
};

export default LandingCTA;
