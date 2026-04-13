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

const normalizeStage = (stage?: string | null) => {
  const value = String(stage ?? "")
    .trim()
    .toUpperCase();

  if (value === "DAY_7" || value === "D7") return "D7";
  if (value === "DAY_30" || value === "D30") return "D30";
  if (value === "DAY_60" || value === "D60") return "D60";
  if (value === "CUSTOM") return "CUSTOM";

  return value;
};

const STAGE_OPTIONS = [
  { value: "", label: "All stages" },
  { value: "D7", label: "Day 7" },
  { value: "D30", label: "Day 30" },
  { value: "D60", label: "Day 60" },
  { value: "CUSTOM", label: "Custom" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All status" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "DRAFT", label: "Draft" },
];

const SurveyTemplates = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const archiveConfirmRef = useRef<ConfirmModalHandles>(null);
  const deleteConfirmRef = useRef<ConfirmModalHandles>(null);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const queryClient = useQueryClient();

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
      notify.success(
        t("survey.template.archive_success") || "Archive template successfully",
      );
      await refetchTemplates();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("global.save_failed");

      if (message.includes("survey template not found")) {
        notify.error(
          "Template không tồn tại hoặc không thuộc công ty hiện tại.",
        );
        return;
      }

      notify.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (templateId: string) => apiDeleteSurveyTemplate({ templateId }),
    onSuccess: async () => {
      notify.success("Xóa mẫu khảo sát thành công");
      await refetchTemplates();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t("global.save_failed");

      if (
        message.includes("template already used") ||
        message.includes("template already sent")
      ) {
        notify.error("Mẫu này đã được gửi, chỉ có thể lưu trữ.");
        return;
      }

      if (message.includes("survey template not found")) {
        notify.error(
          "Template không tồn tại hoặc không thuộc công ty hiện tại.",
        );
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
      message: `Bạn có chắc muốn xóa mẫu khảo sát "${row.name}"? Nếu mẫu đã từng được gửi, hệ thống sẽ không cho xóa và bạn cần dùng chức năng lưu trữ.`,
    });

    if (result?.code === CONFIRM_CODE.CONFIRMED) {
      deleteMutation.mutate(row.templateId);
    }
  };

  const filtered = useMemo(() => {
    const kw = search.toLowerCase();
    return templates.filter((tmpl) => {
      const matchSearch = !kw || tmpl.name.toLowerCase().includes(kw);
      const matchStage =
        !stageFilter || normalizeStage(tmpl.stage) === stageFilter;
      const matchStatus = !statusFilter || tmpl.status === statusFilter;
      return matchSearch && matchStage && matchStatus;
    });
  }, [templates, search, stageFilter, statusFilter]);

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
      width: 120,
      render: (value) => <StageTag stage={normalizeStage(value)} />,
    },
    {
      title: t("survey.template.col.status"),
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => <TemplateStatusTag status={status} />,
    },
    {
      title: "Default",
      dataIndex: "isDefault",
      render: (_, row) => {
        const stage = normalizeStage(row.stage);

        if (stage === "CUSTOM") return "-";

        return row.isDefault ? (
          <span className="font-medium text-emerald-600">Default</span>
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

        <div className="w-36">
          <BaseSelect
            name="stage"
            options={STAGE_OPTIONS}
            placeholder={t("survey.template.col.stage")}
            onChange={(v) => setStageFilter((v as string) || "")}
            allowClear
          />
        </div>

        <div className="w-36">
          <BaseSelect
            name="status"
            options={STATUS_OPTIONS}
            placeholder={t("survey.template.col.status")}
            onChange={(v) => setStatusFilter((v as string) || "")}
            allowClear
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {filtered.length} {filtered.length === 1 ? "template" : "templates"}
          </span>
          <BaseButton
            type="primary"
            icon={<Plus className="h-4 w-4" />}
            label="survey.template.new"
            onClick={() => navigate("/surveys/templates/new")}
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
              <Empty description={t("survey.template.empty.title")} />
            ),
          }}
        />
      </div>

      <ConfirmModal
        ref={archiveConfirmRef}
        title={t("survey.template.archive") || "Archive"}
      />
      <ConfirmModal
        ref={deleteConfirmRef}
        title={t("global.delete") || "Delete"}
      />
    </div>
  );
};

export default SurveyTemplates;
