import { useState, useMemo } from "react";
import {
  Card,
  Skeleton,
  Select,
  Empty,
  Pagination,
  Tabs,
  Tag,
  Button,
  Modal,
  notification,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  ChevronRight,
  Building2,
  RefreshCw,
  CheckCircle2,
  PauseCircle,
  TrendingUp,
  CreditCard,
  XCircle,
} from "lucide-react";
import {
  apiGetPlatformCompanyList,
  apiGetPlatformPlanList,
  apiGetPlatformSubscriptionList,
  apiGetPlatformCompanyAnalytics,
  apiGetPlatformSubscriptionAnalytics,
  apiRetryDunning,
} from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";
import type {
  PlatformCompanyItem,
  PlatformPlanItem,
  PlatformSubscriptionItem,
  PlatformCompanyAnalyticsResponse,
  PlatformSubscriptionAnalyticsResponse,
} from "@/interface/platform";

const PLAN_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
];

const COMPANY_STATUS_CLASS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  TRIAL: "bg-yellow-100 text-yellow-700",
  SUSPENDED: "bg-red-100 text-red-700",
  INACTIVE: "bg-slate-100 text-slate-500",
};

const SUB_STATUS_COLOR: Record<string, string> = {
  ACTIVE: "green",
  TRIAL: "gold",
  PAST_DUE: "red",
  CANCELLED: "default",
  SUSPENDED: "orange",
};

const SUB_STATUS_LABEL_KEY: Record<string, string> = {
  ACTIVE: "platform.subscriptions.status_active",
  TRIAL: "platform.subscriptions.status_trial",
  PAST_DUE: "platform.subscriptions.status_past_due",
  CANCELLED: "platform.subscriptions.status_cancelled",
  SUSPENDED: "platform.subscriptions.status_suspended",
};

const COMPANY_PAGE_SIZE = 15;
const SUB_PAGE_SIZE = 20;

const StatCard = ({
  label,
  value,
  icon: Icon,
  iconBg,
  loading,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconBg: string;
  loading?: boolean;
}) => (
  <Card size="small" className="flex-1">
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        {loading ? (
          <Skeleton active title={{ width: 48 }} paragraph={false} />
        ) : (
          <>
            <p className="text-xl font-bold leading-none text-slate-800">
              {value}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">{label}</p>
          </>
        )}
      </div>
    </div>
  </Card>
);

