import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Card,
  Empty,
  Pagination,
  Select,
  Skeleton,
  Tag,
  Tooltip,
} from "antd";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Layers, RefreshCw, XCircle } from "lucide-react";
import {
  apiGetSubscription,
  apiGetSubscriptionPlanTimeline,
} from "@/api/billing/billing.api";
import type { SubscriptionPlanTimelineSegment } from "@/interface/billing";
import { mapSubscription } from "@/utils/mappers/billing";
import { useUserStore } from "@/stores/user.store";
import { useLocale } from "@/i18n";
import type { Subscription } from "@/shared/types";
import BaseButton from "@/components/button";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/** Earliest year offered in the timeline filter (inclusive). */
const YEAR_MIN = 2025;

function defaultTimelineYear(): number {
  const y = dayjs().year();
  return y >= YEAR_MIN ? y : YEAR_MIN;
}

function formatSegmentActor(
  seg: SubscriptionPlanTimelineSegment,
  t: (key: string) => string,
): string {
  const name = seg.changedByName?.trim();
  if (name) return name;
  const id = seg.changedBy?.trim();
  if (id) return id;
  return t("billing.plan.plan_timeline_actor_unknown");
}

function formatViDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatChangedAtCell(iso: string | undefined) {
  if (!iso) return <span className="text-slate-300">—</span>;
  const d = new Date(iso);
  return (
    <span>
      {d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })}
      <span className="ml-1.5 text-xs text-slate-400">
        {d.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </span>
  );
}

