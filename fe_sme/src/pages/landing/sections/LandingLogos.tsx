import { useLocale } from "@/i18n";
import { LOGO_COMPANIES } from "../landing.constants";

export default function LandingLogos() {
  const { t } = useLocale();

  return (
    <section className="py-16 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-sm font-medium text-muted uppercase tracking-widest mb-10">
          {t("landing.logos.label")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {LOGO_COMPANIES.map((company) => (
            <div
              key={company.name}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: company.color }}>
                {company.name.charAt(0)}
              </div>
              <span className="font-semibold text-sm tracking-tight">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