const CompanyList = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "companies";

  const [compPage, setCompPage] = useState(1);
  const [subPage, setSubPage] = useState(1);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [compStatus, setCompStatus] = useState("");
  const [subStatus, setSubStatus] = useState("");

  const handleTabChange = (key: string) => {
    setSearchParams(key === "companies" ? {} : { tab: key });
  };

  const { data: plans = [] } = useQuery({
    queryKey: ["platform-plans"],
    queryFn: () => apiGetPlatformPlanList(),
    select: (res: any) =>
      (res?.data?.items ?? res?.items ?? []) as PlatformPlanItem[],
  });

  const planColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    plans.forEach((p, i) => {
      map[p.code] = PLAN_COLORS[i % PLAN_COLORS.length];
    });
    return map;
  }, [plans]);

  const planNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    plans.forEach((p) => {
      map[p.code] = p.name;
    });
    return map;
  }, [plans]);

  const { data: compAnalytics, isLoading: compAnalyticsLoading } = useQuery({
    queryKey: ["platform-company-analytics"],
    queryFn: () => apiGetPlatformCompanyAnalytics({}),
    select: (res: any) =>
      (res?.data ?? res) as PlatformCompanyAnalyticsResponse,
    enabled: activeTab === "companies",
  });

  const { data: subAnalytics, isLoading: subAnalyticsLoading } = useQuery({
    queryKey: ["platform-subscription-analytics"],
    queryFn: () => apiGetPlatformSubscriptionAnalytics({}),
    select: (res: any) =>
      (res?.data ?? res) as PlatformSubscriptionAnalyticsResponse,
    enabled: activeTab === "subscriptions",
  });

  const {
    data: companyData,
    isLoading: compLoading,
    isError: compError,
    refetch: compRefetch,
  } = useQuery({
    queryKey: ["platform-companies", { compPage, search, plan, compStatus }],
    queryFn: () =>
      apiGetPlatformCompanyList({
        page: compPage,
        size: COMPANY_PAGE_SIZE,
        search: search || undefined,
        planCode: plan || undefined,
        status: compStatus || undefined,
      }),
    select: (res: any) => ({
      items: (res?.data?.items ?? res?.items ?? []) as PlatformCompanyItem[],
      total: res?.data?.total ?? res?.total ?? 0,
    }),
    enabled: activeTab === "companies",
  });

  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ["platform-subscriptions", subPage, subStatus, plan],
    queryFn: () =>
      apiGetPlatformSubscriptionList({
        page: subPage,
        size: SUB_PAGE_SIZE,
        status: subStatus || undefined,
        planCode: plan || undefined,
      }),
    select: (res: any) => res?.data ?? res,
    enabled: activeTab === "subscriptions",
  });

  const retryMutation = useMutation({
    mutationFn: (subscriptionId: string) => apiRetryDunning({ subscriptionId }),
    onSuccess: () => {
      notification.success({
        message: t("platform.subscriptions.retry_success"),
      });
      queryClient.invalidateQueries({ queryKey: ["platform-subscriptions"] });
    },
    onError: () => {
      notification.error({ message: t("platform.subscriptions.retry_error") });
    },
  });

  const handleRetry = (sub: PlatformSubscriptionItem) => {
    Modal.confirm({
      title: t("platform.subscriptions.retry_confirm_title"),
      content: t("platform.subscriptions.retry_confirm_body"),
      okText: t("global.confirm"),
      cancelText: t("global.cancel"),
      onOk: () => retryMutation.mutate(sub.subscriptionId),
    });
  };

  const COMPANY_STATUS_LABEL: Record<string, string> = {
    ACTIVE: t("platform.companies.status_active"),
    TRIAL: t("platform.companies.status_trial"),
    SUSPENDED: t("platform.companies.status_suspended"),
    INACTIVE: t("platform.companies.status_inactive"),
  };

  const companies = companyData?.items ?? [];
  const compTotal = companyData?.total ?? 0;
  const subItems: PlatformSubscriptionItem[] = subData?.items ?? [];
  const subTotal: number = subData?.total ?? 0;

  const TabBadge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        {count}
      </span>
    ) : null;

  const PlanBadge = ({ code }: { code: string }) => (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${planColorMap[code] ?? "bg-slate-100 text-slate-600"}`}>
      {planNameMap[code] ?? code}
    </span>
  );

  const companyStats = (
    <div className="mb-4 flex gap-3">
      <StatCard
        icon={Building2}
        iconBg="bg-violet-500"
        label={t("platform.companies.stat_total")}
        value={compAnalytics?.totalCompanies ?? "—"}
        loading={compAnalyticsLoading}
      />
      <StatCard
        icon={CheckCircle2}
        iconBg="bg-emerald-500"
        label={t("platform.companies.status_active")}
        value={compAnalytics?.activeCompanies ?? "—"}
        loading={compAnalyticsLoading}
      />
      <StatCard
        icon={PauseCircle}
        iconBg="bg-orange-500"
        label={t("platform.companies.status_suspended")}
        value={compAnalytics?.suspendedCompanies ?? "—"}
        loading={compAnalyticsLoading}
      />
      <StatCard
        icon={TrendingUp}
        iconBg="bg-blue-500"
        label={t("platform.companies.stat_new")}
        value={compAnalytics?.newCompanies ?? "—"}
        loading={compAnalyticsLoading}
      />
    </div>
  );

  const subscriptionStats = (
    <div className="mb-4 flex gap-3">
      <StatCard
        icon={CreditCard}
        iconBg="bg-violet-500"
        label={t("platform.subscriptions.stat_total")}
        value={subAnalytics?.totalSubscriptions ?? "—"}
        loading={subAnalyticsLoading}
      />
      <StatCard
        icon={CheckCircle2}
        iconBg="bg-emerald-500"
        label={t("platform.subscriptions.status_active")}
        value={subAnalytics?.activeSubscriptions ?? "—"}
        loading={subAnalyticsLoading}
      />
      <StatCard
        icon={PauseCircle}
        iconBg="bg-orange-500"
        label={t("platform.subscriptions.status_suspended")}
        value={subAnalytics?.suspendedSubscriptions ?? "—"}
        loading={subAnalyticsLoading}
      />
      <StatCard
        icon={XCircle}
        iconBg="bg-rose-500"
        label={t("platform.subscriptions.status_cancelled")}
        value={subAnalytics?.cancelledSubscriptions ?? "—"}
        loading={subAnalyticsLoading}
      />
    </div>
  );

  return (
    <Tabs
      activeKey={activeTab}
      onChange={handleTabChange}
      tabBarExtraContent={
        <div className="flex items-center gap-2 pb-1">
          {activeTab === "companies" && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-44 rounded-xl border border-stroke bg-white py-1.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
                placeholder={t("platform.companies.search_placeholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCompPage(1);
                }}
              />
            </div>
          )}
          <Select
            value={plan || undefined}
            placeholder={t("platform.companies.filter_plan")}
            allowClear
            style={{ width: 140 }}
            onChange={(v) => {
              setPlan(v ?? "");
              setCompPage(1);
              setSubPage(1);
            }}
            options={plans.map((p) => ({ label: p.name, value: p.code }))}
          />
          <Select
            value={
              (activeTab === "companies" ? compStatus : subStatus) || undefined
            }
            placeholder={t("platform.companies.filter_status")}
            allowClear
            style={{ width: 150 }}
            onChange={(v) => {
              if (activeTab === "companies") {
                setCompStatus(v ?? "");
                setCompPage(1);
              } else {
                setSubStatus(v ?? "");
                setSubPage(1);
              }
            }}
            options={
              activeTab === "companies"
                ? [
                    {
                      label: t("platform.companies.status_active"),
                      value: "ACTIVE",
                    },
                    {
                      label: t("platform.companies.status_trial"),
                      value: "TRIAL",
                    },
                    {
                      label: t("platform.companies.status_suspended"),
                      value: "SUSPENDED",
                    },
                    {
                      label: t("platform.companies.status_inactive"),
                      value: "INACTIVE",
                    },
                  ]
                : [
                    {
                      label: t("platform.subscriptions.status_active"),
                      value: "ACTIVE",
                    },
                    {
                      label: t("platform.subscriptions.status_trial"),
                      value: "TRIAL",
                    },
                    {
                      label: t("platform.subscriptions.status_past_due"),
                      value: "PAST_DUE",
                    },
                    {
                      label: t("platform.subscriptions.status_cancelled"),
                      value: "CANCELLED",
                    },
                    {
                      label: t("platform.subscriptions.status_suspended"),
                      value: "SUSPENDED",
                    },
                  ]
            }
          />
        </div>
      }
      items={[
        {
          key: "companies",
          label: (
            <span>
              {t("platform.companies.title")}
              <TabBadge count={compTotal} />
            </span>
          ),
          children: (
            <div className="space-y-0">
              {companyStats}
              <Card className="p-0">
                {compLoading ? (
                  <div className="space-y-3 p-6">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <Skeleton key={i} active paragraph={false} />
                    ))}
                  </div>
                ) : compError ? (
                  <div className="p-6 text-sm text-red-500">
                    {t("platform.companies.load_error")}{" "}
                    <button
                      className="font-semibold underline"
                      onClick={() => compRefetch()}>
                      {t("global.retry")}
                    </button>
                  </div>
                ) : companies.length === 0 ? (
                  <div className="py-16">
                    <Empty
                      image={
                        <Building2 className="mx-auto h-12 w-12 text-slate-300" />
                      }
                      description={t("platform.companies.empty")}
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3">
                            {t("platform.companies.col_name")}
                          </th>
                          <th className="px-5 py-3">
                            {t("platform.companies.col_size")}
                          </th>
                          <th className="px-5 py-3">
                            {t("platform.companies.col_plan")}
                          </th>
                          <th className="px-5 py-3">
                            {t("platform.companies.col_status")}
                          </th>
                          <th className="px-5 py-3">
                            {t("platform.companies.col_created")}
                          </th>
                          <th className="px-5 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {companies.map((c) => (
                          <tr
                            key={c.companyId}
                            className="cursor-pointer border-t border-stroke transition hover:bg-slate-50"
                            onClick={() =>
                              navigate(
                                `/platform/admin/companies/${c.companyId}`,
                              )
                            }>
                            <td className="px-5 py-3.5 font-medium text-slate-800">
                              {c.name}
                            </td>
                            <td className="px-5 py-3.5 text-slate-500">
                              {c.userCount}
                            </td>
                            <td className="px-5 py-3.5">
                              <PlanBadge code={c.planCode} />
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COMPANY_STATUS_CLASS[c.status] ?? "bg-slate-100 text-slate-600"}`}>
                                {COMPANY_STATUS_LABEL[c.status] ?? c.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-400">
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="px-5 py-3.5">
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
              {compTotal > COMPANY_PAGE_SIZE && (
                <div className="mt-4 flex justify-end">
                  <Pagination
                    current={compPage}
                    pageSize={COMPANY_PAGE_SIZE}
                    total={compTotal}
                    onChange={setCompPage}
                  />
                </div>
              )}
            </div>
          ),
        },
        {
          key: "subscriptions",
          label: (
            <span>
              {t("platform.subscriptions.title")}
              <TabBadge count={subTotal} />
            </span>
          ),
          children: (
            <div className="space-y-0">
              {subscriptionStats}
              <Card className="p-0">
                {subLoading ? (
                  <div className="space-y-3 p-6">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <Skeleton key={i} active paragraph={false} />
                    ))}
                  </div>
                ) : subItems.length === 0 ? (
                  <div className="py-16">
                    <Empty description={t("platform.companies.empty")} />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3">
                            {t("platform.subscriptions.col_company")}
                          </th>
                          <th className="px-5 py-3">
                            {t("platform.subscriptions.col_plan")}
                          </th>
                          <th className="px-5 py-3">
                            {t("platform.subscriptions.col_status")}
                          </th>
                          <th className="px-5 py-3">
                            {t("platform.subscriptions.col_billing")}
                          </th>
                          <th className="px-5 py-3">
                            {t("platform.subscriptions.col_renewal")}
                          </th>
                          <th className="px-5 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {subItems.map((sub) => (
                          <tr
                            key={sub.subscriptionId}
                            className="border-t border-stroke hover:bg-slate-50">
                            <td className="px-5 py-3.5">
                              <button
                                className="font-medium text-slate-800 hover:text-violet-600 hover:underline"
                                onClick={() =>
                                  navigate(
                                    `/platform/admin/companies/${sub.companyId}`,
                                  )
                                }>
                                {sub.companyName}
                              </button>
                            </td>
                            <td className="px-5 py-3.5">
                              <PlanBadge code={sub.planCode} />
                            </td>
                            <td className="px-5 py-3.5">
                              <Tag
                                color={
                                  SUB_STATUS_COLOR[sub.status] ?? "default"
                                }>
                                {t(
                                  SUB_STATUS_LABEL_KEY[sub.status] ??
                                    sub.status,
                                )}
                              </Tag>
                            </td>
                            <td className="px-5 py-3.5 text-slate-500">
                              {sub.billingCycle}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-400">
                              {sub.currentPeriodEnd}
                            </td>
                            <td className="px-5 py-3.5">
                              {sub.status !== "ACTIVE" && (
                                <Button
                                  size="small"
                                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                                  loading={
                                    retryMutation.isPending &&
                                    retryMutation.variables ===
                                      sub.subscriptionId
                                  }
                                  onClick={() => handleRetry(sub)}>
                                  {t("platform.subscriptions.retry_payment")}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
              {subTotal > SUB_PAGE_SIZE && (
                <div className="mt-4 flex justify-end">
                  <Pagination
                    current={subPage}
                    pageSize={SUB_PAGE_SIZE}
                    total={subTotal}
                    onChange={setSubPage}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </div>
          ),
        },
      ]}
    />
  );
};

export default CompanyList;
