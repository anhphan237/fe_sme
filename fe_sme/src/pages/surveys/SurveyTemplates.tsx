import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Archive, Plus, Search, Trash2 } from "lucide-react";
import MyTable from "@/components/table";
import BaseButton from "@/components/button";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import ConfirmModal, {
  CONFIRM_CODE,
  type ConfirmModalHandles,
} from "@core/components/Modal/ConfirmModal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import { notify } from "@/utils/notify";
import {
  apiArchiveSurveyTemplate,
  apiDeleteSurveyTemplate,
  apiListSurveyTemplates,
} from "@/api/survey/survey.api";
import { extractList } from "@/api/core/types";
import type { SurveyTemplateSummary } from "@/interface/survey";
import { StageTag, TemplateStatusTag } from "./components/SurveyStatusTag";

type TemplateTab = "ONBOARDING" | "MANAGER_EVALUATION";

type SurveyTemplateRow = SurveyTemplateSummary & {
  targetRole?: string | null;
  target_role?: string | null;
};

const normalizeStage = (stage?: string | null) => {
  const value = String(stage ?? "")
    .trim()
    .toUpperCase();

  if (value === "DAY_7" || value === "D7") return "D7";
  if (value === "DAY_30" || value === "D30") return "D30";
  if (value === "DAY_60" || value === "D60") return "D60";
  if (value === "COMPLETED" || value === "DONE" || value === "FINISHED") {
    return "COMPLETED";
  }
  if (value === "CUSTOM") return "CUSTOM";

  return value;
};

const normalizeTargetRole = (template?: Partial<SurveyTemplateRow>) =>
  String(template?.targetRole ?? template?.target_role ?? "")
    .trim()
    .toUpperCase();

const isManagerEvaluationTemplate = (template: SurveyTemplateSummary) => {
  const row = template as SurveyTemplateRow;

  return (
    normalizeStage(row.stage) === "COMPLETED" &&
    normalizeTargetRole(row) === "MANAGER"
  );
};

const getStageFilterOptions = (t: (key: string) => string) => [
  { value: "", label: t("survey.template.filter.allStages") },
  { value: "D7", label: t("survey.template.stage.d7") },
  { value: "D30", label: t("survey.template.stage.d30") },
  { value: "D60", label: t("survey.template.stage.d60") },
  { value: "CUSTOM", label: t("survey.template.stage.custom") },
];

const getStatusFilterOptions = (t: (key: string) => string) => [
  { value: "", label: t("survey.template.filter.allStatuses") },
  { value: "ACTIVE", label: t("survey.template.status.active") },
  { value: "ARCHIVED", label: t("survey.template.status.archived") },
  { value: "DRAFT", label: t("survey.template.status.draft") },
];

