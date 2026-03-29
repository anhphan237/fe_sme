import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileText, Sparkles, WandSparkles } from "lucide-react";
import { Button, Empty, Form, Modal, Select, Tag, Typography, message } from "antd";
import Input from "antd/es/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import { useLocale } from "@/i18n";
import { useGlobalStore } from "@/stores/global.store";
import { apiListTemplates, apiGenerateTemplateWithAI } from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapTemplate } from "@/utils/mappers/onboarding";
import type { OnboardingTemplate } from "@/shared/types";
import MyTable from "@/components/table";

const INDUSTRY_OPTIONS = [
  { value: "Công nghệ", label: "Công nghệ" },
  { value: "Bán lẻ", label: "Bán lẻ" },
  { value: "Sản xuất", label: "Sản xuất" },
  { value: "Dịch vụ", label: "Dịch vụ" },
  { value: "Tài chính", label: "Tài chính" },
  { value: "Y tế", label: "Y tế" },
  { value: "Giáo dục", label: "Giáo dục" },
  { value: "Xây dựng", label: "Xây dựng" },
  { value: "Vận tải & Logistics", label: "Vận tải & Logistics" },
  { value: "Khác", label: "Khác" },
];

const COMPANY_SIZE_OPTIONS = [
  { value: "STARTUP", label: "Startup (dưới 10 người)" },
  { value: "SME", label: "SME (10 – 200 người)" },
  { value: "ENTERPRISE", label: "Enterprise (trên 200 người)" },
];

// ── Types & constants ────────────────────────────────────────────────────────

export type StatusFilter = "ACTIVE" | "INACTIVE" | "";

// ── StatusBadge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status?: string }) => {
  const { t } = useLocale();
  const isActive = (status ?? "").toUpperCase() === "ACTIVE";
  return (
    <Tag
      color={isActive ? "success" : "default"}
      className="inline-flex items-center gap-1">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}
      />
      {isActive
        ? t("onboarding.template.status.active")
        : t("onboarding.template.status.inactive")}
    </Tag>
  );
};

// ── Templates (page) ─────────────────────────────────────────────────────────

