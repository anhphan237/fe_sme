import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Pagination, Select, Skeleton } from "antd";
import { useQuery } from "@tanstack/react-query";
import {
  apiGetSubscription,
  apiGetSubscriptionPlanTimeline,
} from "@/api/billing/billing.api";
import { mapSubscription } from "@/utils/mappers/billing";
import { useUserStore } from "@/stores/user.store";
import { useLocale } from "@/i18n";
import type { Subscription } from "@/shared/types";

/** Request size — BE default max 500, default 50 */
const TIMELINE_PAGE_SIZE = 50;

const YEAR_ALL = "all";

const BillingPlanTimeline = () => {
  const { t } = useLocale();
  const currentUser = useUserStore((state) => state.currentUser);
  const currentTenant = useUserStore((state) => state.currentTenant);
  const companyId = currentUser?.companyId ?? currentTenant?.id ?? "";
  const [page, setPage] = useState(1);
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);

  const selectableYears = useMemo(() => {
    const hi = Math.min(2100, dayjs().year());
    const lo = 1970;
    const out: number[] = [];
    for (let y = hi; y >= lo; y--) out.push(y);
    return out;
  }, []);

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => apiGetSubscription(),
    select: (res: unknown) => mapSubscription(res) as Subscription,
  });

  useEffect(() => {
    setPage(1);
  }, [subscription?.subscriptionId, yearFilter]);

  const { data: planTimeline, isLoading: planTimelineLoading } = useQuery({
    queryKey: [
      "billing",
      "subscription-plan-timeline",
      subscription?.subscriptionId,
      page,
      TIMELINE_PAGE_SIZE,
      yearFilter,
    ],
    queryFn: () =>
      apiGetSubscriptionPlanTimeline({
        subscriptionId: subscription!.subscriptionId,
        companyId: companyId || undefined,
        page: page - 1,
        size: TIMELINE_PAGE_SIZE,
        ...(yearFilter != null ? { year: yearFilter } : {}),
      }),
    enabled: Boolean(subscription?.subscriptionId),
  });

  const timelineTotal = planTimeline?.total ?? 0;
  const appliedSize = planTimeline?.size ?? TIMELINE_PAGE_SIZE;
  const totalPagesBe = planTimeline?.totalPages;

  const maxPage = useMemo(() => {
    if (totalPagesBe != null) return Math.max(1, totalPagesBe);
    return Math.max(1, Math.ceil(timelineTotal / appliedSize) || 1);
  }, [totalPagesBe, timelineTotal, appliedSize]);

  useEffect(() => {
    if (planTimelineLoading) return;
    if (page > maxPage) setPage(maxPage);
  }, [planTimelineLoading, page, maxPage]);

  const hasSubscription = Boolean(subscription?.subscriptionId);
  /** Hiện footer phân trang khi có bản ghi (kể cả 1 trang — vẫn thấy tổng / khoảng STT) */
  const showPaginationFooter =
    !planTimelineLoading && timelineTotal > 0;

  const yearSelectOptions = useMemo(
    () => [
      {
        value: YEAR_ALL,
        label: t("billing.plan.plan_timeline_year_all"),
      },
      ...selectableYears.map((y) => ({
        value: String(y),
        label: String(y),
      })),
    ],
    [selectableYears, t],
  );

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight text-slate-900">
          {t("billing.plan.plan_timeline")}
        </h1>
        <p className="mt-2 text-base text-slate-600">
          {t("billing.plan.plan_timeline_page_subtitle")}
        </p>
      </div>

      {!hasSubscription ? (
        <p className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          {t("billing.plan.plan_timeline_no_subscription")}
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="plan-timeline-year"
            >
              {t("billing.plan.plan_timeline_year")}
            </label>
            <Select
              id="plan-timeline-year"
              className="min-w-[160px]"
              showSearch
              optionFilterProp="label"
              value={yearFilter === undefined ? YEAR_ALL : String(yearFilter)}
              onChange={(v) => {
                if (v === YEAR_ALL) setYearFilter(undefined);
                else setYearFilter(Number(v));
              }}
              options={yearSelectOptions}
            />
          </div>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            {planTimelineLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} title={false} />
            ) : timelineTotal === 0 ? (
              <p className="text-sm text-slate-500">
                {t("billing.plan.plan_timeline_empty")}
              </p>
            ) : (
              <>
                {planTimeline?.segments?.length ? (
                  <ul className="space-y-3">
                    {planTimeline.segments.map((seg) => (
                      <li
                        key={`${seg.historyId}-${seg.effectiveFrom}`}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm"
                      >
                        <p className="font-medium text-slate-800">
                          {seg.planName}{" "}
                          <span className="font-normal text-slate-500">
                            ({seg.planCode})
                          </span>
                        </p>
                        <p className="mt-1 text-slate-600">
                          {dayjs(seg.effectiveFrom).format("DD MMM YYYY")} →{" "}
                          {seg.effectiveTo
                            ? dayjs(seg.effectiveTo).format("DD MMM YYYY")
                            : t("billing.plan.plan_timeline_present")}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {seg.billingCycle === "MONTHLY"
                            ? t("billing.cycle.monthly")
                            : seg.billingCycle === "YEARLY"
                              ? t("billing.cycle.yearly")
                              : seg.billingCycle}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">
                    {t("billing.plan.plan_timeline_empty")}
                  </p>
                )}
                {showPaginationFooter ? (
                  <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                    <Pagination
                      current={page}
                      pageSize={appliedSize}
                      total={timelineTotal}
                      onChange={(p) => setPage(p)}
                      showSizeChanger={false}
                      hideOnSinglePage={false}
                      showTotal={(total, range) =>
                        `${range[0]}–${range[1]} / ${total}`
                      }
                    />
                  </div>
                ) : null}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default BillingPlanTimeline;
