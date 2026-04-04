import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { Skeleton } from "antd";
import { CheckCircle2 } from "lucide-react";
import BaseButton from "@/components/button";
import BaseModal from "@core/components/Modal/BaseModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetPlans,
  apiGetSubscription,
  apiCreateSubscription,
  apiUpdateSubscription,
  apiGenerateInvoice,
} from "@/api/billing/billing.api";
import { extractList } from "@/api/core/types";
import { mapPlan, mapSubscription, formatVnd } from "@/utils/mappers/billing";
import { useUserStore } from "@/stores/user.store";
import { notify } from "@/utils/notify";
import { useLocale } from "@/i18n";
import type { Subscription, BillingPlan } from "../../shared/types";

const getCurrentPeriod = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 1);
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
};

const handleSuccess = async (
  res: Subscription | undefined,
  navigate: (path: string) => void,
  addToast: (msg: string) => void,
  queryClient: ReturnType<typeof useQueryClient>,
  setSelected: (v: string | null) => void,
  t: (key: string) => string,
) => {
  queryClient.invalidateQueries({ queryKey: ["subscription"] });
  queryClient.invalidateQueries({ queryKey: ["plans"] });
  setSelected(null);

  let invoiceId = res?.invoiceId;
  const subscriptionId = res?.subscriptionId;
  const prorateChargeVnd = res?.prorateChargeVnd ?? 0;

  if (!invoiceId && subscriptionId) {
    try {
      const { periodStart, periodEnd } = getCurrentPeriod();
      const gen = await apiGenerateInvoice(
        subscriptionId,
        periodStart,
        periodEnd,
      );
      invoiceId = (gen as { invoiceId?: string })?.invoiceId;
    } catch {
      /* backend may not support or invoice exists */
    }
  }

  if (invoiceId) {
    const amount = prorateChargeVnd > 0 ? formatVnd(prorateChargeVnd) : "0 ₫";
    navigate(
      `/billing/checkout/${invoiceId}?amount=${encodeURIComponent(amount)}`,
    );
    addToast(t("billing.plan.toast.complete_payment"));
  } else if (prorateChargeVnd > 0) {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    navigate("/billing/invoices");
    addToast(t("billing.plan.toast.invoice_created"));
  } else if (subscriptionId) {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    navigate("/billing/invoices");
    addToast(t("billing.plan.toast.subscription_created"));
  } else {
    addToast(t("billing.plan.toast.updated"));
  }
};