const Templates = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const setBreadcrumbs = useGlobalStore((s) => s.setBreadcrumbs);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [searchText, setSearchText] = useState<string>("");
  const [cloneSourceId, setCloneSourceId] = useState<string>();
  const [aiOpen, setAiOpen] = useState(false);
  const [aiForm] = Form.useForm<{ industry: string; companySize: string; jobRole: string }>();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["templates", statusFilter, searchText],
    queryFn: () =>
      apiListTemplates({
        status: statusFilter,
        search: searchText || undefined,
      }),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "templates",
        "items",
        "list",
      ).map(mapTemplate) as OnboardingTemplate[],
  });

  const handleEdit = useCallback(
    (tmpl: OnboardingTemplate) => {
      setBreadcrumbs({ [tmpl.id]: tmpl.name });
      navigate(`/onboarding/templates/${tmpl.id}`);
    },
    [navigate, setBreadcrumbs],
  );

  const handleNewTemplate = useCallback(
    () => navigate("/onboarding/templates/new"),
    [navigate],
  );

  const handleDuplicate = useCallback(
    (tmpl: OnboardingTemplate) => {
      navigate("/onboarding/templates/new", {
        state: { duplicateFrom: tmpl },
      });
    },
    [navigate],
  );

  const aiGenerateMutation = useMutation({
    mutationFn: (values: { industry: string; companySize: string; jobRole: string }) =>
      apiGenerateTemplateWithAI(values),
    onSuccess: (result: any) => {
      setAiOpen(false);
      aiForm.resetFields();
      refetch();
      message.success(
        `Đã tạo template "${result?.name ?? ""}" với ${result?.totalChecklists ?? 0} giai đoạn và ${result?.totalTasks ?? 0} tasks!`,
      );
    },
    onError: () => {
      message.error("Không thể tạo template. Vui lòng thử lại.");
    },
  });

  const templateOptions = (data ?? []).map((tmpl) => ({
    value: tmpl.id,
    label: tmpl.name,
  }));

  const selectedTemplateToClone = (data ?? []).find(
    (tmpl) => tmpl.id === cloneSourceId,
  );

  const handleCloneFromPicker = () => {
    if (!selectedTemplateToClone) {
      message.warning(t("onboarding.template.clone.select_required"));
      return;
    }
    handleDuplicate(selectedTemplateToClone);
  };

  const handleAIGenerate = async () => {
    try {
      const values = await aiForm.validateFields();
      aiGenerateMutation.mutate(values);
    } catch {
      /* validation failed */
    }
  };

  const statusOptions = [
    { value: "", label: t("onboarding.template.filter.all") },
    { value: "ACTIVE", label: t("onboarding.template.filter.active") },
    { value: "INACTIVE", label: t("onboarding.template.filter.inactive") },
  ];

  const columns: ColumnsType<OnboardingTemplate> = [
    {
      title: t("onboarding.template.col.name"),
      key: "name",
      render: (_: unknown, tmpl: OnboardingTemplate) => {
        const isActive = (tmpl.status ?? "ACTIVE").toUpperCase() === "ACTIVE";
        return (
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isActive ? "bg-brand/10" : "bg-slate-100"
              }`}>
              <FileText
                className={`h-4.5 w-4.5 ${isActive ? "text-brand" : "text-slate-400"}`}
              />
            </div>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => handleEdit(tmpl)}
                className="truncate text-sm font-semibold text-ink hover:text-brand hover:underline cursor-pointer">
                {tmpl.name}
              </button>
              {tmpl.description ? (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                  {tmpl.description}
                </p>
              ) : (
                <p className="mt-0.5 text-xs italic text-muted/40">—</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: t("onboarding.template.col.stages"),
      key: "stages",
      responsive: ["sm", "md", "lg", "xl", "xxl"],
      render: (_: unknown, tmpl: OnboardingTemplate) => {
        const stagesCount = tmpl.stages?.length ?? 0;
        return (
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-muted">
            {stagesCount > 0
              ? t("onboarding.template.stages_count", { count: stagesCount })
              : t("onboarding.template.no_stages")}
          </span>
        );
      },
    },
    {
      title: t("onboarding.template.col.status"),
      key: "status",
      responsive: ["sm", "md", "lg", "xl", "xxl"],
      render: (_: unknown, tmpl: OnboardingTemplate) => (
        <StatusBadge status={tmpl.status} />
      ),
    },
    {
      title: t("onboarding.template.col.updated_at"),
      key: "updatedAt",
      responsive: ["lg", "xl", "xxl"],
      render: (_: unknown, tmpl: OnboardingTemplate) => {
        const formattedDate = tmpl.updatedAt
          ? new Date(tmpl.updatedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "—";
        return <span className="text-sm text-muted">{formattedDate}</span>;
      },
    },
    {
      title: t("onboarding.template.col.actions"),
      key: "actions",
      width: 220,
      render: (_: unknown, tmpl: OnboardingTemplate) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="small" onClick={() => handleEdit(tmpl)}>
            {t("onboarding.template.action.edit")}
          </Button>
          <Button size="small" onClick={() => handleDuplicate(tmpl)}>
            {t("onboarding.template.action.duplicate")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("onboarding.template.command.new_title")}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {t("onboarding.template.command.new_desc")}
          </p>
          <Button type="primary" className="mt-3" onClick={handleNewTemplate}>
            {t("onboarding.template.action.new")}
          </Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("onboarding.template.command.clone_title")}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {t("onboarding.template.command.clone_desc")}
          </p>
          <div className="mt-3 flex gap-2">
            <Select
              placeholder={t("onboarding.template.clone.placeholder")}
              value={cloneSourceId}
              onChange={setCloneSourceId}
              options={templateOptions}
              className="min-w-0 flex-1"
              showSearch
              optionFilterProp="label"
            />
            <Button onClick={handleCloneFromPicker}>
              {t("onboarding.template.action.duplicate")}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
          <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            {t("onboarding.template.command.ai_title")}
          </p>
          <p className="mt-1 text-sm text-blue-800/80">
            {t("onboarding.template.command.ai_desc")}
          </p>
          <Button className="mt-3" onClick={() => setAiOpen(true)}>
            <WandSparkles className="mr-1 h-3.5 w-3.5" />
            {t("onboarding.template.ai.open")}
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2">
        <Typography.Text type="secondary">
          {t("onboarding.template.command.hint")}
        </Typography.Text>

        <div className="flex items-center gap-2">
          <Input.Search
            placeholder={t("onboarding.template.search.placeholder")}
            allowClear
            className="w-72"
            onSearch={(v) => setSearchText(v.trim())}
            onChange={(e) => {
              if (!e.target.value) setSearchText("");
            }}
          />
          <Select<StatusFilter>
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            className="w-36"
          />
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <p className="flex-1 text-sm text-red-700">
            {(error as Error)?.message ??
              t("onboarding.template.error.something_wrong")}
          </p>
          <Button size="small" onClick={() => refetch()}>
            {t("onboarding.template.error.retry")}
          </Button>
        </div>
      )}

      <MyTable<OnboardingTemplate>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={isLoading}
        wrapClassName="!h-full w-full"
        pagination={false}
        locale={{
          emptyText: (
            <div className="flex flex-col items-center gap-4 py-8">
              <Empty
                description={
                  statusFilter === "INACTIVE"
                    ? t("onboarding.template.empty.inactive_title")
                    : t("onboarding.template.empty.active_title")
                }
              />
              {statusFilter !== "INACTIVE" && (
                <Button type="primary" onClick={handleNewTemplate}>
                  {t("onboarding.template.action.new")}
                </Button>
              )}
            </div>
          ),
        }}
      />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span>Tạo quy trình onboarding bằng AI</span>
          </div>
        }
        open={aiOpen}
        onCancel={() => { setAiOpen(false); aiForm.resetFields(); }}
        footer={null}
        width={520}>
        <div className="pt-2">
          <Typography.Text type="secondary" className="text-xs block mb-4">
            Cung cấp thông tin công ty để AI tạo quy trình onboarding phù hợp và lưu ngay vào danh sách templates.
          </Typography.Text>
          <Form form={aiForm} layout="vertical" requiredMark={false}>
            <Form.Item
              name="industry"
              label="Ngành nghề"
              rules={[{ required: true, message: "Vui lòng chọn ngành nghề" }]}>
              <Select
                placeholder="Chọn ngành nghề..."
                options={INDUSTRY_OPTIONS}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item
              name="companySize"
              label="Quy mô công ty"
              rules={[{ required: true, message: "Vui lòng chọn quy mô" }]}>
              <Select placeholder="Chọn quy mô..." options={COMPANY_SIZE_OPTIONS} />
            </Form.Item>
            <Form.Item
              name="jobRole"
              label="Vị trí nhân viên mới"
              rules={[{ required: true, message: "Vui lòng nhập vị trí" }]}>
              <Input placeholder="Ví dụ: Software Engineer, Sales Manager, Kế toán..." />
            </Form.Item>
          </Form>
          <div className="flex items-center justify-end gap-2 mt-2">
            <Button onClick={() => { setAiOpen(false); aiForm.resetFields(); }}>
              Huỷ
            </Button>
            <Button
              type="primary"
              loading={aiGenerateMutation.isPending}
              onClick={handleAIGenerate}
              icon={<WandSparkles className="h-3.5 w-3.5" />}>
              {aiGenerateMutation.isPending ? "Đang tạo..." : "Tạo với AI"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Templates;