const SurveyTemplates = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const archiveConfirmRef = useRef<ConfirmModalHandles>(null);
  const deleteConfirmRef = useRef<ConfirmModalHandles>(null);

  const [activeTab, setActiveTab] = useState<TemplateTab>("ONBOARDING");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const queryClient = useQueryClient();

  const stageFilterOptions = useMemo(() => getStageFilterOptions(t), [t]);
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);

  const {
    data: templatesRaw,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["survey-templates"],
    queryFn: () => apiListSurveyTemplates(),
  });

  const templates = extractList<SurveyTemplateSummary>(
    templatesRaw,
    "items",
    "templates",
  );

  const refetchTemplates = async () => {
    await queryClient.invalidateQueries({ queryKey: ["survey-templates"] });
    await queryClient.refetchQueries({ queryKey: ["survey-templates"] });
  };

  const archiveMutation = useMutation({
    mutationFn: (templateId: string) =>
      apiArchiveSurveyTemplate({ templateId }),
    onSuccess: async () => {
      notify.success(t("survey.template.archive_success"));
      await refetchTemplates();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("global.save_failed");

      if (message.includes("survey template not found")) {
        notify.error(t("survey.template.error.notFound"));
        return;
      }

      notify.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (templateId: string) => apiDeleteSurveyTemplate({ templateId }),
    onSuccess: async () => {
      notify.success(t("survey.template.delete_success"));
      await refetchTemplates();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("global.save_failed");

      if (
        message.includes("template already used") ||
        message.includes("template already sent")
      ) {
        notify.error(t("survey.template.error.usedArchiveOnly"));
        return;
      }

      if (message.includes("survey template not found")) {
        notify.error(t("survey.template.error.notFound"));
        return;
      }

      notify.error(message);
    },
  });

  const handleArchive = async (row: SurveyTemplateSummary) => {
    const result = await archiveConfirmRef.current?.open({
      message:
        t("survey.template.archive_confirm", { name: row.name }) ||
        `Archive template "${row.name}"?`,
    });

    if (result?.code === CONFIRM_CODE.CONFIRMED) {
      archiveMutation.mutate(row.templateId);
    }
  };

  const handleDelete = async (row: SurveyTemplateSummary) => {
    const result = await deleteConfirmRef.current?.open({
      message: t("survey.template.delete_confirm", { name: row.name }),
    });

    if (result?.code === CONFIRM_CODE.CONFIRMED) {
      deleteMutation.mutate(row.templateId);
    }
  };

  const onboardingTemplates = useMemo(
    () =>
      templates.filter((template) => !isManagerEvaluationTemplate(template)),
    [templates],
  );

  const managerEvaluationTemplates = useMemo(
    () => templates.filter(isManagerEvaluationTemplate),
    [templates],
  );

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    const source =
      activeTab === "MANAGER_EVALUATION"
        ? managerEvaluationTemplates
        : onboardingTemplates;

    return source.filter((tmpl) => {
      const name = String(tmpl.name ?? "").toLowerCase();
      const matchSearch = !kw || name.includes(kw);
      const matchStage =
        activeTab === "MANAGER_EVALUATION" ||
        !stageFilter ||
        normalizeStage(tmpl.stage) === stageFilter;
      const matchStatus =
        !statusFilter ||
        String(tmpl.status ?? "").toUpperCase() === statusFilter;

      return matchSearch && matchStage && matchStatus;
    });
  }, [
    activeTab,
    onboardingTemplates,
    managerEvaluationTemplates,
    search,
    stageFilter,
    statusFilter,
  ]);

  const handleCreateTemplate = () => {
    if (activeTab === "MANAGER_EVALUATION") {
      navigate("/surveys/templates/new", {
        state: {
          preset: "MANAGER_EVALUATION_COMPLETED",
          name: t("survey.template.managerEvaluation.defaultName"),
          description: t(
            "survey.template.managerEvaluation.defaultDescription",
          ),
          stage: "COMPLETED",
          targetRole: "MANAGER",
          isDefault: true,
          status: "ACTIVE",
        },
      });
      return;
    }

    navigate("/surveys/templates/new");
  };

  const columns: ColumnsType<SurveyTemplateSummary> = [
    {
      title: t("survey.template.col.name"),
      dataIndex: "name",
      key: "name",
      render: (name: string, row) => (
        <button
          type="button"
          className="text-left font-medium text-[#223A59] hover:text-[#3684DB] hover:underline"
          onClick={() => navigate(`/surveys/templates/${row.templateId}`)}
        >
          {name}
        </button>
      ),
    },
    {
      title: t("survey.template.col.stage"),
      dataIndex: "stage",
      key: "stage",
      width: 130,
      render: (value) => {
        const normalized = normalizeStage(value);

        if (normalized === "COMPLETED") {
          return (
            <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
              {t("survey.template.stage.completed")}
            </span>
          );
        }

        return <StageTag stage={normalized} />;
      },
    },
    {
      title: t("survey.template.col.targetRole"),
      key: "targetRole",
      width: 140,
      render: (_, row) => {
        const role = normalizeTargetRole(row as SurveyTemplateRow);

        return role === "MANAGER" ? (
          <span className="text-sm font-medium text-purple-600">
            {t("survey.role.manager")}
          </span>
        ) : (
          <span className="text-sm text-slate-500">
            {t("survey.role.employee")}
          </span>
        );
      },
    },
    {
      title: t("survey.template.col.status"),
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => <TemplateStatusTag status={status} />,
    },
    {
      title: t("survey.template.col.default"),
      dataIndex: "isDefault",
      width: 120,
      render: (_, row) => {
        const stage = normalizeStage(row.stage);

        if (stage === "CUSTOM") return "-";

        return row.isDefault ? (
          <span className="font-medium text-emerald-600">
            {t("survey.template.default.on")}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        );
      },
    },
    {
      title: t("global.action"),
      key: "actions",
      width: 240,
      render: (_, row) => {
        const status = String(row.status ?? "").toUpperCase();
        const canArchive = status !== "ARCHIVED";
        const canDelete = status !== "ARCHIVED";

        return (
          <div className="flex items-center gap-2">
            <BaseButton
              size="small"
              label="global.edit"
              onClick={() => navigate(`/surveys/templates/${row.templateId}`)}
            />

            {canArchive && (
              <BaseButton
                size="small"
                danger
                icon={<Archive className="h-3 w-3" />}
                label="survey.template.archive"
                loading={archiveMutation.isPending}
                onClick={() => handleArchive(row)}
              />
            )}

            {canDelete && (
              <BaseButton
                size="small"
                danger
                icon={<Trash2 className="h-3 w-3" />}
                label="global.delete"
                loading={deleteMutation.isPending}
                onClick={() => handleDelete(row)}
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("ONBOARDING");
              setStageFilter("");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "ONBOARDING"
                ? "bg-blue-50 text-blue-600"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {t("survey.template.tab.onboarding")}
            <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
              {onboardingTemplates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("MANAGER_EVALUATION");
              setStageFilter("");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "MANAGER_EVALUATION"
                ? "bg-blue-50 text-blue-600"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {t("survey.template.tab.managerEvaluation")}
            <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
              {managerEvaluationTemplates.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "MANAGER_EVALUATION" && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {t("survey.template.managerEvaluation.listNotice")}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="w-60">
          <BaseInput
            name="search"
            prefix={<Search className="h-3.5 w-3.5 text-slate-400" />}
            placeholder={t("survey.template.search_placeholder")}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>

        {activeTab === "ONBOARDING" && (
          <div className="w-40">
            <BaseSelect
              name="stage"
              options={stageFilterOptions}
              placeholder={t("survey.template.col.stage")}
              onChange={(v) => setStageFilter((v as string) || "")}
              allowClear
            />
          </div>
        )}

        <div className="w-44">
          <BaseSelect
            name="status"
            options={statusFilterOptions}
            placeholder={t("survey.template.col.status")}
            onChange={(v) => setStatusFilter((v as string) || "")}
            allowClear
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {t("survey.template.resultCount", { count: filtered.length })}
          </span>
          <BaseButton
            type="primary"
            icon={<Plus className="h-4 w-4" />}
            label={
              activeTab === "MANAGER_EVALUATION"
                ? "survey.template.managerEvaluation.createShort"
                : "survey.template.new"
            }
            onClick={handleCreateTemplate}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <MyTable
          columns={columns}
          dataSource={isError ? [] : filtered}
          rowKey="templateId"
          wrapClassName="w-full"
          loading={isLoading}
          pagination={{ showSizeChanger: true }}
          locale={{
            emptyText: isError ? (
              t("global.save_failed")
            ) : (
              <Empty
                description={
                  activeTab === "MANAGER_EVALUATION"
                    ? t("survey.template.managerEvaluation.empty")
                    : t("survey.template.empty.title")
                }
              />
            ),
          }}
        />
      </div>

      <ConfirmModal
        ref={archiveConfirmRef}
        title={t("survey.template.archive")}
      />
      <ConfirmModal ref={deleteConfirmRef} title={t("global.delete")} />
    </div>
  );
};

export default SurveyTemplates;
