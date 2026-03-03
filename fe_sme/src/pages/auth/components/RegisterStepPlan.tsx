import type { Dispatch, SetStateAction } from "react";
import type { BillingPlan } from "@/shared/types";
import { useLocale } from "@/i18n";

interface RegisterStepPlanProps {
  planList: BillingPlan[] | undefined;
  plansLoading: boolean;
  selectedPlanCode: string | null;
  setSelectedPlanCode: Dispatch<SetStateAction<string | null>>;
  onClearError: () => void;
}

export function RegisterStepPlan({
  planList,
  plansLoading,
  selectedPlanCode,
  setSelectedPlanCode,
  onClearError,
}: RegisterStepPlanProps) {
  const { t } = useLocale();

  if (plansLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <svg
          className="w-6 h-6 animate-spin text-brand"
          viewBox="0 0 24 24"
          fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeOpacity=".25"
          />
          <path
            d="M12 2a10 10 0 0110 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-[13px] text-gray-400">
          {t("register.plan.loading")}
        </p>
      </div>
    );
  }

  if (!planList?.length) {
    return (
      <p className="text-center text-[13px] text-gray-400 py-8">
        {t("register.plan.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {planList.map((plan, idx) => {
        const isSelected = selectedPlanCode === plan.code;
        const isRecommended = idx === 1 && planList.length >= 2;

        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => {
              setSelectedPlanCode(plan.code);
              onClearError();
            }}
            className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
              isSelected
                ? "border-brand bg-brand/5 shadow-sm shadow-brand/10"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[15px] font-bold text-gray-900">
                    {plan.name}
                  </span>
                  {isRecommended && (
                    <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {t("register.plan.recommended")}
                    </span>
                  )}
                </div>
                <p className="text-[18px] font-bold text-gray-900">
                  {plan.price}
                  <span className="text-[12px] font-normal text-gray-400 ml-1">
                    {t("register.plan.per_month")}
                  </span>
                </p>
                <ul className="mt-2 space-y-1">
                  {plan.features.slice(0, 2).map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-1.5 text-[12px] text-gray-500">
                      <svg
                        className="w-3 h-3 text-emerald-500 shrink-0"
                        viewBox="0 0 12 12"
                        fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  isSelected ? "border-brand bg-brand" : "border-gray-300"
                }`}>
                {isSelected && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    viewBox="0 0 10 10"
                    fill="none">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