const BillingPlanTimeline = () => {
  const { t } = useLocale();
  const currentUser = useUserStore((state) => state.currentUser);
  const currentTenant = useUserStore((state) => state.currentTenant);
  const companyId = currentUser?.companyId ?? currentTenant?.id ?? "";
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const defaultYear = useMemo(() => defaultTimelineYear(), []);

  const [yearFilter, setYearFilter] = useState<number>(defaultYear);

  const selectableYears = useMemo(() => {
    const current = dayjs().year();
    const hi = Math.max(current, YEAR_MIN);
    const out: number[] = [];
    for (let y = hi; y >= YEAR_MIN; y--) out.push(y);
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

  const {
    data: planTimeline,
    isLoading,
    isFetching,
    isError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: [
      "billing",
      "subscription-plan-timeline",
      subscription?.subscriptionId,
      page,
      pageSize,
      yearFilter,
    ],
    queryFn: () =>
      apiGetSubscriptionPlanTimeline({
        subscriptionId: subscription!.subscriptionId,
        companyId: companyId || undefined,
        page: page - 1,
        size: pageSize,
        year: yearFilter,
      }),
    enabled: Boolean(subscription?.subscriptionId),
    placeholderData: keepPreviousData,
  });

  const timelineTotal = planTimeline?.total ?? 0;
  const appliedSize = planTimeline?.size ?? pageSize;
  const totalPagesBe = planTimeline?.totalPages;
  const segments = planTimeline?.segments ?? [];

  const maxPage = useMemo(() => {
    if (totalPagesBe != null) return Math.max(1, totalPagesBe);
    return Math.max(1, Math.ceil(timelineTotal / appliedSize) || 1);
  }, [totalPagesBe, timelineTotal, appliedSize]);

  useEffect(() => {
    if (isFetching) return;
    if (page > maxPage) setPage(maxPage);
  }, [isFetching, page, maxPage]);

  const hasSubscription = Boolean(subscription?.subscriptionId);
  const hasNonDefaultYear = yearFilter !== defaultYear;

  const lastUpdated =
    dataUpdatedAt > 0
      ? new Date(dataUpdatedAt).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const yearSelectOptions = useMemo(
    () =>
      selectableYears.map((y) => ({
        value: String(y),
        label: String(y),
      })),
    [selectableYears],
  );

  const cycleLabel = (seg: SubscriptionPlanTimelineSegment) =>
    seg.billingCycle === "MONTHLY"
      ? t("billing.cycle.monthly")
      : seg.billingCycle === "YEARLY"
        ? t("billing.cycle.yearly")
        : seg.billingCycle;

  const cycleTagColor = (
    seg: SubscriptionPlanTimelineSegment,
  ): "blue" | "green" | "default" => {
    if (seg.billingCycle === "MONTHLY") return "blue";
    if (seg.billingCycle === "YEARLY") return "green";
    return "default";
  };

  const initialSkeleton = isLoading && !planTimeline;

  const pageItemRange = useMemo(() => {
    if (timelineTotal === 0) return { start: 0, end: 0 };
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, timelineTotal);
    return { start, end };
  }, [timelineTotal, page, pageSize]);

  const paginationTailwind =
    "[&_.ant-pagination-item-active]:!border-indigo-400 [&_.ant-pagination-item-active]:!bg-indigo-50 [&_.ant-pagination-item-active_a]:!text-indigo-700 [&_.ant-pagination-options-size-changer_.ant-select-selector]:!rounded-lg [&_.ant-pagination-item]:!rounded-lg";

  return (
    <div className="space-y-5">
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
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-900/[0.04] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm shadow-indigo-500/25">
                <Layers className="h-4 w-4 text-white" />
              </span>
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="plan-timeline-year"
              >
                {t("billing.plan.plan_timeline_year")}
              </label>
              <Select
                id="plan-timeline-year"
                className="min-w-[168px]"
                showSearch
                optionFilterProp="label"
                value={String(yearFilter)}
                onChange={(v) => setYearFilter(Number(v))}
                options={yearSelectOptions}
              />
              {!initialSkeleton && !isError ? (
                <span className="hidden items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-xs font-medium text-indigo-950 sm:inline-flex">
                  <span className="text-indigo-600/90">
                    {t("billing.transactions.stat_total")}
                  </span>
                  <span className="tabular-nums font-semibold text-indigo-900">
                    {timelineTotal}
                  </span>
                </span>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Tooltip
                title={
                  lastUpdated
                    ? `${t("billing.plan.plan_timeline_last_updated")} ${lastUpdated}`
                    : undefined
                }
              >
                <button
                  type="button"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                  />
                </button>
              </Tooltip>
            </div>
          </div>

          <Card className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-0 shadow-md ring-1 ring-slate-900/[0.035]">
            {initialSkeleton ? (
              <div className="divide-y divide-slate-100 bg-slate-50/40">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton.Input
                      active
                      size="small"
                      className="!min-w-[140px] !rounded-lg"
                    />
                    <Skeleton.Input
                      active
                      size="small"
                      className="!min-w-[180px] !rounded-lg"
                    />
                    <Skeleton.Input
                      active
                      size="small"
                      className="!w-20 !rounded-lg"
                    />
                    <Skeleton.Input
                      active
                      size="small"
                      className="!w-28 !rounded-lg"
                    />
                    <Skeleton.Input
                      active
                      size="small"
                      className="!w-24 !rounded-lg"
                    />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 bg-slate-50/50 p-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                  <XCircle className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {t("billing.plan.plan_timeline_error")}
                </p>
                <BaseButton
                  onClick={() => refetch()}
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                >
                  {t("billing.invoices.retry")}
                </BaseButton>
              </div>
            ) : timelineTotal === 0 ? (
              <div className="bg-gradient-to-b from-slate-50/80 to-white p-16">
                <Empty
                  image={
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
                      <Layers className="h-7 w-7 text-indigo-400" />
                    </div>
                  }
                  imageStyle={{ height: "auto" }}
                  description={
                    <div className="mt-4 space-y-1">
                      <p className="text-sm font-semibold text-slate-700">
                        {t("billing.plan.plan_timeline_empty")}
                      </p>
                      {hasNonDefaultYear ? (
                        <p className="text-xs text-slate-400">
                          {t("billing.plan.plan_timeline_empty_filter_hint")}
                        </p>
                      ) : null}
                    </div>
                  }
                >
                  {hasNonDefaultYear ? (
                    <BaseButton
                      type="default"
                      onClick={() => setYearFilter(defaultYear)}
                    >
                      {t("billing.transactions.clear_filter")}
                    </BaseButton>
                  ) : null}
                </Empty>
              </div>
            ) : (
              <>
                <div
                  className={
                    isFetching ? "opacity-70 transition-opacity" : undefined
                  }
                >
                  <div className="flex items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-slate-100/90 via-slate-50 to-indigo-50/40 px-6 py-3">
                    <span className="text-xs text-slate-500">
                      {t("billing.transactions.showing")}{" "}
                      <span className="font-semibold text-slate-800">
                        {segments.length}
                      </span>{" "}
                      {t("billing.transactions.of")}{" "}
                      <span className="font-semibold text-slate-800">
                        {timelineTotal}
                      </span>{" "}
                      <span className="text-slate-500">
                        {t("billing.plan.plan_timeline_summary_noun")}
                      </span>
                    </span>
                    {hasNonDefaultYear ? (
                      <button
                        type="button"
                        onClick={() => setYearFilter(defaultYear)}
                        className="text-xs font-medium text-indigo-600 underline decoration-indigo-200 underline-offset-2 hover:text-indigo-800"
                      >
                        {t("billing.transactions.clear_filter")}
                      </button>
                    ) : null}
                  </div>
                  <div className="overflow-x-auto bg-slate-50/25">
                    <table className="w-full text-sm">
                      <thead className="border-b border-slate-200 bg-slate-100/90">
                        <tr>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {t("billing.plan.plan_timeline_col_plan")}
                          </th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {t("billing.plan.plan_timeline_col_period")}
                          </th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {t("billing.plan.billing_cycle")}
                          </th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {t("billing.plan.plan_timeline_changed_by")}
                          </th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {t("billing.plan.plan_timeline_col_changed_at")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {segments.map((seg, idx) => (
                          <tr
                            key={`${seg.historyId}-${seg.effectiveFrom}`}
                            className={`transition-colors hover:bg-indigo-50/40 ${idx % 2 === 1 ? "bg-slate-50/55" : "bg-white"}`}
                          >
                            <td className="px-6 py-4 align-middle">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                                <span className="font-semibold text-slate-900">
                                  {seg.planName}
                                </span>
                                <span className="w-fit rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80">
                                  {seg.planCode}
                                </span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                              <span className="tabular-nums">
                                {formatViDate(seg.effectiveFrom)}
                              </span>
                              <span className="mx-1.5 text-slate-300">→</span>
                              {seg.effectiveTo ? (
                                <span className="tabular-nums text-slate-700">
                                  {formatViDate(seg.effectiveTo)}
                                </span>
                              ) : (
                                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                                  {t("billing.plan.plan_timeline_present")}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <Tag
                                color={cycleTagColor(seg)}
                                className="!m-0 border-0 font-medium"
                              >
                                {cycleLabel(seg)}
                              </Tag>
                            </td>
                            <td className="max-w-[200px] truncate px-6 py-4 text-slate-800">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                                {formatSegmentActor(seg, t)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                              {formatChangedAtCell(seg.changedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {timelineTotal > 0 ? (
                  <div className="flex flex-col gap-3 border-t border-slate-200 bg-gradient-to-r from-slate-50/95 via-white to-indigo-50/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-center text-xs text-slate-500 sm:text-left">
                      <span className="font-medium text-slate-700">
                        {t("billing.transactions.showing")}
                      </span>{" "}
                      <span className="tabular-nums font-semibold text-slate-900">
                        {pageItemRange.start}–{pageItemRange.end}
                      </span>
                      <span className="text-slate-400">
                        {" "}
                        · {timelineTotal}{" "}
                        {t("billing.plan.plan_timeline_summary_noun")}
                      </span>
                    </p>
                    <Pagination
                      size="small"
                      hideOnSinglePage={false}
                      className={`flex flex-wrap justify-center sm:justify-end ${paginationTailwind}`}
                      current={page}
                      pageSize={pageSize}
                      total={timelineTotal}
                      showSizeChanger
                      pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
                      onChange={(p, ps) => {
                        setPageSize(ps);
                        setPage(p);
                      }}
                    />
                  </div>
                ) : null}
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default BillingPlanTimeline;
