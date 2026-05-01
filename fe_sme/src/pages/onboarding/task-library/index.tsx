import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Library,
  RefreshCw,
  Search as SearchIcon,
  Upload,
} from "lucide-react";
import {
  Button,
  Checkbox,
  Empty,
  Input,
  Modal,
  Result,
  Segmented,
  Select,
  Spin,
  Steps,
  Tag,
  Upload as AntUpload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import {
  apiListTaskLibraries,
  apiDownloadTaskLibraryTemplate,
  apiImportTaskLibraryExcel,
} from "@/api/onboarding/onboarding.api";
import { apiListDepartmentTypes } from "@/api/company/company.api";
import { extractList } from "@/api/core/types";
import MyTable from "@/components/table";
import type { TaskLibraryItem } from "@/interface/onboarding";
import type { DepartmentTypeItem } from "@/interface/company";
import { AppRouters } from "@/constants/router";
import TaskLibraryStatusTag from "@/core/components/Status/TaskLibraryStatusTag";

type StatusFilter = "ACTIVE" | "INACTIVE" | "";

type ImportModalProps = {
  onSuccess: () => void;
};

export interface ImportModalRef {
  open: () => void;
}

const ImportModal = forwardRef<ImportModalRef, ImportModalProps>(
  ({ onSuccess }, ref) => {
    const { t } = useLocale();
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);
    const [deptTypeCode, setDeptTypeCode] = useState<string>("");
    const [templateName, setTemplateName] = useState<string>("");
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [replaceExisting, setReplaceExisting] = useState(true);
    const [importResult, setImportResult] = useState<{
      importedTasks: number;
      templateId?: string;
    } | null>(null);
    const [importError, setImportError] = useState<string | null>(null);

    const stepLabels = [
      t("onboarding.task_library.import.step.dept") ?? "Phòng ban",
      t("onboarding.task_library.import.step.upload") ?? "Tải file",
      t("onboarding.task_library.import.step.review") ?? "Xem lại",
      t("onboarding.task_library.import.step.importing") ?? "Đang nhập",
      t("onboarding.task_library.import.step.result") ?? "Kết quả",
    ];

    useImperativeHandle(ref, () => ({
      open: () => {
        setVisible(true);
        setStep(0);
        setDeptTypeCode("");
        setTemplateName("");
        setFileList([]);
        setReplaceExisting(true);
        setImportResult(null);
        setImportError(null);
      },
    }));

    const onClose = () => {
      setVisible(false);
    };

    const { data: deptTypesRaw, isLoading: isLoadingDepts } = useQuery({
      queryKey: ["department-types", "ACTIVE"],
      queryFn: () => apiListDepartmentTypes({ status: "ACTIVE" }),
      enabled: visible,
    });
    const deptTypes = (
      Array.isArray(deptTypesRaw)
        ? deptTypesRaw
        : extractList(
            deptTypesRaw as unknown as Record<string, unknown>,
            "items",
          )
    ) as DepartmentTypeItem[];

    const deptTypeName =
      deptTypes.find((d) => d.code === deptTypeCode)?.name ?? deptTypeCode;

    const runImport = async () => {
      if (!fileList[0]?.originFileObj || !deptTypeCode) return;
      setStep(3);
      setImportError(null);
      try {
        const fd = new FormData();
        fd.append("file", fileList[0].originFileObj as File);
        fd.append("departmentTypeCode", deptTypeCode);
        if (templateName.trim()) fd.append("templateName", templateName.trim());
        fd.append("replaceExisting", String(replaceExisting));
        const res = (await apiImportTaskLibraryExcel(fd)) as unknown as Record<
          string,
          unknown
        >;
        const count =
          (res.importedTasks as number) ??
          (res.data as Record<string, unknown>)?.importedTasks ??
          0;
        setImportResult({
          importedTasks: typeof count === "number" ? count : 0,
          templateId: (res.templateId as string) ?? undefined,
        });
        onSuccess();
      } catch (err) {
        setImportError(
          err instanceof Error
            ? err.message
            : "Import thất bại. Vui lòng thử lại.",
        );
      } finally {
        setStep(4);
      }
    };

    const canNext = (() => {
      if (step === 0) return Boolean(deptTypeCode);
      if (step === 1) return fileList.length > 0;
      if (step === 2) return true;
      return false;
    })();

    const stepContent = () => {
      switch (step) {
        case 0:
          return (
            <div className="space-y-3 py-2">
              <p className="text-sm text-gray-600">
                {t("onboarding.task_library.import.dept_step_hint") ??
                  "Chọn loại phòng ban sẽ được gán cho Task Library này."}
              </p>
              <Select
                showSearch
                loading={isLoadingDepts}
                value={deptTypeCode || undefined}
                onChange={(v) => setDeptTypeCode(v ?? "")}
                placeholder={
                  t("onboarding.task_library.import.dept_placeholder") ??
                  "Chọn loại phòng ban..."
                }
                filterOption={(input, option) =>
                  ((option?.label as string) ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                className="w-full"
                options={deptTypes.map((d) => ({
                  value: d.code,
                  label: `${d.name} (${d.code})`,
                }))}
              />
            </div>
          );
        case 1:
          return (
            <div className="space-y-3 py-2">
              <AntUpload.Dragger
                accept=".xlsx"
                maxCount={1}
                fileList={fileList}
                beforeUpload={() => false}
                onChange={({ fileList: fl }) => setFileList(fl)}
              >
                <p className="ant-upload-drag-icon">
                  <FileSpreadsheet className="mx-auto h-8 w-8 text-slate-400" />
                </p>
                <p className="ant-upload-text text-sm">
                  {t("onboarding.task_library.import.file_drag_text") ??
                    "Click hoặc kéo thả file .xlsx vào đây"}
                </p>
                <p className="ant-upload-hint text-xs text-gray-400">
                  {t("onboarding.task_library.import.file_format_hint") ??
                    "Chỉ hỗ trợ định dạng .xlsx"}
                </p>
              </AntUpload.Dragger>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  {t("onboarding.task_library.import.template_name_label") ??
                    "Tên template (tuỳ chọn)"}
                </label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={
                    t(
                      "onboarding.task_library.import.template_name_placeholder",
                    ) ?? "Tên cho task library này..."
                  }
                />
              </div>
            </div>
          );
        case 2:
          return (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    {t("onboarding.task_library.import.review.dept") ??
                      "Phòng ban"}
                    :
                  </span>
                  <Tag color="blue">{deptTypeName}</Tag>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    {t("onboarding.task_library.import.review.file") ?? "File"}:
                  </span>
                  <span className="font-medium text-gray-700">
                    {fileList[0]?.name ?? "—"}
                  </span>
                </div>
                {templateName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {t("onboarding.task_library.import.review.name") ??
                        "Tên template"}
                      :
                    </span>
                    <span className="font-medium text-gray-700">
                      {templateName}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    {t("onboarding.task_library.import.replace_confirm") ??
                      "Ghi đè nếu đã tồn tại"}
                    :
                  </span>
                  <Checkbox
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                  >
                    <span className="text-xs">
                      {replaceExisting
                        ? (t("onboarding.task_library.import.replace_yes") ??
                          "Có — ghi đè")
                        : (t("onboarding.task_library.import.replace_no") ??
                          "Không — tạo mới")}
                    </span>
                  </Checkbox>
                </div>
              </div>
              <p className="text-xs text-amber-600">
                {t("onboarding.task_library.import.confirm_hint") ?? "Nhấn"}{" "}
                <strong>
                  {t("onboarding.task_library.import.btn.start") ?? "Nhập khẩu"}
                </strong>{" "}
                {t("onboarding.task_library.import.confirm_hint_suffix") ??
                  "để bắt đầu import dữ liệu."}
              </p>
            </div>
          );
        case 3:
          return (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <Spin size="large" />
              <p className="text-sm text-gray-600">
                {t("onboarding.task_library.import.loading_text") ??
                  "Đang nhập dữ liệu..."}
              </p>
            </div>
          );
        case 4:
          return importError ? (
            <Result
              status="error"
              title={
                t("onboarding.task_library.import.error_title") ??
                "Import thất bại"
              }
              subTitle={importError}
            />
          ) : (
            <Result
              status="success"
              icon={
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              }
              title={
                t("onboarding.task_library.import.success_title") ??
                "Import thành công!"
              }
              subTitle={
                t("onboarding.task_library.import.success_desc", {
                  count: String(importResult?.importedTasks ?? 0),
                }) ??
                `Đã nhập ${importResult?.importedTasks ?? 0} task vào thư viện.`
              }
            />
          );
        default:
          return null;
      }
    };

    const footerButtons = () => {
      if (step === 3) return null; // No buttons during import
      if (step === 4) {
        return (
          <div className="flex justify-end">
            <Button type="primary" onClick={onClose}>
              {t("onboarding.task_library.import.btn.close") ?? "Đóng"}
            </Button>
          </div>
        );
      }
      return (
        <div className="flex justify-between">
          <Button
            onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
            disabled={step === 3}
          >
            {step === 0
              ? (t("onboarding.task_library.import.btn.cancel") ?? "Huỷ")
              : (t("onboarding.task_library.import.btn.back") ?? "Quay lại")}
          </Button>
          <Button
            type="primary"
            disabled={!canNext}
            onClick={step === 2 ? runImport : () => setStep((s) => s + 1)}
          >
            {step === 2
              ? (t("onboarding.task_library.import.btn.start") ?? "Nhập khẩu")
              : (t("onboarding.task_library.import.btn.next") ?? "Tiếp theo")}
          </Button>
        </div>
      );
    };

    return (
      <Modal
        open={visible}
        onCancel={step === 3 ? undefined : onClose}
        closable={step !== 3}
        maskClosable={false}
        title={
          t("onboarding.task_library.import.title") ?? "Import Task Library"
        }
        footer={null}
        width={520}
        destroyOnClose
      >
        <Steps
          current={Math.min(step, 4)}
          size="small"
          className="mb-6 mt-2"
          items={stepLabels.map((label) => ({ title: label }))}
        />
        {stepContent()}
        <div className="mt-6">{footerButtons()}</div>
      </Modal>
    );
  },
);

const MetricCard = ({
  icon,
  label,
  value,
  toneClass,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  toneClass: string;
}) => (
  <div className="flex min-h-[92px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClass}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-2xl font-semibold leading-none text-slate-900">
        {value}
      </div>
      <div className="mt-1 truncate text-xs font-medium text-slate-500">
        {label}
      </div>
    </div>
  </div>
);

const TaskLibrary = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const currentUser = useUserStore((s) => s.currentUser);
  const isHR = ((currentUser?.roles ?? []) as string[]).includes("HR");

  const importModalRef = useRef<ImportModalRef>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const queryKey = ["task-libraries", statusFilter, page, pageSize] as const;

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      apiListTaskLibraries({
        status: statusFilter || undefined,
        page,
        size: pageSize,
      }),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(keyword) ||
        (it.departmentTypeName ?? "").toLowerCase().includes(keyword) ||
        (it.departmentTypeCode ?? "").toLowerCase().includes(keyword),
    );
  }, [items, search]);

  const stats = useMemo(() => {
    const departments = new Set(
      filtered
        .map((it) => it.departmentTypeCode ?? it.departmentTypeName)
        .filter(Boolean),
    );
    return {
      total: totalCount,
      departments: departments.size,
      active: filtered.filter((it) => it.status === "ACTIVE").length,
      inactive: filtered.filter((it) => it.status === "INACTIVE").length,
    };
  }, [filtered, totalCount]);

  const hasActiveFilter = Boolean(search.trim() || statusFilter !== "ACTIVE");

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ACTIVE");
    setPage(1);
  };

  const downloadMutation = useMutation({
    mutationFn: apiDownloadTaskLibraryTemplate,
    onError: () => message.error("Download failed"),
  });

  const columns: ColumnsType<TaskLibraryItem> = [
    {
      title: t("onboarding.task_library.col.name"),
      dataIndex: "name",
      key: "name",
      render: (name: string, row: TaskLibraryItem) => (
        <div className="flex items-center gap-3 py-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
            <Library className="h-4 w-4 text-brand" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900">{name}</div>
            <div className="mt-0.5 truncate text-xs text-slate-400">
              {row.templateId}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t("onboarding.task_library.col.department"),
      dataIndex: "departmentTypeName",
      key: "department",
      render: (name?: string, row?: TaskLibraryItem) =>
        name ? (
          <Tag color="blue" className="!m-0">
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {name}
            </span>
          </Tag>
        ) : (
          <span className="text-slate-400 text-xs">
            {row?.departmentTypeCode ?? "—"}
          </span>
        ),
    },
    {
      title: t("onboarding.task_library.col.status"),
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (s: string) => <TaskLibraryStatusTag status={s} />,
    },
  ];

  const pageLoading = isLoading;
  const refreshOverlay = isFetching && !pageLoading;

  return (
    <div className="relative flex flex-col gap-5 p-6">
      {refreshOverlay && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center bg-white/55 backdrop-blur-[1px]">
          <div className="mt-28 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-lg">
            <Spin />
            <span>{t("global.loading")}</span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <Input
              prefix={<SearchIcon className="h-4 w-4 text-slate-400" />}
              placeholder={t("global.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className="w-full lg:max-w-xs"
            />
            <Segmented<StatusFilter>
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={[
                {
                  value: "",
                  label: t("onboarding.task_library.filter.all"),
                },
                {
                  value: "ACTIVE",
                  label: t("onboarding.task_library.filter.active"),
                },
                {
                  value: "INACTIVE",
                  label: t("onboarding.task_library.filter.inactive"),
                },
              ]}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isHR && (
              <>
                <Button
                  icon={<Download className="h-4 w-4" />}
                  loading={downloadMutation.isPending}
                  onClick={() => downloadMutation.mutate()}
                >
                  {t("onboarding.task_library.action.download_template")}
                </Button>
                <Button
                  type="primary"
                  icon={<Upload className="h-4 w-4" />}
                  onClick={() => importModalRef.current?.open()}
                >
                  {t("onboarding.task_library.action.import")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard
          icon={<Library className="h-5 w-5 text-brand" />}
          label={t("onboarding.task_library.title")}
          value={stats.total}
          toneClass="bg-brand/10"
        />
        <MetricCard
          icon={<Building2 className="h-5 w-5 text-blue-600" />}
          label={t("onboarding.task_library.col.department")}
          value={stats.departments}
          toneClass="bg-blue-50"
        />
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          label={t("onboarding.task_library.filter.active")}
          value={stats.active}
          toneClass="bg-emerald-50"
        />
        <MetricCard
          icon={<Library className="h-5 w-5 text-slate-500" />}
          label={t("onboarding.task_library.filter.inactive")}
          value={stats.inactive}
          toneClass="bg-slate-100"
        />
      </div>

      <div className="overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          {search.trim() && (
            <Tag color="blue" className="!m-0">
              {filtered.length} / {items.length}
            </Tag>
          )}
        </div>

        {pageLoading ? (
          <div className="flex min-h-[430px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70">
            <Spin size="large" tip={t("global.loading")} />
          </div>
        ) : isError ? (
          <div className="flex min-h-[430px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-red-100 bg-red-50/40 p-6 text-center">
            <div className="text-sm font-medium text-red-600">
              {error instanceof Error ? error.message : "Error"}
            </div>
            <Button type="primary" onClick={() => refetch()}>
              {t("global.retry")}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[430px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="flex flex-col items-center gap-1">
                  <span className="font-medium text-slate-700">
                    {t("onboarding.task_library.empty.title")}
                  </span>
                  <span className="text-slate-400 text-sm">
                    {t("onboarding.task_library.empty.desc")}
                  </span>
                </div>
              }
            >
              {hasActiveFilter && (
                <Button onClick={resetFilters}>{t("global.reset")}</Button>
              )}
            </Empty>
          </div>
        ) : (
          <MyTable<TaskLibraryItem>
            columns={columns}
            dataSource={filtered}
            rowKey="templateId"
            onRow={(row) => ({
              onClick: () =>
                navigate(
                  `${AppRouters.ONBOARDING_TASK_LIBRARY}/${row.templateId}`,
                ),
              className: "cursor-pointer",
            })}
            pagination={
              search.trim()
                ? false
                : {
                    current: page,
                    pageSize,
                    total: totalCount,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                    showTotal: (total) =>
                      t("global.pagination.total", {
                        total: String(total),
                      }),
                    onChange: (p, ps) => {
                      setPage(p);
                      setPageSize(ps);
                    },
                  }
            }
          />
        )}
      </div>

      <ImportModal
        ref={importModalRef}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["task-libraries"] })
        }
      />
    </div>
  );
};

export default TaskLibrary;
