import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
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
  Form,
  Input,
  Select,
  Skeleton,
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
import BaseModal from "@/core/components/Modal/BaseModal";
import BaseFormItem from "@/core/components/Form/BaseFormItem";

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
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    useImperativeHandle(ref, () => ({
      open: () => setVisible(true),
    }));

    const onClose = () => {
      setVisible(false);
      form.resetFields();
      setFileList([]);
    };

    const { data: deptTypesRaw, isLoading: isLoadingDepts } = useQuery({
      queryKey: ["department-types", "ACTIVE"],
      queryFn: () => apiListDepartmentTypes({ status: "ACTIVE" }),
      enabled: visible,
    });
    const deptTypes = (
      Array.isArray(deptTypesRaw)
        ? deptTypesRaw
        : extractList(deptTypesRaw as unknown as Record<string, unknown>, "items")
    ) as DepartmentTypeItem[];

    const importMutation = useMutation({
      mutationFn: (fd: FormData) => apiImportTaskLibraryExcel(fd),
      onSuccess: (res) => {
        message.success(
          t("onboarding.task_library.import.success", {
            count: String(res.importedTasks),
          }),
        );
        onSuccess();
        onClose();
      },
      onError: () => {
        message.error(t("onboarding.task_library.import.error"));
      },
    });

    const handleSubmit = async () => {
      const values = await form.validateFields();
      if (!fileList[0]?.originFileObj) return;
      const fd = new FormData();
      fd.append("file", fileList[0].originFileObj as File);
      fd.append("departmentTypeCode", values.departmentTypeCode);
      if (values.templateName) fd.append("templateName", values.templateName);
      fd.append("replaceExisting", String(values.replaceExisting ?? true));
      importMutation.mutate(fd);
    };

    return (
      <BaseModal
        open={visible}
        onCancel={onClose}
        title={t("onboarding.task_library.import.title")}
        onOk={handleSubmit}
        okText={t("onboarding.task_library.import.submit")}
        confirmLoading={importMutation.isPending}>
        <Form form={form} layout="vertical" className="mt-4">
          <BaseFormItem
            name="departmentTypeCode"
            label={t("onboarding.task_library.import.dept_label")}
            rules={[{ required: true }]}>
            <Select
              showSearch
              loading={isLoadingDepts}
              placeholder={t("onboarding.task_library.import.dept_placeholder")}
              filterOption={(input, option) =>
                ((option?.label as string) ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={deptTypes.map((d) => ({
                value: d.code,
                label: `${d.name} (${d.code})`,
              }))}
            />
          </BaseFormItem>
          <BaseFormItem
            name="templateName"
            label={t("onboarding.task_library.import.name_label")}>
            <Input
              placeholder={t("onboarding.task_library.import.name_placeholder")}
            />
          </BaseFormItem>
          <BaseFormItem
            name="file"
            label={t("onboarding.task_library.import.file_label")}
            rules={[{ required: true }]}>
            <AntUpload.Dragger
              accept=".xlsx"
              maxCount={1}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: fl }) => {
                setFileList(fl);
                form.setFieldValue("file", fl[0] ?? undefined);
              }}>
              <p className="ant-upload-drag-icon">
                <FileSpreadsheet className="mx-auto h-8 w-8 text-slate-400" />
              </p>
              <p className="ant-upload-text text-sm">Click or drag .xlsx here</p>
            </AntUpload.Dragger>
          </BaseFormItem>
          <BaseFormItem name="replaceExisting" valuePropName="checked" initialValue>
            <Checkbox>
              {t("onboarding.task_library.import.replace_label")}
            </Checkbox>
          </BaseFormItem>
        </Form>
      </BaseModal>
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
          }>
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
              onClick={() => downloadMutation.mutate()}>
              {t("onboarding.task_library.action.download_template")}
            </Button>
            <Button
              type="primary"
              icon={<Upload className="h-4 w-4" />}
              onClick={() => importModalRef.current?.open()}>
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
