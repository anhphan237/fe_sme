import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { Skeleton } from "antd";
import {
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  CreditCard,
  Calendar,
  Users,
} from "lucide-react";
import BaseButton from "@/components/button";
import BaseModal from "@core/components/Modal/BaseModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetPlans,
  apiGetSubscription,
  apiCreateSubscription,
  apiUpdateSubscription,
} from "@/api/billing/billing.api";
import type { SubscriptionUpdateResponse } from "@/interface/billing";
import { extractList } from "@/api/core/types";
import { mapPlan, mapSubscription, formatVnd } from "@/utils/mappers/billing";
import { useUserStore } from "@/stores/user.store";
import { notify } from "@/utils/notify";
import { useLocale } from "@/i18n";
import type { Subscription, BillingPlan } from "../../shared/types";

// ─── Types ───────────────────────────────────────────────────

type PlanAction = "upgrade" | "downgrade" | "new";

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Determine whether selecting a plan is an upgrade, downgrade, or new subscription.
 * Comparison is based on raw price for the selected billing cycle.
 */
function getPlanAction(
  selected: BillingPlan,
  currentPlan: BillingPlan | undefined,
  hasSubscription: boolean,
  billingCycle: "MONTHLY" | "YEARLY",
): PlanAction {
  if (!hasSubscription || !currentPlan) return "new";
  const sp =
    billingCycle === "YEARLY" ? selected.priceYearlyRaw : selected.priceRaw;
  const cp =
    billingCycle === "YEARLY"
      ? currentPlan.priceYearlyRaw
      : currentPlan.priceRaw;
  return sp >= cp ? "upgrade" : "downgrade";
}

type StatusCfg = { label: string; className: string };

function getStatusCfg(rawStatus: string, t: (k: string) => string): StatusCfg {
  const map: Record<string, StatusCfg> = {
    ACTIVE: {
      label: t("billing.plan.status.active"),
      className: "bg-green-50 text-green-700 ring-green-200",
    },
    PAST_DUE: {
      label: t("billing.plan.status.past_due"),
      className: "bg-orange-50 text-orange-700 ring-orange-200",
    },
    TRIALING: {
      label: t("billing.plan.status.trialing"),
      className: "bg-blue-50 text-blue-700 ring-blue-200",
    },
    CANCELLED: {
      label: t("billing.plan.status.cancelled"),
      className: "bg-red-50 text-red-700 ring-red-200",
    },
  };
  return (
    map[rawStatus.toUpperCase()] ?? {
      label: rawStatus,
      className: "bg-slate-50 text-muted ring-slate-200",
    }
  );
}

const handleSuccess = (
  res: SubscriptionUpdateResponse | undefined,
  navigate: (path: string) => void,
  addToast: (msg: string) => void,
  queryClient: ReturnType<typeof useQueryClient>,
  setSelected: (v: string | null) => void,
  t: (key: string) => string,
) => {
  queryClient.invalidateQueries({ queryKey: ["subscription"] });
  queryClient.invalidateQueries({ queryKey: ["plans"] });
  setSelected(null);

  // Paid upgrade → redirect to checkout
  if (res?.paymentRequired && res?.paymentInvoiceId) {
    const amount = res.prorateChargeVnd
      ? formatVnd(res.prorateChargeVnd)
      : "0 ₫";
    navigate(
      `/billing/checkout/${res.paymentInvoiceId}?amount=${encodeURIComponent(amount)}`,
    );
    addToast(t("billing.plan.toast.complete_payment"));
    return;
  }

  // Free change or downgrade → applied immediately
  queryClient.invalidateQueries({ queryKey: ["invoices"] });
  navigate("/billing/invoices");
  addToast(
    res?.subscriptionId
      ? t("billing.plan.toast.subscription_created")
      : t("billing.plan.toast.updated"),
  );
};

// ─── Component ───────────────────────────────────────────────