const BillingPlan = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);
  const currentTenant = useUserStore((s) => s.currentTenant);

  const { data, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => apiGetPlans(),
    select: (res: unknown) =>
      extractList(res, "plans", "items").map(mapPlan) as BillingPlan[],
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => apiGetSubscription(),
    select: (res: unknown) => mapSubscription(res),
  });

  const createSub = useMutation({
    mutationFn: (v: {
      companyId: string;
      planCode: string;
      billingCycle: string;
    }) => apiCreateSubscription(v.companyId, v.planCode, v.billingCycle),
  });
  const updateSub = useMutation({ mutationFn: apiUpdateSubscription });
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">(
    "MONTHLY",
  );

  const HIDDEN_PLANS = ["Basic Plan", "Premium Plan"];
  const plans = data?.filter((p) => !HIDDEN_PLANS.includes(p.name)) ?? [];
  const currentPlanCode = subscription?.planCode ?? "";
  const companyId = currentUser?.companyId ?? currentTenant?.id ?? "";

  const handleConfirm = () => {
    if (!selected) return;
    if (subscription && (subscription as Subscription).subscriptionId) {
      const sub = subscription as Subscription;
      updateSub.mutate(
        {
          subscriptionId: sub.subscriptionId,
          planCode: selected,
          billingCycle,
          status: "ACTIVE",
        },
        {
          onSuccess: (res) =>
            handleSuccess(
              res as Subscription,
              navigate,
              notify.info,
              queryClient,
              setSelected,
              t,
            ),
          onError: (err) => notify.error(`Failed: ${err.message}`),
        },
      );
    } else if (companyId) {
      createSub.mutate(
        { companyId: String(companyId), planCode: selected, billingCycle },
        {
          onSuccess: (res) =>
            handleSuccess(
              res as Subscription,
              navigate,
              notify.info,
              queryClient,
              setSelected,
              t,
            ),
          onError: (err) => notify.error(`Failed: ${err.message}`),
        },
      );
    } else {
      notify.warning(
        "No company selected. Please switch tenant or contact support.",
      );
    }
  };

  const isPending = createSub.isPending || updateSub.isPending;
  const selectedPlan = plans.find((p) => p.code === selected);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-ink">
          {t("billing.upgrade_plan")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("billing.choose_plan")}</p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={clsx(
              "rounded-lg px-5 py-2 text-sm font-medium transition-all",
              billingCycle === "MONTHLY"
                ? "bg-white text-ink shadow-sm"
                : "text-muted hover:text-ink",
            )}>
            {t("billing.cycle.monthly")}
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("YEARLY")}
            className={clsx(
              "rounded-lg px-5 py-2 text-sm font-medium transition-all",
              billingCycle === "YEARLY"
                ? "bg-white text-ink shadow-sm"
                : "text-muted hover:text-ink",
            )}>
            {t("billing.cycle.yearly")}
            <span className="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} active className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, index) => {
            const isCurrent = plan.code === currentPlanCode;
            const isRecommended = index === 1 && plans.length >= 2;
            const displayPrice =
              billingCycle === "YEARLY" && plan.priceYearly
                ? plan.priceYearly
                : plan.price;
            const isFree = plan.name.toLowerCase() === "free";

            return (
              <div
                key={plan.id}
                className={clsx(
                  "relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-md",
                  isCurrent
                    ? "border-brand/50 bg-brand/5 ring-1 ring-brand/20"
                    : "border-stroke bg-white",
                  isRecommended && !isCurrent && "border-brand/30",
                )}>
                {isRecommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
                    {t("billing.recommended")}
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                    <CheckCircle2 className="h-3 w-3" />
                    {t("billing.current_plan")}
                  </span>
                )}

                <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-ink">
                    {displayPrice}
                  </span>
                  <span className="ml-1 text-sm text-muted">
                    /
                    {billingCycle === "YEARLY"
                      ? t("billing.cycle.yearly").toLowerCase()
                      : t("billing.cycle.monthly").toLowerCase()}
                  </span>
                </div>
                {plan.employeeLimit > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    {t("billing.employee_limit").replace(
                      "{limit}",
                      String(plan.employeeLimit),
                    )}
                  </p>
                )}

                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-muted">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-stroke bg-slate-100 py-2.5 text-sm font-medium text-muted">
                      {t("billing.current_plan")}
                    </button>
                  ) : isFree ? (
                    <BaseButton
                      className="w-full"
                      onClick={() => setSelected(plan.code)}>
                      {plan.name}
                    </BaseButton>
                  ) : (
                    <BaseButton
                      type="primary"
                      className="w-full"
                      onClick={() => setSelected(plan.code)}>
                      {t("billing.upgrade_to").replace("{name}", plan.name)}
                    </BaseButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help link */}
      <p className="text-center text-sm text-muted">
        {t("billing.need_help")}{" "}
        <button
          type="button"
          className="font-medium text-ink underline hover:no-underline"
          onClick={() => {}}>
          {t("billing.contact_support")}
        </button>
      </p>

      {/* Confirm Modal */}
      <BaseModal
        open={!!selected}
        title={t("billing.plan_change")}
        onCancel={() => setSelected(null)}
        footer={null}>
        <div className="space-y-5">
          <div>
            <p className="text-ink">
              {t("billing.switch_to_plan").replace(
                "{name}",
                selectedPlan?.name ?? selected ?? "",
              )}
            </p>
            <p className="mt-1.5 text-sm text-muted">
              {t("billing.prorate_note")}
            </p>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <BaseButton onClick={() => setSelected(null)} disabled={isPending}>
              {t("billing.close")}
            </BaseButton>
            <BaseButton
              type="primary"
              disabled={isPending}
              onClick={handleConfirm}
              className="sm:min-w-[140px]">
              {isPending
                ? t("billing.processing")
                : t("billing.confirm_change")}
            </BaseButton>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};

export default BillingPlan;
