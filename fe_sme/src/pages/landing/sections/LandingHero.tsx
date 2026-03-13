import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";
import {
  HERO_TRUST_KEYS,
  HERO_MOCK_STATS,
  HERO_MOCK_EMPLOYEES,
} from "../landing.constants";

const LandingHero = () => {
  const { t } = useLocale();

  const scrollToSection = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 pt-16">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #1d4ed820 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, #7c3aed20 0%, transparent 50%),
                            radial-gradient(circle at 60% 80%, #0ea5e920 0%, transparent 50%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm text-blue-200 font-medium mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {t("landing.hero.badge")}
        </div>

        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 max-w-4xl mx-auto">
          {t("landing.hero.title_start")}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
            {t("landing.hero.title_highlight")}
          </span>{" "}
          {t("landing.hero.title_end")}
        </h1>

        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("landing.hero.subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/register-company"
            className="w-full sm:w-auto px-8 py-4 bg-brand text-white font-semibold rounded-xl hover:bg-blue-500 transition-all transform hover:-translate-y-0.5 shadow-xl shadow-blue-900/50 text-base">
            {t("landing.hero.cta_primary")}
          </Link>
          <button
            onClick={() => scrollToSection("#how-it-works")}
            className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 text-base flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {t("landing.hero.cta_secondary")}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 mb-16">
          {HERO_TRUST_KEYS.map((key) => (
            <div key={key} className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-emerald-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t(key)}
            </div>
          ))}
        </div>

        <div className="relative mx-auto max-w-5xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
          <div className="bg-slate-800/80 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-slate-700/50 rounded-md px-3 py-1 text-xs text-slate-400 text-center max-w-xs mx-auto">
                {t("landing.hero.mock_url")}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 min-h-72">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {HERO_MOCK_STATS.map((stat) => (
                <div
                  key={stat.labelKey}
                  className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.valueKey}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {t(stat.labelKey)}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">
                  {t("landing.hero.mock_employees_title")}
                </span>
                <span className="text-xs text-slate-400">
                  {t("landing.hero.mock_employees_count")}
                </span>
              </div>
              {HERO_MOCK_EMPLOYEES.map((emp) => (
                <div key={emp.nameKey} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-brand/30 flex items-center justify-center text-xs font-bold text-blue-300 shrink-0">
                    {emp.nameKey.split(" ").pop()?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-white font-medium truncate">
                        {emp.nameKey}
                      </span>
                      <span className="text-slate-400 ml-2 shrink-0">
                        {emp.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand to-violet-500 rounded-full"
                        style={{ width: `${emp.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">
                    {emp.dayLabel}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-slate-400 mb-2">
                  {t("landing.hero.mock_chatbot_title")}
                </div>
                <div className="space-y-1.5">
                  <div className="bg-blue-500/20 rounded-lg px-3 py-1.5 text-xs text-blue-200 max-w-fit">
                    {t("landing.hero.mock_chatbot_question")}
                  </div>
                  <div className="bg-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                    {t("landing.hero.mock_chatbot_answer")}
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="text-xs text-slate-400 mb-2">
                  {t("landing.hero.mock_survey_title")}
                </div>
                <div className="text-sm font-semibold text-emerald-400 mb-1">
                  {t("landing.hero.mock_survey_value")}
                </div>
                <div className="text-xs text-slate-400">
                  {t("landing.hero.mock_survey_sub")}
                </div>
                <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: "89%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
