import { useRef, useState } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { clsx } from "clsx";
import { Empty, Skeleton } from "antd";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  Crown,
  Database,
  FileText,
  Layers3,
  Users,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import BaseButton from "@/components/button";
import BaseModal from "@core/components/Modal/BaseModal";
import {
  apiCreateSubscription,
  apiGetPlans,
  apiGetSubscription,
  apiUpdateSubscription,
} from "@/api/billing/billing.api";
import type { SubscriptionUpdateResponse } from "@/interface/billing";
import { extractList } from "@/api/core/types";
import {
  formatBytes,
  formatVnd,
  mapPlan,
  mapSubscription,
} from "@/utils/mappers/billing";
import { useUserStore } from "@/stores/user.store";
import { notify } from "@/utils/notify";
import { useLocale } from "@/i18n";
import type { BillingPlan, Subscription } from "@/shared/types";

// ─── Types ───────────────────────────────────────────────────

type BillingCycle = "MONTHLY" | "YEARLY";
type PlanAction = "upgrade" | "downgrade" | "new";

type StatusCfg = {
  label: string;
  className: string;
};

// ─── Helpers ─────────────────────────────────────────────────

function getPlanAction(
  selected: BillingPlan,
  currentPlan: BillingPlan | undefined,
  hasSubscription: boolean,
  billingCycle: BillingCycle,
): PlanAction {
  if (!hasSubscription || !currentPlan) return "new";

  const selectedPrice =
    billingCycle === "YEARLY" ? selected.priceYearlyRaw : selected.priceRaw;

  const currentPrice =
    billingCycle === "YEARLY"
      ? currentPlan.priceYearlyRaw
      : currentPlan.priceRaw;

  return selectedPrice >= currentPrice ? "upgrade" : "downgrade";
}

function getStatusCfg(
  rawStatus: string,
  t: (key: string) => string,
): StatusCfg {
  const map: Record<string, StatusCfg> = {
    ACTIVE: {
      label: t("billing.plan.status.active"),
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
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
      label: rawStatus || "-",
      className: "bg-slate-50 text-muted ring-slate-200",
    }
  );
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return "Unknown error";
};

const replaceText = (
  template: string,
  values: Record<string, string | number>,
) =>
  Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template,
  );

const getQuotaItems = (plan: BillingPlan, t: (key: string) => string) => [
  {
    key: "employee",
    icon: <Users className="h-4 w-4" />,
    label: t("billing.plan.employees_per_month"),
    value:
      plan.employeeLimit > 0
        ? String(plan.employeeLimit)
        : t("billing.plan.unlimited"),
  },
  {
    key: "onboarding_template",
    icon: <Layers3 className="h-4 w-4" />,
    label: t("billing.plan.onboarding_templates"),
    value:
      plan.onboardingTemplateLimit > 0
        ? String(plan.onboardingTemplateLimit)
        : t("billing.plan.unlimited"),
  },
  {
    key: "event_template",
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: t("billing.plan.event_templates"),
    value:
      plan.eventTemplateLimit > 0
        ? String(plan.eventTemplateLimit)
        : t("billing.plan.unlimited"),
  },
  {
    key: "document",
    icon: <FileText className="h-4 w-4" />,
    label: t("billing.plan.documents"),
    value:
      plan.documentLimit > 0
        ? String(plan.documentLimit)
        : t("billing.plan.unlimited"),
  },
  {
    key: "storage",
    icon: <Database className="h-4 w-4" />,
    label: t("billing.plan.storage"),
    value:
      plan.storageLimitText ||
      (plan.storageLimitBytes > 0
        ? formatBytes(plan.storageLimitBytes)
        : t("billing.plan.unlimited")),
  },
];

