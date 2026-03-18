import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import { Skeleton } from "antd";
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
import { mapPlan, mapSubscription } from "@/utils/mappers/billing";
import { useUserStore } from "@/stores/user.store";
import { notify } from "@/utils/notify";
import type { Subscription, BillingPlan } from "../../shared/types";

const usePlansQuery = () =>
  useQuery({
    queryKey: ["plans"],
    queryFn: () => apiGetPlans(),
    select: (res: unknown) =>
      extractList(res, "plans", "items").map(mapPlan) as BillingPlan[],
  });
const useSubscriptionQuery = () =>
  useQuery({
    queryKey: ["subscription"],
    queryFn: () => apiGetSubscription(),
    select: (res: unknown) => mapSubscription(res),
  });
const useCreateSubscription = () =>
  useMutation({
    mutationFn: (v: { companyId: string; planCode: string }) =>
      apiCreateSubscription(v.companyId, v.planCode),
  });
const useUpdateSubscription = () =>
  useMutation({ mutationFn: apiUpdateSubscription });

const formatVnd = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

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
    addToast("Please complete payment.");
  } else if (prorateChargeVnd > 0) {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    navigate("/billing/invoices");
    addToast("Invoice created. Please pay the prorate amount.");
  } else if (subscriptionId) {
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    navigate("/billing/invoices");
    addToast("Subscription created. Check Invoices and pay when ready.");
  } else {
    addToast("Plan updated successfully.");
  }
};

const BillingPlan = () => {
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);
  const currentTenant = useUserStore((s) => s.currentTenant);
  const { data, isLoading } = usePlansQuery();
  const { data: subscription } = useSubscriptionQuery();
  const createSub = useCreateSubscription();
  const updateSub = useUpdateSubscription();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

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
            ),
          onError: (err) => notify.error(`Failed: ${err.message}`),
        },
      );
    } else if (companyId) {
      createSub.mutate(
        { companyId: String(companyId), planCode: selected },
        {
          onSuccess: (res) =>
            handleSuccess(
              res as Subscription,
              navigate,
              notify.info,
              queryClient,
              setSelected,
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

  return (
    <div className="space-y-6">
      <h1 className="text-center text-2xl font-semibold text-ink">
        Upgrade your plan
      </h1>
      <p className="text-center text-sm text-muted">
        Choose the plan that fits your onboarding volume.
      </p>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, index) => {
            const isCurrent = plan.code === currentPlanCode;
            const isRecommended = index === 1 && plans.length >= 2;
            return (
              <div
                key={plan.id}
                className={clsx(
                  "relative flex flex-col rounded-2xl border border-stroke bg-white p-6",
                  isCurrent && "border-ink",
                )}>
                {isRecommended && (
                  <span className="absolute right-4 top-4 rounded border border-stroke bg-white px-2 py-0.5 text-xs font-medium text-ink">
                    RECOMMENDED
                  </span>
                )}
                <h3 className="text-xl font-semibold text-ink">{plan.name}</h3>
                <p className="mt-2 text-2xl font-semibold text-ink">
                  {plan.price}
                </p>
                <p className="text-sm text-muted">{plan.limits}</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-muted">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="mt-6 w-full cursor-not-allowed rounded-xl border border-stroke bg-slate-100 py-3 text-sm font-medium text-muted">
                    Your current plan
                  </button>
                ) : (
                  <BaseButton
                    className="mt-6 w-full"
                    onClick={() => setSelected(plan.code)}>
                    {plan.name.toLowerCase() === "free"
                      ? plan.name
                      : `Upgrade to ${plan.name}`}
                  </BaseButton>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-sm text-muted">
        Need help with billing?{" "}
        <button
          type="button"
          className="text-ink underline hover:no-underline"
          onClick={() => {}}>
          Contact support
        </button>
      </p>

      <BaseModal
        open={!!selected}
        title="Plan change"
        onCancel={() => setSelected(null)}
        footer={null}>
        <div className="space-y-6">
          <div>
            <p className="text-ink">
              Switch to plan <span className="font-semibold">{selected}</span>?
            </p>
            <p className="mt-2 text-sm text-muted">
              Prorate will be calculated automatically.
            </p>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <BaseButton
              type="button"
              onClick={() => setSelected(null)}
              disabled={isPending}>
              Close
            </BaseButton>
            <BaseButton
              type="primary"
              disabled={isPending}
              onClick={handleConfirm}
              className="sm:min-w-[140px]">
              {isPending ? "Processing..." : "Confirm change"}
            </BaseButton>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};

export default BillingPlan;
