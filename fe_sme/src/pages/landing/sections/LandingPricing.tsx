import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import { PRICING_TIERS } from "../landing.constants";
import { apiGetPlans } from "@/api/billing/billing.api";
import type { PlanSummaryResponse } from "@/interface/billing";

function formatVnd(amount: number | null | undefined): string {
  if (!amount) return "";
  return amount.toLocaleString("vi-VN") + " \u20ab";
}

function PricingCardSkeleton() {
  return (
    <div className="rounded-2xl p-6 flex flex-col border border-stroke animate-pulse">
      <div className="mb-4 space-y-2">
        <div className="h-3 w-16 bg-slate-200 rounded" />
        <div className="h-8 w-28 bg-slate-200 rounded" />
        <div className="h-3 w-20 bg-slate-100 rounded" />
      </div>
      <div className="h-4 w-full bg-slate-100 rounded mb-1" />
      <div className="h-4 w-3/4 bg-slate-100 rounded mb-6" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-3 w-full bg-slate-100 rounded mb-2" />
      ))}
      <div className="mt-auto h-10 w-full bg-slate-200 rounded-xl" />
    </div>
  );
}

export default function LandingPricing() {
  const { t } = useLocale();
  const [yearly, setYearly] = useState(false);

  const { data: planApiData, isPending } = useQuery({
    queryKey: ["public-plans"],
    queryFn: () => apiGetPlans("ACTIVE"),
    staleTime: 5 * 60_000,
    retry: false,
    // API requires auth — fail silently and fall back to static PRICING_TIERS
    throwOnError: false,
  });

  const apiPlanMap = new Map<string, PlanSummaryResponse>(
    (planApiData?.plans ?? []).map((p) => [p.code, p]),
  );

  const tiers = PRICING_TIERS.map((tier) => {
    const tt = tier as typeof tier & { code?: string; isContact?: boolean };
    if (tt.isContact) return tier;
    const apiPlan = apiPlanMap.get(tt.code ?? "");
    if (!apiPlan) return tier;
    return {
      ...tier,
      monthlyPrice: formatVnd(apiPlan.priceVndMonthly),
      yearlyPrice: formatVnd(apiPlan.priceVndYearly),
    };
  });

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
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${!yearly ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"}`}>
              {t("landing.pricing.monthly")}
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${yearly ? "bg-white shadow-sm text-ink" : "text-muted hover:text-ink"}`}>
              {t("landing.pricing.yearly")}
              <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded font-semibold">
                {t("landing.pricing.yearly_save")}
              </span>
            </button>
          </div>
        </div>

        {isPending ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_TIERS.map((tier) => (
              <PricingCardSkeleton key={tier.code} />
            ))}
          </div>
        ) : null}

        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${isPending ? "hidden" : ""}`}>
          {tiers.map((tier) => {
            const isContact =
              "isContact" in tier &&
              (tier as typeof tier & { isContact?: boolean }).isContact;
            const price = yearly ? tier.yearlyPrice : tier.monthlyPrice;
            return (
              <div
                key={tier.nameKey}
                className={`relative rounded-2xl p-6 flex flex-col ${tier.popular ? "bg-gradient-to-b from-brand to-blue-700 text-white shadow-2xl shadow-blue-200 scale-105" : "bg-white border border-stroke"}`}>
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
                    {isContact ? (
                      <span
                        className={`font-serif text-3xl font-bold ${tier.popular ? "text-white" : "text-ink"}`}>
                        {t("landing.pricing.contact")}
                      </span>
                    ) : (
                      <>
                        <span
                          className={`font-serif text-3xl font-bold leading-none ${tier.popular ? "text-white" : "text-ink"}`}>
                          {price || t("landing.pricing.free")}
                        </span>
                        {price && (
                          <span
                            className={`text-sm mb-0.5 ${tier.popular ? "text-blue-200" : "text-muted"}`}>
                            {yearly
                              ? t("landing.pricing.per_year")
                              : t("landing.pricing.per_month")}
                          </span>
                        )}
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
                        className={
                          tier.popular ? "text-blue-100" : "text-muted"
                        }>
                        {t(featureKey)}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register-company"
                  className={`w-full py-3 rounded-xl font-semibold text-sm text-center transition-all ${tier.popular ? "bg-white text-brand hover:bg-blue-50" : "bg-brand text-white hover:bg-brandDark"}`}>
                  {t(tier.ctaKey)}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