const refreshBillingQueries = async (queryClient: QueryClient) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["subscription"] }),
    queryClient.invalidateQueries({ queryKey: ["plans"] }),
    queryClient.invalidateQueries({ queryKey: ["invoices"] }),
    queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] }),
    queryClient.invalidateQueries({ queryKey: ["billing", "plans", "ACTIVE"] }),
    queryClient.invalidateQueries({
      queryKey: ["billing", "subscription-plan-timeline"],
    }),
  ]);

  await Promise.all([
    queryClient.refetchQueries({
      queryKey: ["subscription"],
      type: "active",
    }),
    queryClient.refetchQueries({
      queryKey: ["plans"],
      type: "active",
    }),
    queryClient.refetchQueries({
      queryKey: ["billing", "subscription"],
      type: "active",
    }),
    queryClient.refetchQueries({
      queryKey: ["billing", "plans", "ACTIVE"],
      type: "active",
    }),
  ]);
};

const handleSuccess = async (
  res: SubscriptionUpdateResponse | undefined,
  navigate: NavigateFunction,
  addToast: (msg: string) => void,
  queryClient: QueryClient,
  setSelected: (value: string | null) => void,
  t: (key: string) => string,
) => {
  setSelected(null);

  await refreshBillingQueries(queryClient);

  if (res?.paymentRequired && res?.paymentInvoiceId) {
    const amount = res.prorateChargeVnd
      ? formatVnd(res.prorateChargeVnd)
      : "0 ₫";

    navigate(
      `/billing/checkout/${res.paymentInvoiceId}?amount=${encodeURIComponent(
        amount,
      )}`,
    );

    addToast(t("billing.plan.toast.complete_payment"));
    return;
  }

  addToast(t("billing.plan.toast.updated"));

  navigate("/billing/plan", { replace: true });
};

// ─── Components ──────────────────────────────────────────────

