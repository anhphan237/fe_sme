import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Skeleton,
  Tabs,
  Button,
  Modal,
  notification,
  Select,
  Input,
  Divider,
  Tag,
  Table,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  PowerOff,
  Power,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Users,
  CreditCard,
  Calendar,
  MapPin,
  Hash,
  FileText,
  RotateCcw,
  CalendarDays,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  apiGetPlatformCompanyDetail,
  apiGetPlatformSubscriptionDetail,
  apiActivateCompany,
  apiDeactivateCompany,
  apiDeleteCompany,
  apiSuspendCompany,
  apiChangePlanCompany,
  apiGetSubscriptionHistory,
  apiGetPlatformPlanList,
  apiGetPlatformPaymentList,
} from "@/api/platform/platform.api";
import {
  apiGetCompanyOnboardingFunnel,
  apiGetCompanyOnboardingByDepartment,
  apiGetCompanyTaskCompletion,
} from "@/api/admin/admin.api";
import { useLocale } from "@/i18n";
import type {
  PlatformCompanyDetailResponse,
  PlatformSubscriptionDetailResponse,
  PlatformSubscriptionHistoryResponse,
  PlatformPlanListResponse,
  PlatformPaymentListResponse,
  PlatformPaymentItem,
} from "@/interface/platform";
import type {
  CompanyOnboardingFunnelResponse,
  CompanyOnboardingByDepartmentResponse,
  CompanyTaskCompletionResponse,
} from "@/interface/admin";

// ── Status maps ──────────────────────────────────────────────────

const COMPANY_STATUS_STYLE: Record<
  string,
  { bg: string; text: string; ring: string; dot: string }
> = {
  ACTIVE: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
  },
  TRIAL: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    dot: "bg-amber-400",
  },
  SUSPENDED: {
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200",
    dot: "bg-red-500",
  },
  INACTIVE: {
    bg: "bg-slate-100",
    text: "text-slate-500",
    ring: "ring-slate-200",
    dot: "bg-slate-400",
  },
};

const SUB_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "bg-emerald-50", text: "text-emerald-700" },
  TRIAL: { bg: "bg-amber-50", text: "text-amber-700" },
  PAST_DUE: { bg: "bg-orange-50", text: "text-orange-700" },
  EXPIRED: { bg: "bg-red-50", text: "text-red-700" },
  CANCELLED: { bg: "bg-slate-100", text: "text-slate-500" },
  SUSPENDED: { bg: "bg-rose-50", text: "text-rose-700" },
};

// i18n key maps for status enums
const COMPANY_STATUS_I18N: Record<string, string> = {
  ACTIVE: "platform.companies.status_active",
  TRIAL: "platform.companies.status_trial",
  SUSPENDED: "platform.companies.status_suspended",
  INACTIVE: "platform.companies.status_inactive",
};

const SUB_STATUS_I18N: Record<string, string> = {
  ACTIVE: "platform.subscriptions.status_active",
  TRIAL: "platform.subscriptions.status_trial",
  PAST_DUE: "platform.subscriptions.status_past_due",
  CANCELLED: "platform.subscriptions.status_cancelled",
  SUSPENDED: "platform.subscriptions.status_suspended",
  EXPIRED: "platform.subscriptions.status_expired",
};

const PIE_COLORS = ["#6366f1", "#22c55e", "#ef4444", "#94a3b8"];
const TODAY = new Date().toISOString().slice(0, 10);
const START_DEFAULT = new Date(Date.now() - 90 * 86400000)
  .toISOString()
  .slice(0, 10);

// ── Hooks ────────────────────────────────────────────────────────

const useCompanyDetail = (companyId: string) =>
  useQuery({
    queryKey: ["platform-company-detail", companyId],
    queryFn: () => apiGetPlatformCompanyDetail({ companyId }),
    select: (res: any) => (res?.data ?? res) as PlatformCompanyDetailResponse,
    enabled: !!companyId,
  });

const useSubscriptionDetail = (subscriptionId?: string) =>
  useQuery({
    queryKey: ["platform-subscription-detail", subscriptionId],
    queryFn: () =>
      apiGetPlatformSubscriptionDetail({ subscriptionId: subscriptionId! }),
    select: (res: any) =>
      (res?.data ?? res) as PlatformSubscriptionDetailResponse,
    enabled: !!subscriptionId,
  });

