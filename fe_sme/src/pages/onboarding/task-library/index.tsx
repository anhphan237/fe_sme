import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Library,
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
  Select,
  Skeleton,
  Spin,
  Steps,
  Tag,
  Typography,
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

const { Title, Text } = Typography;

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

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      apiListTaskLibraries({
        status: statusFilter || undefined,
        page,
        size: pageSize,
      }),
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const filtered = search.trim()
    ? items.filter(
        (it) =>
          it.name.toLowerCase().includes(search.toLowerCase()) ||
          (it.departmentTypeName ?? "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
    : items;

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
        <span
          className="font-medium text-brand cursor-pointer hover:underline"
          onClick={() =>
            navigate(`${AppRouters.ONBOARDING_TASK_LIBRARY}/${row.templateId}`)
          }
        >
          {name}
        </span>
      ),
    },
    {
      title: t("onboarding.task_library.col.department"),
      dataIndex: "departmentTypeName",
      key: "department",
      render: (name?: string, row?: TaskLibraryItem) =>
        name ? (
          <Tag color="blue">{name}</Tag>
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

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
            <Library className="h-5 w-5 text-brand" />
          </div>
          <div>
            <Title level={4} className="!mb-0 !leading-tight">
              {t("onboarding.task_library.title")}
            </Title>
            <Text className="text-slate-400 text-sm">
              {t("onboarding.task_library.subtitle")}
            </Text>
          </div>
        </div>
        {isHR && (
          <div className="flex items-center gap-2 shrink-0">
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
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          prefix={<SearchIcon className="h-4 w-4 text-slate-400" />}
          placeholder={t("global.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="w-64"
        />
        <Select
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          className="w-40"
          options={[
            { value: "", label: t("onboarding.task_library.filter.all") },
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
        {totalCount > 0 && (
          <Text className="ml-auto text-slate-400 text-sm">
            {t("global.pagination.total", { total: String(totalCount) })}
          </Text>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : filtered.length === 0 ? (
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
        />
      ) : (
        <MyTable<TaskLibraryItem>
          columns={columns}
          dataSource={filtered}
          rowKey="templateId"
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
                    t("global.pagination.total", { total: String(total) }),
                  onChange: (p, ps) => {
                    setPage(p);
                    setPageSize(ps);
                  },
                }
          }
        />
      )}

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