const BillingPlan = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);
  const currentTenant = useUserStore((s) => s.currentTenant);
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">(
    "MONTHLY",
  );

  // Fetch only ACTIVE plans — let backend control visibility
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => apiGetPlans("ACTIVE"),
    select: (res: unknown) =>
      extractList(res, "plans", "items").map(mapPlan) as BillingPlan[],
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => apiGetSubscription(),
    select: (res: unknown) => mapSubscription(res) as Subscription,
  });

  // Sync billing cycle toggle to match the current active subscription
  useEffect(() => {
    if (subscription?.billingCycle) {
      setBillingCycle(subscription.billingCycle as "MONTHLY" | "YEARLY");
    }
  }, [subscription?.billingCycle]);

  const createSub = useMutation({
    mutationFn: (v: {
      companyId: string;
      planCode: string;
      billingCycle: string;
    }) => apiCreateSubscription(v.companyId, v.planCode, v.billingCycle),
  });
  const updateSub = useMutation({ mutationFn: apiUpdateSubscription });

  const companyId = currentUser?.companyId ?? currentTenant?.id ?? "";
  const currentPlanCode = subscription?.planCode ?? "";
  const hasSubscription = !!(subscription as Subscription | undefined)
    ?.subscriptionId;
  const currentPlanObj = plans.find((p) => p.code === currentPlanCode);
  const selectedPlan = plans.find((p) => p.code === selected);
  const isPending = createSub.isPending || updateSub.isPending;

  const handleConfirm = () => {
    if (!selected) return;
    const sub = subscription as Subscription | undefined;

    if (sub?.subscriptionId) {
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
              res,
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
              res as SubscriptionUpdateResponse | undefined,
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

  // ── Modal derived values ──────────────────────────────────
  const modalAction: PlanAction = selectedPlan
    ? getPlanAction(selectedPlan, currentPlanObj, hasSubscription, billingCycle)
    : "new";

  const modalTitle = selectedPlan
    ? modalAction === "new"
      ? t("billing.plan.modal.new_title").replace("{name}", selectedPlan.name)
      : modalAction === "upgrade"
        ? t("billing.plan.modal.upgrade_title").replace(
            "{name}",
            selectedPlan.name,
          )
        : t("billing.plan.modal.downgrade_title").replace(
            "{name}",
            selectedPlan.name,
          )
    : "";

  const modalNote =
    modalAction === "new"
      ? t("billing.plan.modal.new_note")
      : modalAction === "upgrade"
        ? t("billing.plan.modal.upgrade_note")
        : t("billing.plan.modal.downgrade_note");

  const currentDisplayPrice = currentPlanObj
    ? billingCycle === "YEARLY"
      ? currentPlanObj.priceYearly
      : currentPlanObj.price
    : "—";

  const selectedDisplayPrice = selectedPlan
    ? billingCycle === "YEARLY"
      ? selectedPlan.priceYearly
      : selectedPlan.price
    : "—";

  const subStatusCfg = getStatusCfg(subscription?.status ?? "", t);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Current subscription summary — only shown when active */}
      {hasSubscription && subscription && (
        <div className="rounded-2xl border border-stroke bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold text-ink">
                  {currentPlanObj?.name ?? currentPlanCode}
                </span>
                <span
                  className={clsx(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
                    subStatusCfg.className,
                  )}>
                  {subStatusCfg.label}
                </span>
                {subscription.billingCycle && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-muted">
                    {subscription.billingCycle === "YEARLY"
                      ? t("billing.cycle.yearly")
                      : t("billing.cycle.monthly")}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {subscription.currentPeriodEnd && (
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {t("billing.plan.renews")}{" "}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                      "vi-VN",
                    )}
                  </p>
                )}
                {currentPlanObj && currentPlanObj.employeeLimit > 0 && (
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    {t("billing.employee_limit").replace(
                      "{limit}",
                      String(currentPlanObj.employeeLimit),
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing cycle toggle */}
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

      {/* Plan cards */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} active className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.code === currentPlanCode;
            const displayPrice =
              billingCycle === "YEARLY" && plan.priceYearlyRaw > 0
                ? plan.priceYearly
                : plan.price;
            const action = getPlanAction(
              plan,
              currentPlanObj,
              hasSubscription,
              billingCycle,
            );
            const buttonLabel = isCurrent
              ? t("billing.current_plan")
              : !hasSubscription
                ? t("billing.plan.get_started")
                : action === "upgrade"
                  ? t("billing.upgrade_to").replace("{name}", plan.name)
                  : t("billing.downgrade_to").replace("{name}", plan.name);

            return (
              <div
                key={plan.id}
                className={clsx(
                  "relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-md",
                  isCurrent
                    ? "border-brand/50 bg-brand/5 ring-1 ring-brand/20"
                    : "border-stroke bg-white",
                  plan.recommended && !isCurrent && "border-brand/30",
                )}>
                {/* Recommended badge — driven by backend data */}
                {plan.recommended && !isCurrent && (
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

                {/* Show yearly saving hint when viewing monthly price */}
                {billingCycle === "MONTHLY" && plan.priceYearlyRaw > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    {t("billing.yearly_price").replace(
                      "{price}",
                      plan.priceYearly,
                    )}
                  </p>
                )}

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
                  ) : (
                    <BaseButton
                      type={
                        action === "upgrade" || !hasSubscription
                          ? "primary"
                          : "default"
                      }
                      className="w-full"
                      onClick={() => setSelected(plan.code)}>
                      {buttonLabel}
                    </BaseButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help */}
      <p className="text-center text-sm text-muted">
        {t("billing.need_help")}{" "}
        <button
          type="button"
          className="font-medium text-ink underline hover:no-underline"
          onClick={() => {}}>
          {t("billing.contact_support")}
        </button>
      </p>

      {/* Confirm modal */}
      <BaseModal
        open={!!selected}
        title={modalTitle}
        onCancel={() => setSelected(null)}
        footer={null}>
        <div className="space-y-4">
          {/* Plan comparison: old → new */}
          {hasSubscription && currentPlanObj && selectedPlan && (
            <div className="flex items-center gap-3 rounded-xl border border-stroke bg-slate-50 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("billing.plan.modal.from")}
                </p>
                <p className="mt-0.5 truncate font-semibold text-ink">
                  {currentPlanObj.name}
                </p>
                <p className="text-sm text-muted">{currentDisplayPrice}</p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-muted" />
              <div className="min-w-0 flex-1 text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t("billing.plan.modal.to")}
                </p>
                <p className="mt-0.5 truncate font-semibold text-ink">
                  {selectedPlan.name}
                </p>
                <p className="text-sm text-muted">{selectedDisplayPrice}</p>
              </div>
            </div>
          )}

          {/* Contextual billing note: upgrade vs downgrade vs new */}
          <div
            className={clsx(
              "flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm",
              modalAction === "upgrade" || modalAction === "new"
                ? "bg-blue-50 text-blue-800"
                : "bg-amber-50 text-amber-800",
            )}>
            {modalAction === "upgrade" || modalAction === "new" ? (
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{modalNote}</span>
          </div>

          {/* Actions */}
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
