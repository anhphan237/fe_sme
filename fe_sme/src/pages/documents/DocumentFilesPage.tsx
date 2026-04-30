import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Tabs,
  Tooltip,
  Upload,
  message,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import {
  AppstoreOutlined,
  BarsOutlined,
  DeleteOutlined,
  FileAddOutlined,
  FilterOutlined,
  InboxOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Files, FileCheck, FolderOpen, UploadCloud } from "lucide-react";

import { useLocale } from "@/i18n";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseModal from "@core/components/Modal/BaseModal";

import {
  apiGetDocuments,
  apiListAcknowledgments,
  apiUploadDocumentFile,
} from "@/api/document/document.api";
import type { DocumentItem } from "@/interface/document";

import DocItemCard from "./components/DocItemCard";
import DocItemRow from "./components/DocItemRow";
import DocStatCard from "./components/DocStatCard";
import type { DocKind, UnifiedDoc } from "./components/types";
import { useDocumentPermissions } from "./hooks/useDocumentPermissions";
type FileDocumentItem = DocumentItem & {
  createdAt?: string;
  updatedAt?: string;
};
const { Dragger } = Upload;

type EmployeeTab = "all" | "unread" | "pending_ack";

function toUnifiedFile(doc: FileDocumentItem): UnifiedDoc {
  return {
    id: doc.documentId,
    kind: "FILE",
    title: doc.name,
    description: doc.description,
    status: doc.status || "ACTIVE",
    fileUrl: doc.fileUrl,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function UploadFileModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useLocale();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    form.resetFields();
    setFileList([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      const file = fileList[0]?.originFileObj;

      if (!file) {
        message.warning(t("document.upload.select_file"));
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", values.name ?? file.name);

      if (values.description) {
        formData.append("description", values.description);
      }

      setUploading(true);

      await apiUploadDocumentFile(formData);

      message.success(t("document.upload.success"));
      reset();
      onSuccess();
      onClose();
    } catch (error: unknown) {
      message.error(
        error instanceof Error ? error.message : t("document.upload.failed"),
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      title={t("document.modal.upload.title")}
      onCancel={handleClose}
      onOk={handleUpload}
      okText={t("document.action.upload_file")}
      confirmLoading={uploading}
    >
      <Form form={form} layout="vertical" className="mt-4 space-y-2">
        <Form.Item label={t("document.field.file")} required>
          <Dragger
            beforeUpload={() => false}
            fileList={fileList}
            maxCount={1}
            accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.zip,.rar"
            onChange={({ fileList: nextFileList }) => {
              setFileList(nextFileList);

              if (nextFileList[0]?.name && !form.getFieldValue("name")) {
                form.setFieldValue(
                  "name",
                  nextFileList[0].name.replace(/\.[^/.]+$/, ""),
                );
              }
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>

            <p className="ant-upload-text">
              {t("document.upload.dragger_text")}
            </p>

            <p className="ant-upload-hint">
              {t("document.upload.dragger_hint")}
            </p>
          </Dragger>
        </Form.Item>

        <BaseInput
          name="name"
          label={t("document.field.name")}
          placeholder={t("document.field.name.placeholder")}
          formItemProps={{ rules: [{ required: true }] }}
        />

        <BaseInput
          name="description"
          label={t("document.field.description")}
          placeholder={t("document.field.description.placeholder")}
        />

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-muted">
          {t("document.files.upload_note")}
        </div>
      </Form>
    </BaseModal>
  );
}

function DocCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
      <div className="h-1 w-full animate-pulse bg-slate-100" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>

        <div className="flex gap-1.5">
          <div className="h-5 w-12 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-16 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="mt-auto h-7 w-20 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

function DocRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-stroke bg-white px-4 py-3">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-100" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-12 animate-pulse rounded bg-slate-100" />
        <div className="h-5 w-16 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-stroke bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="h-2.5 w-20 animate-pulse rounded bg-slate-100" />
          <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

function BatchToolbar({
  selectedIds,
  onClearSelection,
  onBatchDelete,
  canDelete,
}: {
  selectedIds: Set<string>;
  onClearSelection: () => void;
  onBatchDelete: () => void;
  canDelete: boolean;
}) {
  const { t } = useLocale();
  const count = selectedIds.size;

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-2.5">
      <span className="text-sm font-medium text-brand">
        {t("document.batch.selected", { count })}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {canDelete && (
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={onBatchDelete}
          >
            {t("document.batch.delete")}
          </Button>
        )}

        <Button size="small" onClick={onClearSelection}>
          {t("document.batch.cancel")}
        </Button>
      </div>
    </div>
  );
}

export default function DocumentFilesPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const permissions = useDocumentPermissions();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [kindFilter, setKindFilter] = useState<DocKind | "ALL">("ALL");
  const [employeeTab, setEmployeeTab] = useState<EmployeeTab>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    data: fileDocs = [],
    isLoading: fileDocsLoading,
    isFetching: fileDocsFetching,
  } = useQuery({
    queryKey: ["file-documents"],
    queryFn: () => apiGetDocuments(),
    select: (res) => (res.items ?? []) as FileDocumentItem[],
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const { data: ackData, isFetching: ackFetching } = useQuery({
    queryKey: ["doc-acknowledgments"],
    queryFn: apiListAcknowledgments,
    enabled: permissions.canAcknowledge,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const ackedDocIds = useMemo(
    () => new Set((ackData?.items ?? []).map((item) => item.documentId)),
    [ackData],
  );

  const allFileDocs = useMemo(() => fileDocs.map(toUnifiedFile), [fileDocs]);

  const displayedDocs = useMemo(() => {
    let docs = [...allFileDocs];

    if (kindFilter !== "ALL") {
      docs = docs.filter((doc) => doc.kind === kindFilter);
    }

    if (search.trim()) {
      const keyword = search.trim().toLowerCase();

      docs = docs.filter((doc) => {
        return (
          doc.title.toLowerCase().includes(keyword) ||
          (doc.description?.toLowerCase().includes(keyword) ?? false) ||
          (doc.status?.toLowerCase().includes(keyword) ?? false)
        );
      });
    }

    if (permissions.canAcknowledge) {
      if (employeeTab === "pending_ack") {
        docs = docs.filter((doc) => !ackedDocIds.has(doc.id));
      }

      if (employeeTab === "unread") {
        docs = docs.filter((doc) => !ackedDocIds.has(doc.id));
      }
    }

    return docs;
  }, [
    allFileDocs,
    ackedDocIds,
    employeeTab,
    kindFilter,
    permissions.canAcknowledge,
    search,
  ]);

  const totalFiles = allFileDocs.length;
  const activeFiles = allFileDocs.filter(
    (doc) => doc.status?.toUpperCase() === "ACTIVE",
  ).length;
  const acknowledgedFiles = allFileDocs.filter((doc) =>
    ackedDocIds.has(doc.id),
  ).length;
  const pendingAckCount = permissions.canAcknowledge
    ? allFileDocs.filter((doc) => !ackedDocIds.has(doc.id)).length
    : 0;

  const isInitialLoading = fileDocsLoading;
  const isRefreshing =
    (fileDocsFetching || (permissions.canAcknowledge && ackFetching)) &&
    !isInitialLoading;

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["file-documents"] });

    if (permissions.canAcknowledge) {
      queryClient.invalidateQueries({ queryKey: ["doc-acknowledgments"] });
    }
  }, [permissions.canAcknowledge, queryClient]);

  const handleOpenDoc = useCallback(
    (doc: UnifiedDoc) => {
      navigate(`/documents/files/${doc.id}`);
    },
    [navigate],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const handleBatchDelete = useCallback(() => {
    Modal.confirm({
      title: t("document.batch.delete_confirm_title"),
      content: t("document.batch.delete_confirm_desc", {
        count: selectedIds.size,
      }),
      okText: t("document.batch.delete"),
      okButtonProps: { danger: true },
      onOk: () => {
        message.info(t("document.batch.delete_coming_soon"));
        setSelectedIds(new Set());
      },
    });
  }, [selectedIds.size, t]);

  const employeeTabItems = [
    { key: "all", label: t("document.tab.all") },
    { key: "unread", label: t("document.tab.unread") },
    {
      key: "pending_ack",
      label: (
        <span>
          {t("document.tab.pending_ack")}
          {pendingAckCount > 0 && (
            <span className="ml-1.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {pendingAckCount}
            </span>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="border-b border-stroke bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-ink">
              {t("document.files.page_title")}
            </h1>

            <p className="mt-0.5 text-sm text-muted">
              {t("document.files.page_subtitle")}
            </p>
          </div>

          {permissions.canCreate && (
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadOpen(true)}
            >
              {t("document.action.upload_file")}
            </Button>
          )}
        </div>

        {permissions.canViewStats && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {isInitialLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <DocStatCard
                  label={t("document.files.stat.total")}
                  value={totalFiles}
                  icon={<Files className="h-4 w-4" />}
                  tone="blue"
                />

                <DocStatCard
                  label={t("document.files.stat.active")}
                  value={activeFiles}
                  icon={<FileCheck className="h-4 w-4" />}
                  tone="teal"
                />

                <DocStatCard
                  label={t("document.files.stat.acknowledged")}
                  value={acknowledgedFiles}
                  icon={<FolderOpen className="h-4 w-4" />}
                  tone="violet"
                />

                <DocStatCard
                  label={t("document.files.stat.uploaded")}
                  value={totalFiles}
                  icon={<UploadCloud className="h-4 w-4" />}
                  tone="amber"
                />
              </>
            )}
          </div>
        )}
      </div>

      {permissions.canAcknowledge && (
        <div className="border-b border-stroke bg-white px-5 pt-3">
          {allFileDocs.length > 0 && (
            <div className="mb-2 flex items-center gap-3">
              <div
                className="flex-1 overflow-hidden rounded-full bg-slate-100"
                style={{ height: 6 }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round(
                      ((allFileDocs.length - pendingAckCount) /
                        allFileDocs.length) *
                        100,
                    )}%`,
                    backgroundColor:
                      pendingAckCount === 0 ? "#22c55e" : "#f97316",
                  }}
                />
              </div>

              <span className="shrink-0 text-xs text-muted">
                {allFileDocs.length - pendingAckCount}/{allFileDocs.length}{" "}
                {t("document.files.ack_progress")}
              </span>
            </div>
          )}

          <Tabs
            size="small"
            activeKey={employeeTab}
            onChange={(key) => setEmployeeTab(key as EmployeeTab)}
            items={employeeTabItems}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-b border-stroke bg-white px-5 py-3">
        <Input
          prefix={<SearchOutlined className="text-muted" />}
          placeholder={t("document.search.placeholder")}
          className="max-w-xs"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          allowClear
        />

        <Select
          value={kindFilter}
          onChange={(value) => setKindFilter(value as DocKind | "ALL")}
          className="w-36"
          options={[
            { label: t("document.filter.all_types"), value: "ALL" },
            { label: t("document.filter.type_file"), value: "FILE" },
          ]}
          suffixIcon={<FilterOutlined />}
        />

        <div className="ml-auto flex items-center gap-2">
          {isRefreshing && (
            <SyncOutlined
              spin
              className="text-sm text-brand"
              title={t("document.loading.refreshing")}
            />
          )}

          <span className="text-xs text-muted">
            {displayedDocs.length} {t("document.stat.results")}
          </span>

          <Tooltip title={t("document.action.refresh")}>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={isRefreshing}
              onClick={handleRefresh}
            />
          </Tooltip>

          <Button
            size="small"
            type={view === "grid" ? "primary" : "default"}
            icon={<AppstoreOutlined />}
            onClick={() => setView("grid")}
          />

          <Button
            size="small"
            type={view === "list" ? "primary" : "default"}
            icon={<BarsOutlined />}
            onClick={() => setView("list")}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {permissions.canCreate && selectedIds.size > 0 && (
          <div className="mb-4">
            <BatchToolbar
              selectedIds={selectedIds}
              onClearSelection={() => setSelectedIds(new Set())}
              onBatchDelete={handleBatchDelete}
              canDelete={permissions.canDelete}
            />
          </div>
        )}

        {isInitialLoading ? (
          view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <DocCardSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <DocRowSkeleton key={index} />
              ))}
            </div>
          )
        ) : displayedDocs.length === 0 ? (
          <Card className="border border-stroke bg-white shadow-sm">
            <Empty
              description={
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-ink">
                    {search
                      ? t("document.empty.no_search_result")
                      : t("document.files.empty")}
                  </p>

                  {!search && (
                    <p className="text-muted">
                      {t("document.files.empty_desc")}
                    </p>
                  )}

                  {!search && permissions.canCreate && (
                    <div className="mt-3 flex justify-center">
                      <Button
                        type="primary"
                        size="small"
                        icon={<FileAddOutlined />}
                        onClick={() => setUploadOpen(true)}
                      >
                        {t("document.action.upload_file")}
                      </Button>
                    </div>
                  )}
                </div>
              }
              className="py-16"
            />
          </Card>
        ) : view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedDocs.map((doc) => (
              <DocItemCard
                key={`${doc.kind}-${doc.id}`}
                doc={doc}
                onOpen={handleOpenDoc}
                selectable={permissions.canCreate}
                selected={selectedIds.has(doc.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayedDocs.map((doc) => (
              <DocItemRow
                key={`${doc.kind}-${doc.id}`}
                doc={doc}
                onOpen={handleOpenDoc}
                selectable={permissions.canCreate}
                selected={selectedIds.has(doc.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </div>

      <UploadFileModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["file-documents"] });
          queryClient.invalidateQueries({ queryKey: ["doc-acknowledgments"] });
        }}
      />
    </div>
  );
}