const CurrentSubscriptionSummary = ({
  subscription,
  currentPlan,
  pendingPlan,
  t,
}: {
  subscription?: Subscription;
  currentPlan?: BillingPlan;
  pendingPlan?: BillingPlan;
  t: (key: string) => string;
}) => {
  if (!subscription && !currentPlan) return null;

  const quotaItems = currentPlan ? getQuotaItems(currentPlan, t) : [];
  const subStatusCfg = getStatusCfg(subscription?.status ?? "", t);

  return (
    <div className="overflow-hidden rounded-[28px] border border-blue-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-blue-50 via-white to-sky-50 px-6 py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {t("billing.plan.current_subscription")}
              </span>

              {subscription?.status ? (
                <span
                  className={clsx(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                    subStatusCfg.className,
                  )}
                >
                  {subStatusCfg.label}
                </span>
              ) : null}

              {subscription?.billingCycle ? (
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  {subscription.billingCycle === "YEARLY"
                    ? t("billing.cycle.yearly")
                    : t("billing.cycle.monthly")}
                </span>
              ) : null}

              {subscription?.pendingPlanCode ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                  Pending: {pendingPlan?.name || subscription.pendingPlanCode}
                </span>
              ) : null}
            </div>

            <h2 className="text-3xl font-bold leading-tight text-slate-900">
              {currentPlan?.name ||
                subscription?.planName ||
                subscription?.planCode ||
                "-"}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              <span>
                {t("billing.plan.plan_code")}:{" "}
                <span className="font-semibold text-slate-900">
                  {subscription?.planCode || currentPlan?.code || "-"}
                </span>
              </span>

              {subscription?.currentPeriodEnd ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  {t("billing.plan.renews")}{" "}
                  <span className="font-semibold text-slate-900">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                      "vi-VN",
                    )}
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          {quotaItems.length > 0 ? (
            <div className="flex flex-wrap justify-start gap-2 xl:max-w-[58%] xl:justify-end">
              {quotaItems.map((item) => (
                <div
                  key={item.key}
                  className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-700 ring-1 ring-slate-200 shadow-sm"
                >
                  {item.label}:{" "}
                  <span className="font-semibold text-slate-900">
                    {item.value}
                  </span>
                </div>
              ))}

              <div className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
                {t("billing.current_plan")}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const PlanCard = ({
  plan,
  isCurrent,
  hasSubscription,
  currentPlan,
  billingCycle,
  onSelect,
  t,
}: {
  plan: BillingPlan;
  isCurrent: boolean;
  hasSubscription: boolean;
  currentPlan?: BillingPlan;
  billingCycle: BillingCycle;
  onSelect: (planCode: string) => void;
  t: (key: string) => string;
}) => {
  const quotaItems = getQuotaItems(plan, t);
  const action = getPlanAction(
    plan,
    currentPlan,
    hasSubscription,
    billingCycle,
  );

  const displayPrice =
    billingCycle === "YEARLY" && plan.priceYearlyRaw > 0
      ? plan.priceYearly
      : plan.price;

  const buttonLabel = isCurrent
    ? t("billing.current_plan")
    : !hasSubscription
      ? t("billing.plan.get_started")
      : action === "upgrade"
        ? replaceText(t("billing.upgrade_to"), { name: plan.name })
        : replaceText(t("billing.downgrade_to"), { name: plan.name });

  const buttonClass = isCurrent
    ? "cursor-not-allowed border border-emerald-200 bg-emerald-50 text-emerald-700"
    : action === "upgrade" || !hasSubscription
      ? "!border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
      : "!border-slate-300 !bg-white !text-slate-700 hover:!border-slate-400 hover:!bg-slate-50";

  return (
    <div
      className={clsx(
        "flex h-full flex-col overflow-hidden rounded-[28px] border bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.10)]",
        isCurrent
          ? "border-blue-300 bg-blue-50/30 ring-2 ring-blue-100"
          : "border-slate-200",
        plan.recommended && !isCurrent && "border-blue-300",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={clsx(
              "rounded-2xl p-3",
              isCurrent
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-700",
            )}
          >
            <Crown className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-[22px] font-bold leading-tight text-slate-900">
              {plan.name}
            </h3>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
              {plan.code}
            </p>
          </div>
        </div>

        {isCurrent ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {t("billing.current_plan")}
          </span>
        ) : plan.recommended ? (
          <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {t("billing.recommended")}
          </span>
        ) : null}
      </div>

      <div className="mt-6 min-h-[86px]">
        <div className="flex flex-wrap items-end gap-2">
          <p className="text-[40px] font-bold leading-none tracking-tight text-slate-900">
            {displayPrice}
          </p>

          <span className="pb-1 text-base font-medium text-slate-500">
            /
            {billingCycle === "YEARLY"
              ? t("billing.cycle.yearly").toLowerCase()
              : t("billing.cycle.monthly").toLowerCase()}
          </span>
        </div>

        {billingCycle === "MONTHLY" && plan.priceYearlyRaw > 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            {replaceText(t("billing.yearly_price"), {
              price: plan.priceYearly,
            })}
          </p>
        ) : plan.priceYearlyRaw > 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            {t("billing.plan.yearly_plan")}:{" "}
            <span className="font-medium text-slate-700">
              {plan.priceYearly}
            </span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-transparent">-</p>
        )}
      </div>

      <div className="mt-5 rounded-[24px] border border-slate-100 bg-slate-50/80 p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {t("billing.plan.usage_limits")}
        </p>

        <div className="space-y-3">
          {quotaItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2.5 text-slate-600">
                <span className="shrink-0 text-slate-500">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </span>

              <span className="shrink-0 font-semibold text-slate-900">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-5">
        {isCurrent ? (
          <button
            type="button"
            disabled
            className={clsx(
              "h-11 w-full rounded-2xl text-sm font-semibold shadow-sm",
              buttonClass,
            )}
          >
            {buttonLabel}
          </button>
        ) : (
          <BaseButton
            type={
              action === "upgrade" || !hasSubscription ? "primary" : "default"
            }
            className={clsx(
              "h-11 w-full rounded-2xl text-sm font-semibold shadow-sm transition-all",
              buttonClass,
            )}
            onClick={() => onSelect(plan.code)}
          >
            {buttonLabel}
          </BaseButton>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────

const BillingPlan = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);
  const currentTenant = useUserStore((state) => state.currentTenant);
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState<string | null>(null);
  const [billingCycleOverride, setBillingCycleOverride] =
    useState<BillingCycle | null>(null);
  /** Synchronous guard — blocks double click before isPending re-renders. */
  const planChangeConfirmLockRef = useRef(false);

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

  const companyId = currentUser?.companyId ?? currentTenant?.id ?? "";

  const createSub = useMutation({
    mutationFn: (payload: {
      companyId: string;
      planCode: string;
      billingCycle: string;
    }) =>
      apiCreateSubscription(
        payload.companyId,
        payload.planCode,
        payload.billingCycle,
      ),
  });

  const updateSub = useMutation({
    mutationFn: apiUpdateSubscription,
  });

  const currentPlanCode = subscription?.planCode ?? "";
  const hasSubscription = Boolean(subscription?.subscriptionId);

  const currentPlanObj = plans.find((plan) => plan.code === currentPlanCode);
  const pendingPlanObj = plans.find(
    (plan) => plan.code === subscription?.pendingPlanCode,
  );
  const selectedPlan = plans.find((plan) => plan.code === selected);

  const subscriptionBillingCycle: BillingCycle =
    subscription?.billingCycle === "YEARLY" ||
    subscription?.billingCycle === "MONTHLY"
      ? subscription.billingCycle
      : "MONTHLY";

  const billingCycle: BillingCycle =
    billingCycleOverride ?? subscriptionBillingCycle;

  const isPending = createSub.isPending || updateSub.isPending;

  const order = ["FREE", "BASIC", "PRO", "BUSINESS", "ENTERPRISE"];

  const orderedPlans = plans.slice().sort((a, b) => {
    const aIndex = order.indexOf(a.code.toUpperCase());
    const bIndex = order.indexOf(b.code.toUpperCase());

    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  const modalAction: PlanAction = selectedPlan
    ? getPlanAction(selectedPlan, currentPlanObj, hasSubscription, billingCycle)
    : "new";

  const modalTitle = selectedPlan
    ? modalAction === "new"
      ? replaceText(t("billing.plan.modal.new_title"), {
          name: selectedPlan.name,
        })
      : modalAction === "upgrade"
        ? replaceText(t("billing.plan.modal.upgrade_title"), {
            name: selectedPlan.name,
          })
        : replaceText(t("billing.plan.modal.downgrade_title"), {
            name: selectedPlan.name,
          })
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

  const handleConfirm = () => {
    if (!selected) return;
    if (isPending || planChangeConfirmLockRef.current) return;
    planChangeConfirmLockRef.current = true;

    if (subscription?.subscriptionId) {
      updateSub.mutate(
        {
          subscriptionId: subscription.subscriptionId,
          planCode: selected,
          billingCycle,
          status: "ACTIVE",
        },
        {
          onSuccess: async (res) => {
            await handleSuccess(
              res,
              navigate,
              notify.info,
              queryClient,
              setSelected,
              t,
            );
          },
          onError: (error) => notify.error(`Failed: ${getErrorMessage(error)}`),
          onSettled: () => {
            planChangeConfirmLockRef.current = false;
          },
        },
      );

      return;
    }

    if (companyId) {
      createSub.mutate(
        {
          companyId: String(companyId),
          planCode: selected,
          billingCycle,
        },
        {
          onSuccess: async (res) => {
            await handleSuccess(
              res as SubscriptionUpdateResponse | undefined,
              navigate,
              notify.info,
              queryClient,
              setSelected,
              t,
            );
          },
          onError: (error) => notify.error(`Failed: ${getErrorMessage(error)}`),
          onSettled: () => {
            planChangeConfirmLockRef.current = false;
          },
        },
      );

      return;
    }

    planChangeConfirmLockRef.current = false;
    notify.warning(
      "No company selected. Please switch tenant or contact support.",
    );
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight text-slate-900">
          {t("billing.plan.title")}
        </h1>

        <p className="mt-2 text-base text-slate-600">
          {t("billing.plan.subtitle")}
        </p>
      </div>

      {!isLoading && hasSubscription ? (
        <CurrentSubscriptionSummary
          subscription={subscription}
          currentPlan={currentPlanObj}
          pendingPlan={pendingPlanObj}
          t={t}
        />
      ) : null}

      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycleOverride("MONTHLY")}
            className={clsx(
              "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
              billingCycle === "MONTHLY"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            {t("billing.cycle.monthly")}
          </button>

          <button
            type="button"
            onClick={() => setBillingCycleOverride("YEARLY")}
            className={clsx(
              "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
              billingCycle === "YEARLY"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            )}
          >
            {t("billing.cycle.yearly")}
            <span
              className={clsx(
                "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                billingCycle === "YEARLY"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-100 text-emerald-700",
              )}
            >
              -17%
            </span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} active className="h-80 rounded-[28px]" />
          ))}
        </div>
      ) : orderedPlans.length === 0 ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <Empty description={t("billing.plan.no_plans")} />
        </div>
      ) : (
        <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
          {orderedPlans.map((plan) => (
            <PlanCard
              key={plan.id || plan.code}
              plan={plan}
              isCurrent={plan.code === currentPlanCode}
              hasSubscription={hasSubscription}
              currentPlan={currentPlanObj}
              billingCycle={billingCycle}
              onSelect={setSelected}
              t={t}
            />
          ))}
        </div>
      )}

      <p className="text-center text-sm text-slate-500">
        {t("billing.need_help")}{" "}
        <button
          type="button"
          className="font-semibold text-blue-600 underline-offset-4 hover:underline"
          onClick={() => {}}
        >
          {t("billing.contact_support")}
        </button>
      </p>

      <BaseModal
        open={Boolean(selected)}
        title={modalTitle}
        onCancel={() => setSelected(null)}
        footer={null}
      >
        <div className="space-y-4">
          {hasSubscription && currentPlanObj && selectedPlan ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {t("billing.plan.modal.from")}
                </p>
                <p className="mt-1 truncate text-base font-semibold text-slate-900">
                  {currentPlanObj.name}
                </p>
                <p className="text-sm text-slate-500">{currentDisplayPrice}</p>
              </div>

              <ArrowRight className="h-5 w-5 shrink-0 text-slate-400" />

              <div className="min-w-0 flex-1 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {t("billing.plan.modal.to")}
                </p>
                <p className="mt-1 truncate text-base font-semibold text-slate-900">
                  {selectedPlan.name}
                </p>
                <p className="text-sm text-slate-500">{selectedDisplayPrice}</p>
              </div>
            </div>
          ) : null}

          <div
            className={clsx(
              "flex items-start gap-3 rounded-2xl px-4 py-3 text-sm",
              modalAction === "upgrade" || modalAction === "new"
                ? "bg-blue-50 text-blue-800"
                : "bg-amber-50 text-amber-800",
            )}
          >
            {modalAction === "upgrade" || modalAction === "new" ? (
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{modalNote}</span>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <BaseButton
              onClick={() => setSelected(null)}
              disabled={isPending}
              className="h-10 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              {t("billing.close")}
            </BaseButton>

            <BaseButton
              type="primary"
              disabled={isPending}
              onClick={handleConfirm}
              className="h-10 rounded-xl !border-blue-600 !bg-blue-600 px-5 font-semibold text-white hover:!border-blue-700 hover:!bg-blue-700"
            >
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
