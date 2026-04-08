import { useState } from "react";
import {
  Card,
  Skeleton,
  Empty,
  Modal,
  Input,
  Form,
  message,
  Pagination,
  Tooltip,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Archive, Globe, Search, BookOpen } from "lucide-react";
import {
  apiGetPlatformTemplateList,
  apiCreatePlatformTemplate,
  apiUpdatePlatformTemplate,
  apiPublishPlatformTemplate,
  apiArchivePlatformTemplate,
} from "@/api/platform/platform.api";
import { useLocale } from "@/i18n";
import type { PlatformTemplateItem } from "@/interface/platform";

const PAGE_SIZE = 12;

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-green-100 text-green-700",
  ARCHIVED: "bg-rose-100 text-rose-500",
};

const usePlatformTemplates = (params: {
  page: number;
  search: string;
  status: string;
}) =>
  useQuery({
    queryKey: ["platform-templates", params],
    queryFn: () =>
      apiGetPlatformTemplateList({
        page: params.page,
        size: PAGE_SIZE,
        search: params.search || undefined,
        status: params.status || undefined,
      }),
    select: (res: any) => ({
      items: (res?.data?.items ?? res?.items ?? []) as PlatformTemplateItem[],
      total: res?.data?.total ?? res?.total ?? 0,
    }),
  });

const PlatformTemplates = () => {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlatformTemplateItem | null>(
    null,
  );
  const [form] = Form.useForm();

  const { data, isLoading, isError, refetch } = usePlatformTemplates({
    page,
    search,
    status: statusFilter,
  });

  const templates = data?.items ?? [];
  const total = data?.total ?? 0;

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["platform-templates"] });

  const createMutation = useMutation({
    mutationFn: apiCreatePlatformTemplate,
    onSuccess: () => {
      message.success(t("platform.templates.create_success"));
      setCreateOpen(false);
      form.resetFields();
      invalidate();
    },
    onError: () => message.error(t("platform.templates.create_error")),
  });

  const updateMutation = useMutation({
    mutationFn: apiUpdatePlatformTemplate,
    onSuccess: () => {
      message.success(t("platform.templates.update_success"));
      setEditTarget(null);
      form.resetFields();
      invalidate();
    },
    onError: () => message.error(t("platform.templates.update_error")),
  });

  const publishMutation = useMutation({
    mutationFn: (templateId: string) =>
      apiPublishPlatformTemplate({ templateId }),
    onSuccess: () => {
      message.success(t("platform.templates.publish_success"));
      invalidate();
    },
    onError: () => message.error(t("platform.templates.publish_error")),
  });

  const archiveMutation = useMutation({
    mutationFn: (templateId: string) =>
      apiArchivePlatformTemplate({ templateId }),
    onSuccess: () => {
      message.success(t("platform.templates.archive_success"));
      invalidate();
    },
    onError: () => message.error(t("platform.templates.archive_error")),
  });

  const handleFormSubmit = () => {
    form.validateFields().then((values) => {
      if (editTarget) {
        updateMutation.mutate({ templateId: editTarget.templateId, ...values });
      } else {
        createMutation.mutate(values);
      }
    });
  };

  const openEdit = (tpl: PlatformTemplateItem) => {
    setEditTarget(tpl);
    form.setFieldsValue({ name: tpl.name, description: tpl.description });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {t("platform.templates.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("platform.templates.subtitle")}
          </p>
        </div>
        <button
          onClick={() => {
            form.resetFields();
            setEditTarget(null);
            setCreateOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">
          <Plus className="h-4 w-4" />
          {t("platform.templates.create_btn")}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-stroke bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-violet-300"
            placeholder={t("platform.templates.search_placeholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="rounded-xl border border-stroke bg-white px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}>
          <option value="">{t("global.all")}</option>
          <option value="DRAFT">{t("platform.templates.status_draft")}</option>
          <option value="PUBLISHED">
            {t("platform.templates.status_published")}
          </option>
          <option value="ARCHIVED">
            {t("platform.templates.status_archived")}
          </option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <div className="p-4 text-sm text-red-500">
            {t("platform.templates.load_error")}{" "}
            <button
              className="font-semibold underline"
              onClick={() => refetch()}>
              {t("global.retry")}
            </button>
          </div>
        </Card>
      ) : templates.length === 0 ? (
        <Card>
          <Empty
            image={<BookOpen className="mx-auto h-12 w-12 text-slate-300" />}
            description={t("platform.templates.empty")}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Card
              key={tpl.templateId}
              className="group relative flex flex-col"
              hoverable>
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-violet-100 p-2">
                    <BookOpen className="h-4 w-4 text-violet-600" />
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[tpl.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {tpl.status}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {tpl.usedByCount} {t("platform.templates.used_by")}
                </span>
              </div>

              <h3 className="font-semibold text-slate-800 line-clamp-1">
                {tpl.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                {tpl.description || t("platform.templates.no_description")}
              </p>

              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                <span>
                  {tpl.checklistCount} {t("platform.templates.checklists")}
                </span>
                <span>·</span>
                <span>
                  {tpl.taskCount} {t("platform.templates.tasks")}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-stroke pt-3">
                {tpl.status !== "ARCHIVED" && (
                  <button
                    className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                    onClick={() => openEdit(tpl)}>
                    {t("global.edit")}
                  </button>
                )}
                {tpl.status === "DRAFT" && (
                  <Tooltip title={t("platform.templates.publish_tooltip")}>
                    <button
                      className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                      onClick={() => publishMutation.mutate(tpl.templateId)}
                      disabled={publishMutation.isPending}>
                      <Globe className="h-3 w-3" />
                      {t("platform.templates.publish_btn")}
                    </button>
                  </Tooltip>
                )}
                {tpl.status === "PUBLISHED" && (
                  <Tooltip title={t("platform.templates.archive_tooltip")}>
                    <button
                      className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                      onClick={() => archiveMutation.mutate(tpl.templateId)}
                      disabled={archiveMutation.isPending}>
                      <Archive className="h-3 w-3" />
                      {t("platform.templates.archive_btn")}
                    </button>
                  </Tooltip>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex justify-end">
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={setPage}
          />
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={createOpen || !!editTarget}
        title={
          editTarget
            ? t("platform.templates.edit_modal_title")
            : t("platform.templates.create_modal_title")
        }
        okText={
          editTarget ? t("global.save") : t("platform.templates.create_btn")
        }
        cancelText={t("global.cancel")}
        onCancel={() => {
          setCreateOpen(false);
          setEditTarget(null);
          form.resetFields();
        }}
        onOk={handleFormSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose>
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label={t("platform.templates.field_name")}
            rules={[
              {
                required: true,
                message: t("global.required", {
                  field: t("platform.templates.field_name"),
                }),
              },
            ]}>
            <Input
              placeholder={t("platform.templates.field_name_placeholder")}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label={t("platform.templates.field_description")}>
            <Input.TextArea
              rows={3}
              placeholder={t(
                "platform.templates.field_description_placeholder",
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PlatformTemplates;
