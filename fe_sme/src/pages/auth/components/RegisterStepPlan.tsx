import type { Dispatch, SetStateAction } from "react";
import { Spin } from "antd";
import type { BillingPlan } from "@/shared/types";
import { useLocale } from "@/i18n";

interface RegisterStepPlanProps {
  planList: BillingPlan[] | undefined;
  plansLoading: boolean;
  selectedPlanCode: string | null;
  setSelectedPlanCode: Dispatch<SetStateAction<string | null>>;
  billingCycle: "MONTHLY" | "YEARLY";
  setBillingCycle: Dispatch<SetStateAction<"MONTHLY" | "YEARLY">>;
  onClearError: () => void;
}

export const RegisterStepPlan = ({
  planList,
  plansLoading,
  selectedPlanCode,
  setSelectedPlanCode,
  billingCycle,
  setBillingCycle,
  onClearError,
}: RegisterStepPlanProps) => {
  const { t } = useLocale();

  if (plansLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Spin size="default" />
        <p className="text-[13px] text-muted">{t("register.plan.loading")}</p>
      </div>
    );
  }

  if (!planList?.length) {
    return (
      <p className="text-center text-[13px] text-muted py-8">
        {t("register.plan.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-full border border-stroke bg-white p-1">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
              billingCycle === "MONTHLY"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}>
            {t("register.plan.monthly")}
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("YEARLY")}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
              billingCycle === "YEARLY"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}>
            {t("register.plan.yearly")}
          </button>
        </div>
      </div>

      {/* Plan grid */}
      <div
        className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        role="listbox"
        aria-label={t("register.plan.list_label")}>
        {planList.map((plan, idx) => {
          const isSelected = selectedPlanCode === plan.code;
          const isRecommended = idx === 1 && planList.length >= 2;
          const displayPrice =
            billingCycle === "YEARLY" ? plan.priceYearly : plan.price;
          const periodLabel =
            billingCycle === "YEARLY"
              ? t("register.plan.per_year")
              : t("register.plan.per_month");

          return (
            <button
              key={plan.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => {
                setSelectedPlanCode(plan.code);
                onClearError();
              }}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-brand ring-2 ring-brand shadow-md"
                  : "border-stroke hover:border-ink/20 hover:shadow-sm"
              }`}>
              {isRecommended && (
                <span className="absolute right-4 top-4 rounded border border-stroke bg-white px-2 py-0.5 text-xs font-medium text-ink">
                  {t("register.plan.recommended")}
                </span>
              )}

              <h3 className="text-xl font-semibold text-ink">{plan.name}</h3>

              <p className="mt-2 text-2xl font-semibold text-ink">
                {displayPrice}
                <span className="text-sm font-normal text-muted ml-1">
                  {periodLabel}
                </span>
              </p>

              {plan.limits && (
                <p className="mt-1 text-sm text-muted">{plan.limits}</p>
              )}

              {plan.features.length > 0 && (
                <ul className="mt-6 flex-1 space-y-3 text-sm text-muted list-none p-0 m-0">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <p
                className={`mt-4 text-center text-sm font-medium ${
                  isSelected ? "text-brand" : "text-transparent"
                }`}
                aria-hidden={!isSelected}>
                {t("register.plan.selected")}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
