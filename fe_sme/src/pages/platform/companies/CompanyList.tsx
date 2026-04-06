import { useState } from "react";
import { Card, Skeleton, Select, Empty, Pagination } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, Building2 } from "lucide-react";
import { apiGetPlatformCompanyList } from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";
import type { PlatformCompanyItem } from "@/interface/platform";

const PLAN_TAG: Record<string, string> = {
  FREE: "bg-slate-100 text-slate-700",
  BASIC: "bg-blue-100 text-blue-700",
  PRO: "bg-violet-100 text-violet-700",
  ENTERPRISE: "bg-amber-100 text-amber-700",
};

const STATUS_TAG: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  TRIAL: "bg-yellow-100 text-yellow-700",
  SUSPENDED: "bg-red-100 text-red-700",
  INACTIVE: "bg-slate-100 text-slate-500",
};

const PAGE_SIZE = 15;

const usePlatformCompanyList = (params: {
  page: number;
  search: string;
  plan: string;
  status: string;
}) =>
  useQuery({
    queryKey: ["platform-companies", params],
    queryFn: () =>
      apiGetPlatformCompanyList({
        page: params.page,
        pageSize: PAGE_SIZE,
        search: params.search || undefined,
        plan: params.plan || undefined,
        status: params.status || undefined,
      }),
    select: (res: any) => ({
      items: (res?.data?.items ?? res?.items ?? []) as PlatformCompanyItem[],
      total: res?.data?.total ?? res?.total ?? 0,
    }),
  });

const CompanyList = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading, isError, refetch } = usePlatformCompanyList({
    page,
    search,
    plan,
    status,
  });

  const companies = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          {t("platform.companies.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("platform.companies.subtitle")}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-stroke bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
            placeholder={t("platform.companies.search_placeholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={plan || undefined}
          placeholder={t("platform.companies.filter_plan")}
          allowClear
          className="min-w-[140px]"
          onChange={(v) => {
            setPlan(v ?? "");
            setPage(1);
          }}
          options={[
            { label: "Free", value: "FREE" },
            { label: "Basic", value: "BASIC" },
            { label: "Pro", value: "PRO" },
            { label: "Enterprise", value: "ENTERPRISE" },
          ]}
        />
        <Select
          value={status || undefined}
          placeholder={t("platform.companies.filter_status")}
          allowClear
          className="min-w-[140px]"
          onChange={(v) => {
            setStatus(v ?? "");
            setPage(1);
          }}
          options={[
            { label: "Active", value: "ACTIVE" },
            { label: "Trial", value: "TRIAL" },
            { label: "Suspended", value: "SUSPENDED" },
            { label: "Inactive", value: "INACTIVE" },
          ]}
        />
      </div>

      {/* Table */}
      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} active paragraph={false} />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-red-500">
            {t("platform.companies.load_error")}{" "}
            <button
              className="font-semibold underline"
              onClick={() => refetch()}>
              {t("global.retry")}
            </button>
          </div>
        ) : companies.length === 0 ? (
          <div className="p-10">
            <Empty
              image={<Building2 className="mx-auto h-12 w-12 text-slate-300" />}
              description={t("platform.companies.empty")}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">
                    {t("platform.companies.col_name")}
                  </th>
                  <th className="px-5 py-3">
                    {t("platform.companies.col_industry")}
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
                    {t("platform.companies.col_onboardings")}
                  </th>
                  <th className="px-5 py-3">
                    {t("platform.companies.col_completion")}
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
                      navigate(`/platform/admin/companies/${c.companyId}`)
                    }>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {c.name}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{c.industry}</td>
                    <td className="px-5 py-3 text-slate-500">{c.size}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PLAN_TAG[c.plan] ?? "bg-slate-100 text-slate-600"}`}>
                        {c.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TAG[c.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {c.activeOnboardings}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{
                              width: `${Math.min(c.completionRate ?? 0, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {(c.completionRate ?? 0).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex justify-end">
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={setPage}
            showTotal={(t) => `${t} companies`}
          />
        </div>
      )}
    </div>
  );
};

export default CompanyList;
