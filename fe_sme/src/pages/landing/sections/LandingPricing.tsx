import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";
import { PRICING_TIERS } from "../landing.constants";

type PricingTier = (typeof PRICING_TIERS)[number];

export default function LandingPricing() {
  const { t } = useLocale();
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand bg-blue-50 rounded-full mb-4">
            {t("landing.pricing.badge")}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink mb-4">
            {t("landing.pricing.title")}
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto mb-8">
            {t("landing.pricing.subtitle")}
          </p>

          <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                !yearly
                  ? "bg-white shadow-sm text-ink"
                  : "text-muted hover:text-ink"
              }`}>
              {t("landing.pricing.monthly")}
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                yearly
                  ? "bg-white shadow-sm text-ink"
                  : "text-muted hover:text-ink"
              }`}>
              {t("landing.pricing.yearly")}
              <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded font-semibold">
                {t("landing.pricing.yearly_save")}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.nameKey}
              className={`relative rounded-2xl p-6 flex flex-col ${
                tier.popular
                  ? "bg-gradient-to-b from-brand to-blue-700 text-white shadow-2xl shadow-blue-200 scale-105"
                  : "bg-white border border-stroke"
              }`}>
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    {t("landing.pricing.popular")}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <div className="font-semibold text-sm uppercase tracking-wide mb-1 opacity-80">
                  {t(tier.nameKey)}
                </div>
                <div className="flex items-end gap-1 mb-1">
                  {"isContact" in tier &&
                  (tier as PricingTier & { isContact?: boolean }).isContact ? (
                    <span
                      className={`font-serif text-3xl font-bold ${tier.popular ? "text-white" : "text-ink"}`}>
                      {t("landing.pricing.contact")}
                    </span>
                  ) : (
                    <>
                      <span
                        className={`font-serif text-4xl font-bold ${tier.popular ? "text-white" : "text-ink"}`}>
                        {yearly ? tier.yearlyPrice : tier.monthlyPrice}
                      </span>
                      <span
                        className={`text-sm mb-1 ${tier.popular ? "text-blue-200" : "text-muted"}`}>
                        {t("landing.pricing.per_month")}
                      </span>
                    </>
                  )}
                </div>
                <div
                  className={`text-sm ${tier.popular ? "text-blue-200" : "text-muted"}`}>
                  {t(tier.usersKey)}
                </div>
              </div>

              <p
                className={`text-sm mb-6 flex-1 ${tier.popular ? "text-blue-100" : "text-muted"}`}>
                {t(tier.descKey)}
              </p>

              <ul className="space-y-2.5 mb-8">
                {tier.features.map((featureKey) => (
                  <li
                    key={featureKey}
                    className="flex items-start gap-2.5 text-sm">
                    <svg
                      className={`w-4 h-4 mt-0.5 shrink-0 ${tier.popular ? "text-blue-200" : "text-emerald-500"}`}
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
                    <span
                      className={tier.popular ? "text-blue-100" : "text-muted"}>
                      {t(featureKey)}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register-company"
                className={`w-full py-3 rounded-xl font-semibold text-sm text-center transition-all ${
                  tier.popular
                    ? "bg-white text-brand hover:bg-blue-50"
                    : "bg-brand text-white hover:bg-brandDark"
                }`}>
                {t(tier.ctaKey)}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