const useCompanyFunnel = (companyId: string) =>
  useQuery({
    queryKey: ["company-onboarding-funnel", companyId],
    queryFn: () =>
      apiGetCompanyOnboardingFunnel({
        companyId,
        startDate: START_DEFAULT,
        endDate: TODAY,
      }),
    select: (res: any) => (res?.data ?? res) as CompanyOnboardingFunnelResponse,
    enabled: !!companyId,
  });

const useCompanyDepartments = (companyId: string) =>
  useQuery({
    queryKey: ["company-onboarding-departments", companyId],
    queryFn: () =>
      apiGetCompanyOnboardingByDepartment({
        companyId,
        startDate: START_DEFAULT,
        endDate: TODAY,
      }),
    select: (res: any) =>
      (res?.data ?? res) as CompanyOnboardingByDepartmentResponse,
    enabled: !!companyId,
  });

const useCompanyTaskCompletion = (companyId: string) =>
  useQuery({
    queryKey: ["company-task-completion", companyId],
    queryFn: () =>
      apiGetCompanyTaskCompletion({
        companyId,
        startDate: START_DEFAULT,
        endDate: TODAY,
      }),
    select: (res: any) => (res?.data ?? res) as CompanyTaskCompletionResponse,
    enabled: !!companyId,
  });

const useSubscriptionHistory = (
  subscriptionId?: string,
  tenantCompanyId?: string,
) =>
  useQuery({
    queryKey: ["subscription-history", subscriptionId, tenantCompanyId],
    queryFn: () =>
      apiGetSubscriptionHistory({
        subscriptionId: subscriptionId!,
        ...(tenantCompanyId ? { companyId: tenantCompanyId } : {}),
        page: 0,
        size: 20,
      }),
    select: (res: any) =>
      (res?.data ?? res) as PlatformSubscriptionHistoryResponse,
    enabled: !!subscriptionId,
  });
const useCompanyPaymentHistory = (companyId?: string, page = 0) =>
  useQuery({
    queryKey: ["company-payment-history", companyId, page],
    queryFn: () =>
      apiGetPlatformPaymentList({
        companyId: companyId!,
        startDate: START_DEFAULT,
        endDate: TODAY,
        page,
        size: 20,
      }),
    select: (res: any) => (res?.data ?? res) as PlatformPaymentListResponse,
    enabled: !!companyId,
  });
const usePlanList = () =>
  useQuery({
    queryKey: ["platform-plan-list"],
    queryFn: () => apiGetPlatformPlanList({}),
    select: (res: any) => (res?.data ?? res) as PlatformPlanListResponse,
  });

// ── Sub-components ───────────────────────────────────────────────

const KpiCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) => (
  <Card className="hover:shadow-md transition-shadow">
    <div className={`mb-3 inline-flex rounded-xl p-2.5 ${color}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
    <p className="mt-0.5 text-sm text-slate-500">{label}</p>
  </Card>
);

const InfoRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon?: any;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-3">
    {Icon && (
      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-slate-800">
        {children}
      </div>
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────

const CompanyDetail = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { t } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [changePlanData, setChangePlanData] = useState({
    newPlanId: "",
    billingCycle: "MONTHLY",
    note: "",
  });

  const { data: company, isLoading, isError } = useCompanyDetail(companyId!);
  const { data: subDetail } = useSubscriptionDetail(company?.subscriptionId);
  const { data: funnel } = useCompanyFunnel(companyId!);
  const { data: deptData } = useCompanyDepartments(companyId!);
  const { data: taskCompletion } = useCompanyTaskCompletion(companyId!);
  const { data: subHistory, isLoading: subHistoryLoading } =
    useSubscriptionHistory(company?.subscriptionId, companyId);
  const [paymentPage, setPaymentPage] = useState(1);
  const { data: paymentHistory, isLoading: paymentHistoryLoading } =
    useCompanyPaymentHistory(companyId, paymentPage - 1);
  const { data: planList } = usePlanList();

  // Helpers
  const tCompanyStatus = (s?: string) =>
    s ? t(COMPANY_STATUS_I18N[s] ?? s) : "—";
  const tSubStatus = (s?: string) => (s ? t(SUB_STATUS_I18N[s] ?? s) : "—");

  const invalidateCompany = () => {
    queryClient.invalidateQueries({
      queryKey: ["platform-company-detail", companyId],
    });
    queryClient.invalidateQueries({
      queryKey: ["platform-subscription-detail", company?.subscriptionId],
    });
  };

  const activateMutation = useMutation({
    mutationFn: () => apiActivateCompany({ companyId: companyId! }),
    onSuccess: () => {
      notification.success({
        message: t("platform.company_detail.activate_success"),
      });
      invalidateCompany();
    },
    onError: () =>
      notification.error({
        message: t("platform.company_detail.activate_error"),
      }),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => apiDeactivateCompany({ companyId: companyId! }),
    onSuccess: () => {
      notification.success({
        message: t("platform.company_detail.deactivate_success"),
      });
      invalidateCompany();
    },
    onError: () =>
      notification.error({
        message: t("platform.company_detail.deactivate_error"),
      }),
  });

  const suspendMutation = useMutation({
    mutationFn: () =>
      apiSuspendCompany({ companyId: companyId!, reason: suspendReason }),
    onSuccess: () => {
      notification.success({
        message: t("platform.company_detail.suspend_success"),
      });
      setSuspendModalOpen(false);
      setSuspendReason("");
      invalidateCompany();
    },
    onError: () =>
      notification.error({
        message: t("platform.company_detail.suspend_error"),
      }),
  });

  const changePlanMutation = useMutation({
    mutationFn: () =>
      apiChangePlanCompany({
        companyId: companyId!,
        subscriptionId: company!.subscriptionId,
        newPlanId: changePlanData.newPlanId,
        billingCycle: changePlanData.billingCycle,
        note: changePlanData.note,
      }),
    onSuccess: () => {
      notification.success({
        message: t("platform.company_detail.change_plan_success"),
      });

      setChangePlanOpen(false);
      setChangePlanData({ newPlanId: "", billingCycle: "MONTHLY", note: "" });

      invalidateCompany();

      queryClient.invalidateQueries({
        queryKey: ["subscription-history", company?.subscriptionId],
      });

      queryClient.invalidateQueries({
        queryKey: ["company-payment-history", companyId],
      });
    },
    onError: () =>
      notification.error({
        message: t("platform.company_detail.change_plan_error"),
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiDeleteCompany({ companyId: companyId! }),
    onSuccess: () => {
      notification.success({
        message: t("platform.company_detail.delete_success"),
      });
      navigate("/platform/admin/companies");
    },
    onError: () =>
      notification.error({
        message: t("platform.company_detail.delete_error"),
      }),
  });

  const handleDelete = () => {
    Modal.confirm({
      title: t("platform.company_detail.delete_confirm_title"),
      content: t("platform.company_detail.delete_confirm_body"),
      okText: t("global.delete"),
      okButtonProps: { danger: true },
      cancelText: t("global.cancel"),
      onOk: () => deleteMutation.mutate(),
    });
  };

  const funnelData = funnel
    ? [
        {
          name: t("platform.company_detail.status_active"),
          value: funnel.activeCount,
        },
        {
          name: t("platform.company_detail.status_completed"),
          value: funnel.completedCount,
        },
        {
          name: t("platform.company_detail.status_cancelled"),
          value: funnel.cancelledCount,
        },
      ]
    : [];

  const departments = deptData?.departments ?? [];
  const statusStyle =
    COMPANY_STATUS_STYLE[company?.status ?? ""] ??
    COMPANY_STATUS_STYLE.INACTIVE;
  const subStyle =
    SUB_STATUS_STYLE[company?.subscriptionStatus ?? ""] ??
    SUB_STATUS_STYLE.CANCELLED;
  const PAYMENT_STATUS_STYLE: Record<string, { color: string; label: string }> =
    {
      SUCCESS: { color: "green", label: "SUCCESS" },
      PAID: { color: "green", label: "PAID" },
      PENDING: { color: "gold", label: "PENDING" },
      FAILED: { color: "red", label: "FAILED" },
      CANCELLED: { color: "default", label: "CANCELLED" },
      REFUNDED: { color: "blue", label: "REFUNDED" },
    };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <XCircle className="h-12 w-12 text-rose-400" />
        <p className="text-sm text-slate-500">
          {t("platform.company_detail.load_error")}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200"
        >
          {t("global.back")}
        </button>
      </div>
    );
  }
  const paymentColumns = [
    {
      title: "Transaction ID",
      dataIndex: "transactionId",
      key: "transactionId",
      width: 180,
      ellipsis: true,
      render: (_: string, record: PlatformPaymentItem) =>
        record.transactionId ?? record.paymentTransactionId ?? "—",
    },
    {
      title: "Invoice ID",
      dataIndex: "invoiceId",
      key: "invoiceId",
      width: 160,
      ellipsis: true,
      render: (v: string) => v ?? "—",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (amount: number, record: PlatformPaymentItem) => {
        if (amount == null) return "—";
        return `${amount.toLocaleString("vi-VN")} ${record.currency ?? "VND"}`;
      },
    },
    {
      title: "Provider",
      dataIndex: "provider",
      key: "provider",
      width: 120,
      render: (v: string) => v ?? "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const style = PAYMENT_STATUS_STYLE[status ?? ""] ?? {
          color: "default",
          label: status ?? "—",
        };

        return <Tag color={style.color}>{style.label}</Tag>;
      },
    },
    {
      title: "Failure Reason",
      dataIndex: "failureReason",
      key: "failureReason",
      ellipsis: true,
      render: (v: string) => v ?? "—",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
    },
    {
      title: "Paid At",
      dataIndex: "paidAt",
      key: "paidAt",
      width: 170,
      render: (v: string) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—"),
    },
  ];
  return (
    <div className="space-y-5">
      {/* ── Back ── */}
      <button
        onClick={() => navigate("/platform/admin/companies")}
        className="flex items-center gap-1.5 rounded-xl border border-stroke px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("global.back")}
      </button>

      {/* ── Hero Card ── */}
      <Card className="overflow-hidden">
        {/* violet top accent bar */}
        <div className="-mx-6 -mt-6 mb-5 h-1.5 bg-gradient-to-r from-violet-500 to-indigo-400" />
        {isLoading ? (
          <Skeleton active avatar={{ size: 56 }} paragraph={{ rows: 2 }} />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-violet-100 ring-4 ring-violet-50">
                <Building2 className="h-7 w-7 text-violet-600" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xl font-bold text-slate-800">
                    {company?.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.ring}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                    />
                    {tCompanyStatus(company?.status)}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="font-mono text-xs">{companyId}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {company?.createdAt
                      ? dayjs(company.createdAt).format("DD MMM YYYY")
                      : "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {company?.userCount ?? 0}{" "}
                    {t("platform.company_detail.users")}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {(company?.status === "INACTIVE" ||
                company?.status === "SUSPENDED") && (
                <Button
                  type="default"
                  icon={<Power className="h-3.5 w-3.5" />}
                  loading={activateMutation.isPending}
                  onClick={() => activateMutation.mutate()}
                >
                  {t("platform.company_detail.activate")}
                </Button>
              )}
              {company?.status === "ACTIVE" && (
                <>
                  <Button
                    icon={<AlertTriangle className="h-3.5 w-3.5" />}
                    loading={suspendMutation.isPending}
                    onClick={() => setSuspendModalOpen(true)}
                  >
                    {t("platform.company_detail.suspend")}
                  </Button>
                  <Button
                    icon={<PowerOff className="h-3.5 w-3.5" />}
                    loading={deactivateMutation.isPending}
                    onClick={() => deactivateMutation.mutate()}
                  >
                    {t("platform.company_detail.deactivate")}
                  </Button>
                </>
              )}
              {company?.subscriptionId && (
                <Button
                  type="primary"
                  ghost
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                  onClick={() => setChangePlanOpen(true)}
                >
                  {t("platform.company_detail.change_plan")}
                </Button>
              )}
              <Button
                danger
                icon={<Trash2 className="h-3.5 w-3.5" />}
                loading={deleteMutation.isPending}
                onClick={handleDelete}
              >
                {t("global.delete")}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Two-column info grid ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Company Info */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100">
              <Building2 className="h-4 w-4 text-violet-600" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {t("platform.company_detail.section_company")}
            </p>
          </div>
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} title={false} />
          ) : (
            <div className="space-y-4">
              <InfoRow
                icon={Hash}
                label={t("platform.company_detail.company_id")}
              >
                <span className="font-mono text-xs text-slate-600">
                  {companyId}
                </span>
              </InfoRow>
              {company?.taxCode && (
                <InfoRow
                  icon={FileText}
                  label={t("platform.company_detail.tax_code")}
                >
                  {company.taxCode}
                </InfoRow>
              )}
              {company?.address && (
                <InfoRow
                  icon={MapPin}
                  label={t("platform.company_detail.address")}
                >
                  {company.address}
                </InfoRow>
              )}
              <InfoRow
                icon={Users}
                label={t("platform.company_detail.user_count")}
              >
                <span className="text-base font-bold text-violet-600">
                  {company?.userCount ?? 0}
                </span>
              </InfoRow>
              <InfoRow
                icon={Calendar}
                label={t("platform.company_detail.registered")}
              >
                {company?.createdAt
                  ? dayjs(company.createdAt).format("DD MMM YYYY")
                  : "—"}
              </InfoRow>
            </div>
          )}
        </Card>

        {/* Subscription Info */}
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100">
              <CreditCard className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {t("platform.company_detail.section_subscription")}
            </p>
          </div>
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} title={false} />
          ) : company?.subscriptionId ? (
            <div className="space-y-4">
              <InfoRow
                icon={CreditCard}
                label={t("platform.company_detail.plan")}
              >
                <span className="font-semibold text-slate-800">
                  {company.planName ?? company.planCode ?? "—"}
                </span>
              </InfoRow>
              <InfoRow
                icon={CheckCircle2}
                label={t("platform.company_detail.subscription_status")}
              >
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${subStyle.bg} ${subStyle.text}`}
                >
                  {tSubStatus(company.subscriptionStatus)}
                </span>
              </InfoRow>
              {subDetail?.billingCycle && (
                <InfoRow
                  icon={RotateCcw}
                  label={t("platform.company_detail.billing_cycle")}
                >
                  {subDetail.billingCycle === "MONTHLY"
                    ? t("platform.company_detail.billing_monthly")
                    : subDetail.billingCycle === "YEARLY"
                      ? t("platform.company_detail.billing_yearly")
                      : subDetail.billingCycle}
                </InfoRow>
              )}
              {(subDetail?.currentPeriodStart || company.currentPeriodEnd) && (
                <InfoRow
                  icon={CalendarDays}
                  label={t("platform.company_detail.billing_period")}
                >
                  <span>
                    {subDetail?.currentPeriodStart
                      ? dayjs(subDetail.currentPeriodStart).format(
                          "DD MMM YYYY",
                        )
                      : "—"}
                    {" → "}
                    {company.currentPeriodEnd
                      ? dayjs(company.currentPeriodEnd).format("DD MMM YYYY")
                      : "—"}
                  </span>
                </InfoRow>
              )}
              {subDetail !== undefined && (
                <InfoRow
                  icon={RotateCcw}
                  label={t("platform.company_detail.auto_renew")}
                >
                  <Tag color={subDetail?.autoRenew ? "green" : "default"}>
                    {subDetail?.autoRenew ? t("global.yes") : t("global.no")}
                  </Tag>
                </InfoRow>
              )}
              <Divider className="my-2" />
              <InfoRow
                icon={Hash}
                label={t("platform.company_detail.subscription_id")}
              >
                <span className="font-mono text-xs text-slate-500">
                  {company.subscriptionId}
                </span>
              </InfoRow>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CreditCard className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-400">
                {t("platform.company_detail.no_sub_history")}
              </p>
            </div>
          )}
        </Card>
      </div>
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Lịch sử thanh toán
          </p>
        </div>

        <Table
          dataSource={paymentHistory?.items ?? []}
          columns={paymentColumns}
          rowKey={(record: PlatformPaymentItem) =>
            record.transactionId ??
            record.paymentTransactionId ??
            `${record.invoiceId}-${record.createdAt}`
          }
          loading={paymentHistoryLoading}
          scroll={{ x: 1000 }}
          pagination={{
            current: paymentPage,
            pageSize: 20,
            total: paymentHistory?.total ?? 0,
            showSizeChanger: false,
            onChange: setPaymentPage,
          }}
        />
      </Card>
      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={ClipboardCheck}
          label={t("platform.company_detail.total_onboardings")}
          value={isLoading ? "—" : (funnel?.totalInstances ?? 0)}
          color="bg-violet-500"
        />
        <KpiCard
          icon={Clock}
          label={t("platform.company_detail.active_onboardings")}
          value={isLoading ? "—" : (funnel?.activeCount ?? 0)}
          color="bg-blue-500"
        />
        <KpiCard
          icon={CheckCircle2}
          label={t("platform.company_detail.completed_onboardings")}
          value={isLoading ? "—" : (funnel?.completedCount ?? 0)}
          color="bg-emerald-500"
        />
        <KpiCard
          icon={TrendingUp}
          label={t("platform.company_detail.task_completion_rate")}
          value={
            isLoading
              ? "—"
              : `${taskCompletion?.completionRate?.toFixed(1) ?? 0}%`
          }
          color="bg-amber-500"
        />
      </div>

      {/* ── Analytics Tabs ── */}
      <Tabs
        items={[
          {
            label: t("platform.company_detail.tab_funnel"),
            key: "funnel",
            children: (
              <Card>
                {isLoading ? (
                  <Skeleton active paragraph={{ rows: 5 }} />
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-slate-700">
                        {t("platform.company_detail.funnel_distribution")}
                      </h3>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={funnelData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={85}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {funnelData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={PIE_COLORS[i % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 pt-4">
                      {[
                        {
                          label: t("platform.company_detail.status_active"),
                          value: funnel?.activeCount,
                          color: "bg-violet-500",
                        },
                        {
                          label: t("platform.company_detail.status_completed"),
                          value: funnel?.completedCount,
                          color: "bg-emerald-500",
                        },
                        {
                          label: t("platform.company_detail.status_cancelled"),
                          value: funnel?.cancelledCount,
                          color: "bg-rose-500",
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${row.color}`}
                            />
                            <span className="text-sm text-slate-600">
                              {row.label}
                            </span>
                          </div>
                          <span className="font-semibold text-slate-800">
                            {row.value ?? 0}
                          </span>
                        </div>
                      ))}
                      <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                        <p className="text-sm text-violet-700">
                          {t("platform.company_detail.overall_completion")}{" "}
                          <span className="font-bold">
                            {taskCompletion?.completionRate?.toFixed(1) ?? 0}%
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ),
          },
          {
            label: t("platform.company_detail.tab_departments"),
            key: "departments",
            children: (
              <Card>
                {isLoading ? (
                  <Skeleton active paragraph={{ rows: 5 }} />
                ) : departments.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    {t("platform.company_detail.no_dept_data")}
                  </p>
                ) : (
                  <div className="space-y-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={departments.map((d) => ({
                          name: d.departmentName,
                          total: d.totalTasks,
                          completed: d.completedTasks,
                        }))}
                        margin={{ top: 5, right: 20, left: 0, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          angle={-30}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar
                          dataKey="total"
                          name={t("platform.company_detail.total_tasks")}
                          fill="#e0e7ff"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="completed"
                          name={t("platform.company_detail.completed_tasks")}
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-2">
                              {t("platform.company_detail.dept_name")}
                            </th>
                            <th className="px-4 py-2">
                              {t("platform.company_detail.total_tasks")}
                            </th>
                            <th className="px-4 py-2">
                              {t("platform.company_detail.completed_tasks")}
                            </th>
                            <th className="px-4 py-2">
                              {t("platform.company_detail.rate")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {departments.map((d) => {
                            const rate =
                              d.totalTasks > 0
                                ? (d.completedTasks / d.totalTasks) * 100
                                : 0;
                            return (
                              <tr
                                key={d.departmentId}
                                className="border-t border-stroke"
                              >
                                <td className="px-4 py-2 font-medium">
                                  {d.departmentName}
                                </td>
                                <td className="px-4 py-2 text-slate-500">
                                  {d.totalTasks}
                                </td>
                                <td className="px-4 py-2 text-slate-500">
                                  {d.completedTasks}
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                                      <div
                                        className="h-full rounded-full bg-violet-500"
                                        style={{
                                          width: `${Math.min(rate, 100)}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-slate-500">
                                      {rate.toFixed(0)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            ),
          },
          {
            label: t("platform.company_detail.tab_subscription"),
            key: "subscription",
            children: (
              <Card>
                {subHistoryLoading ? (
                  <Skeleton active paragraph={{ rows: 4 }} />
                ) : !subHistory?.items?.length ? (
                  <p className="py-10 text-center text-sm text-slate-400">
                    {t("platform.company_detail.no_sub_history")}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5">
                            {t("platform.company_detail.sub_history_old_plan")}
                          </th>
                          <th className="px-4 py-2.5">
                            {t("platform.company_detail.sub_history_new_plan")}
                          </th>
                          <th className="px-4 py-2.5">
                            {t("platform.company_detail.billing_cycle")}
                          </th>
                          <th className="px-4 py-2.5">
                            {t(
                              "platform.company_detail.sub_history_changed_at",
                            )}
                          </th>
                          <th className="px-4 py-2.5">
                            {t(
                              "platform.company_detail.sub_history_changed_by",
                            )}
                          </th>
                          <th className="px-4 py-2.5">
                            {t("platform.company_detail.sub_history_effective")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {subHistory.items.map((item) => (
                          <tr
                            key={item.historyId}
                            className="border-t border-stroke hover:bg-slate-50"
                          >
                            <td className="px-4 py-3 text-slate-500">
                              {item.oldPlanCode || "—"}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {item.newPlanCode ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {item.billingCycle === "MONTHLY"
                                ? t("platform.company_detail.billing_monthly")
                                : item.billingCycle === "YEARLY"
                                  ? t("platform.company_detail.billing_yearly")
                                  : item.billingCycle}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {item.changedAt
                                ? dayjs(item.changedAt).format(
                                    "DD MMM YYYY HH:mm",
                                  )
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {item.changedByName?.trim() ||
                                item.changedBy?.trim() ||
                                "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {item.effectiveFrom
                                ? dayjs(item.effectiveFrom).format(
                                    "DD MMM YYYY",
                                  )
                                : "—"}
                              {item.effectiveTo
                                ? ` → ${dayjs(item.effectiveTo).format("DD MMM YYYY")}`
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />

      {/* ── Suspend Modal ── */}
      <Modal
        title={t("platform.company_detail.suspend_confirm_title")}
        open={suspendModalOpen}
        onCancel={() => {
          setSuspendModalOpen(false);
          setSuspendReason("");
        }}
        onOk={() => suspendMutation.mutate()}
        confirmLoading={suspendMutation.isPending}
        okButtonProps={{ danger: true }}
        okText={t("platform.company_detail.suspend")}
        cancelText={t("global.cancel")}
      >
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <p className="text-sm text-amber-700">
              {t("platform.company_detail.suspend_confirm_body")}
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("platform.company_detail.suspend_reason")}
            </label>
            <Input.TextArea
              rows={3}
              placeholder={t(
                "platform.company_detail.suspend_reason_placeholder",
              )}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* ── Change Plan Modal ── */}
      <Modal
        title={t("platform.company_detail.change_plan_modal_title")}
        open={changePlanOpen}
        onCancel={() => setChangePlanOpen(false)}
        onOk={() => changePlanMutation.mutate()}
        confirmLoading={changePlanMutation.isPending}
        okText={t("global.save")}
        cancelText={t("global.cancel")}
        okButtonProps={{ disabled: !changePlanData.newPlanId }}
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("platform.company_detail.new_plan")}
            </label>
            <Select
              className="w-full"
              value={changePlanData.newPlanId || undefined}
              placeholder={t("platform.company_detail.new_plan")}
              onChange={(val) =>
                setChangePlanData((d) => ({ ...d, newPlanId: val }))
              }
              options={
                planList?.items?.map((p) => ({
                  value: p.planId,
                  label: `${p.name} (${p.code})`,
                })) ?? []
              }
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("platform.company_detail.billing_cycle")}
            </label>
            <Select
              className="w-full"
              value={changePlanData.billingCycle}
              onChange={(val) =>
                setChangePlanData((d) => ({ ...d, billingCycle: val }))
              }
              options={[
                {
                  value: "MONTHLY",
                  label: t("platform.company_detail.billing_monthly"),
                },
                {
                  value: "YEARLY",
                  label: t("platform.company_detail.billing_yearly"),
                },
              ]}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {t("platform.company_detail.change_plan_note")}
            </label>
            <Input.TextArea
              rows={2}
              value={changePlanData.note}
              onChange={(e) =>
                setChangePlanData((d) => ({ ...d, note: e.target.value }))
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CompanyDetail;
