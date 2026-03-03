import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";
import { FOOTER_LINKS } from "../landing.constants";

export default function LandingFooter() {
  const { t } = useLocale();

  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="font-bold text-white text-lg">OnboardIQ</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              {t("landing.footer.tagline")}
            </p>
            <div className="flex gap-3">
              {[
                {
                  label: "Twitter",
                  path: "M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743A11.65 11.65 0 013.18 4.322a4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84",
                },
                {
                  label: "LinkedIn",
                  path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z",
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {FOOTER_LINKS.map((column) => (
            <div key={column.titleKey}>
              <h4 className="font-semibold text-white text-sm mb-4">
                {t(column.titleKey)}
              </h4>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.labelKey}>
                    <a
                      href={link.href}
                      className="text-sm hover:text-white transition-colors">
                      {t(link.labelKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>{t("landing.footer.copyright")}</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-white transition-colors">
              {t("landing.footer.privacy")}
            </a>
            <a href="#" className="hover:text-white transition-colors">
              {t("landing.footer.terms")}
            </a>
            <a href="#" className="hover:text-white transition-colors">
              {t("landing.footer.cookies")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
