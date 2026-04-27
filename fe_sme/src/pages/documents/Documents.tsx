import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Input,
  Form,
  Upload,
  Select,
  Modal,
  Empty,
  Card,
  Skeleton,
  Tooltip,
  message,
  Tabs,
} from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
  PlusOutlined,
  FileAddOutlined,
  InboxOutlined,
  FilterOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SyncOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import { Files, FileCheck, BookOpen, FolderOpen } from "lucide-react";
import type { UploadFile } from "antd/es/upload/interface";
import { useLocale } from "@/i18n";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseModal from "@core/components/Modal/BaseModal";

import {
  apiGetDocuments,
  apiUploadDocumentFile,
  apiListAcknowledgments,
} from "@/api/document/document.api";
import {
  apiDocFolderTreeWithDocuments,
  apiDocFolderCreate,
  apiDocFolderRename,
  apiDocFolderDelete,
  apiDocCreateDraft,
  apiDocFolderAddDocument,
} from "@/api/document/editor.api";
import type { DocFolderNode } from "@/interface/document/editor";
import type { DocumentItem } from "@/interface/document";

import DocStatCard from "./components/DocStatCard";
import DocFolderTree from "./components/DocFolderTree";
import DocItemCard from "./components/DocItemCard";
import DocItemRow from "./components/DocItemRow";
import type { UnifiedDoc, DocKind } from "./components/types";
import { useDocumentPermissions } from "./hooks/useDocumentPermissions";

const { Dragger } = Upload;

// ── helpers ──────────────────────────────────────────────────────────────────

type FolderDocItem = {
  documentId: string;
  title: string;
  status: string;
  contentKind: string;
  published: boolean;
  folderId: string;
  folderName: string;
  updatedAt: string;
};

function collectEditorDocs(nodes: DocFolderNode[]): FolderDocItem[] {
  return nodes.flatMap((n) => [
    ...n.documents
      .filter((d) => d.contentKind !== "FILE")
      .map((d) => ({ ...d, folderId: n.folderId, folderName: n.name })),
    ...collectEditorDocs(n.children),
  ]);
}

function getDocsInFolder(nodes: DocFolderNode[], folderId: string): FolderDocItem[] {
  for (const n of nodes) {
    if (n.folderId === folderId)
      return n.documents.map((d) => ({ ...d, folderId: n.folderId, folderName: n.name }));
    const found = getDocsInFolder(n.children, folderId);
    if (found.length > 0) return found;
  }
  return [];
}

function toUnifiedFile(doc: DocumentItem): UnifiedDoc {
  return {
    id: doc.documentId,
    kind: "FILE",
    title: doc.name,
    description: doc.description,
    status: doc.status,
    fileUrl: doc.fileUrl,
  };
}

function toUnifiedFolderDoc(doc: FolderDocItem): UnifiedDoc {
  return {
    id: doc.documentId,
    kind: doc.contentKind === "FILE" ? "FILE" : "EDITOR",
    title: doc.title,
    status: doc.status,
    published: doc.published,
    folderId: doc.folderId,
    folderName: doc.folderName,
    updatedAt: doc.updatedAt,
  };
}

// ── Upload File Modal ────────────────────────────────────────────────────────

function UploadFileModal({
  open,
  selectedFolderId,
  selectedFolderName,
  onClose,
  onSuccess,
}: {
  open: boolean;
  selectedFolderId?: string | null;
  selectedFolderName?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useLocale();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      const file = fileList[0]?.originFileObj;
      if (!file) { message.warning(t("document.upload.select_file")); return; }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", values.name ?? file.name);
      if (values.description) fd.append("description", values.description);
      setUploading(true);
      const result = await apiUploadDocumentFile(fd);
      if (selectedFolderId && result.documentId) {
        await apiDocFolderAddDocument(selectedFolderId, result.documentId);
      }
      message.success(t("document.upload.success"));
      form.resetFields();
      setFileList([]);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : t("document.upload.failed"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <BaseModal
      open={open}
      title={t("document.modal.upload.title")}
      onCancel={onClose}
      onOk={handleUpload}
      okText={t("document.action.upload_file")}
      confirmLoading={uploading}>
      <Form form={form} layout="vertical" className="mt-4 space-y-2">
        <Form.Item label={t("document.field.file")} required>
          <Dragger
            beforeUpload={() => false}
            fileList={fileList}
            maxCount={1}
            accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.rar"
            onChange={({ fileList: fl }) => {
              setFileList(fl);
              if (fl[0]?.name && !form.getFieldValue("name"))
                form.setFieldValue("name", fl[0].name.replace(/\.[^/.]+$/, ""));
            }}>
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">{t("document.upload.dragger_text")}</p>
            <p className="ant-upload-hint">{t("document.upload.dragger_hint")}</p>
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
        {selectedFolderName ? (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
            <FolderOutlined className="shrink-0 text-blue-500" />
            <span>
              {t("document.upload.attach_hint")}{" "}
              <span className="font-semibold">{selectedFolderName}</span>
            </span>
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-muted">
            {t("document.upload.library_note")}
          </div>
        )}
      </Form>
    </BaseModal>
  );
}

// ── New Folder / Rename Folder modals ────────────────────────────────────────

function FolderNameModal({
  open,
  title,
  initialValue,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  initialValue?: string;
  loading: boolean;
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(initialValue ?? "");

  // sync when opening
  useMemo(() => { if (open) setName(initialValue ?? ""); }, [open, initialValue]);

  const submit = () => {
    if (!name.trim()) { message.warning(t("document.folder.name_placeholder")); return; }
    onConfirm(name.trim());
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={loading}
      okText={t("document.folder.create_success")}>
      <Input
        className="mt-4"
        placeholder={t("document.folder.name_placeholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onPressEnter={submit}
        autoFocus
      />
    </Modal>
  );
}

// ── New Document modal ────────────────────────────────────────────────────────

function NewDocModal({
  open,
  selectedFolderId,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  selectedFolderId: string | null;
  loading: boolean;
  onConfirm: (title: string) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [title, setTitle] = useState("");

  useMemo(() => { if (open) setTitle(""); }, [open]);

  const submit = () => {
    if (!title.trim()) { message.warning(t("document.new_doc.placeholder")); return; }
    onConfirm(title.trim());
  };

  return (
    <Modal
      title={t("document.new_doc.title")}
      open={open}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={loading}
      okText={t("document.new_doc.create")}>
      <div className="mt-4 space-y-3">
        <Input
          placeholder={t("document.new_doc.placeholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onPressEnter={submit}
          autoFocus
        />
        {selectedFolderId && (
          <p className="text-xs text-muted">{t("document.new_doc.in_folder")}</p>
        )}
      </div>
    </Modal>
  );
}

// ── Loading Skeletons ─────────────────────────────────────────────────────────

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

// ── Batch toolbar ─────────────────────────────────────────────────────────────

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
            onClick={onBatchDelete}>
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

// ── Main Documents page ───────────────────────────────────────────────────────

type EmployeeTab = "all" | "unread" | "pending_ack";

const Documents = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const permissions = useDocumentPermissions();

  // ── UI state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [kindFilter, setKindFilter] = useState<DocKind | "ALL">("ALL");
  const [employeeTab, setEmployeeTab] = useState<EmployeeTab>("all");

  // Batch selection (HR / MANAGER)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [folderModal, setFolderModal] = useState<{
    open: boolean; mode: "create" | "rename"; parentId?: string; folderId?: string; currentName?: string;
  }>({ open: false, mode: "create" });

  // ── Queries
  const {
    data: tree,
    isLoading: treeLoading,
    isFetching: treeFetching,
  } = useQuery({
    queryKey: ["doc-folder-tree"],
    queryFn: apiDocFolderTreeWithDocuments,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  const {
    data: fileDocs = [],
    isLoading: fileDocsLoading,
    isFetching: fileDocsFetching,
  } = useQuery({
    queryKey: ["file-documents"],
    queryFn: () => apiGetDocuments(),
    select: (res) => res.items,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  // Acknowledgments — only needed for EMPLOYEE tab logic
  const { data: ackData, isFetching: ackFetching } = useQuery({
    queryKey: ["doc-acknowledgments"],
    queryFn: apiListAcknowledgments,
    enabled: permissions.canAcknowledge,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
  const ackedDocIds = useMemo(
    () => new Set((ackData?.items ?? []).map((a) => a.documentId)),
    [ackData],
  );

  // ── Mutations — folders
  const createFolderMutation = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      apiDocFolderCreate(name, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });
      setFolderModal({ open: false, mode: "create" });
      message.success(t("document.folder.create_success"));
    },
    onError: () => message.error(t("document.folder.create_error")),
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ folderId, name }: { folderId: string; name: string }) =>
      apiDocFolderRename(folderId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });
      setFolderModal({ open: false, mode: "create" });
      message.success(t("document.folder.rename_success"));
    },
    onError: () => message.error(t("document.folder.rename_error")),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => apiDocFolderDelete(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });
      if (selectedFolderId) setSelectedFolderId(null);
      message.success(t("document.folder.delete_success"));
    },
    onError: () => message.error(t("document.folder.delete_error")),
  });

  // ── Mutations — documents
  const createDocMutation = useMutation({
    mutationFn: async ({ title, folderId }: { title: string; folderId?: string }) => {
      // BE createDraft does NOT accept folderId — must call addDocument separately
      const res = await apiDocCreateDraft(title);
      if (folderId) {
        await apiDocFolderAddDocument(folderId, res.documentId);
      }
      return res;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });
      setNewDocOpen(false);
      navigate(`/documents/editor/${res.documentId}`);
    },
    onError: () => message.error(t("document.new_doc.create_error")),
  });

  // ── Derived data
  const roots = tree?.roots ?? [];

  const selectedFolderName = useMemo(() => {
    if (!selectedFolderId) return null;
    const find = (nodes: DocFolderNode[]): string | null => {
      for (const n of nodes) {
        if (n.folderId === selectedFolderId) return n.name;
        const child = find(n.children);
        if (child) return child;
      }
      return null;
    };
    return find(roots);
  }, [selectedFolderId, roots]);

  // Loading states
  const isInitialLoading = treeLoading || fileDocsLoading;
  const isRefreshing =
    (treeFetching || fileDocsFetching || (permissions.canAcknowledge && ackFetching)) &&
    !isInitialLoading;

  // Refresh all document queries
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });
    queryClient.invalidateQueries({ queryKey: ["file-documents"] });
    if (permissions.canAcknowledge) {
      queryClient.invalidateQueries({ queryKey: ["doc-acknowledgments"] });
    }
  }, [queryClient, permissions.canAcknowledge]);

  const allEditorDocs = useMemo(
    () => collectEditorDocs(roots).map(toUnifiedFolderDoc),
    [roots],
  );

  const allFileDocs = useMemo(
    () => fileDocs.map(toUnifiedFile),
    [fileDocs],
  );

  const displayedDocs = useMemo(() => {
    let docs: UnifiedDoc[];

    if (selectedFolderId) {
      docs = getDocsInFolder(roots, selectedFolderId).map(toUnifiedFolderDoc);
    } else {
      docs = [...allEditorDocs, ...allFileDocs];
    }

    // Kind filter
    if (kindFilter !== "ALL") docs = docs.filter((d) => d.kind === kindFilter);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.description?.toLowerCase().includes(q) ?? false),
      );
    }

    // EMPLOYEE tabs
    if (permissions.canAcknowledge) {
      if (employeeTab === "pending_ack") {
        docs = docs.filter((d) => d.kind === "FILE" && !ackedDocIds.has(d.id));
      }
      // "unread" tab: show docs where current user is not in reads[]
      // For FILE docs we track via acknowledgments as proxy
      if (employeeTab === "unread") {
        docs = docs.filter((d) => d.kind === "FILE" && !ackedDocIds.has(d.id));
      }
    }

    return docs;
  }, [selectedFolderId, roots, allEditorDocs, allFileDocs, kindFilter, search, permissions.canAcknowledge, employeeTab, ackedDocIds]);

  // ── Stats
  const totalDocs = allEditorDocs.length + allFileDocs.length;
  const publishedCount = allEditorDocs.filter((d) => d.published).length;
  const draftCount = allEditorDocs.filter((d) => d.status === "DRAFT").length;
  const filesCount = allFileDocs.length;

  // Pending ack count for badge
  const pendingAckCount = useMemo(() => {
    if (!permissions.canAcknowledge) return 0;
    return allFileDocs.filter((d) => !ackedDocIds.has(d.id)).length;
  }, [allFileDocs, ackedDocIds, permissions.canAcknowledge]);

  // ── Folder actions
  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      Modal.confirm({
        title: t("document.folder.delete"),
        content: t("document.folder.delete_confirm"),
        okText: t("document.folder.delete"),
        okButtonProps: { danger: true },
        onOk: () => deleteFolderMutation.mutate(folderId),
      });
    },
    [deleteFolderMutation, t],
  );

  // ── Open doc
  const handleOpenDoc = useCallback(
    (doc: UnifiedDoc) => {
      if (doc.kind === "FILE") navigate(`/documents/${doc.id}`);
      else navigate(`/documents/editor/${doc.id}`);
    },
    [navigate],
  );

  // ── Batch selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBatchDelete = useCallback(() => {
    Modal.confirm({
      title: t("document.batch.delete_confirm_title"),
      content: t("document.batch.delete_confirm_desc", { count: selectedIds.size }),
      okText: t("document.batch.delete"),
      okButtonProps: { danger: true },
      onOk: () => {
        // TODO: call batch delete API when available
        message.info("Batch delete coming soon");
        setSelectedIds(new Set());
      },
    });
  }, [selectedIds.size, t]);

  // ── Employee tab items
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
    <div className="flex h-full min-h-0 flex-col gap-0">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="border-b border-stroke bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-ink">{t("document.page.title")}</h1>
            <p className="mt-0.5 text-sm text-muted">
              {permissions.canCreate
                ? t("document.page.subtitle_manage")
                : t("document.page.subtitle")}
            </p>
          </div>
          {permissions.canCreate && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                icon={<FileAddOutlined />}
                onClick={() => setUploadOpen(true)}>
                {t("document.action.upload_file")}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setNewDocOpen(true)}>
                {t("document.action.new_document")}
              </Button>
            </div>
          )}
        </div>

        {/* Stats row — only for ADMIN / HR / MANAGER */}
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
                  label={t("document.stat.total")}
                  value={totalDocs}
                  icon={<Files className="h-4 w-4" />}
                  tone="blue"
                />
                <DocStatCard
                  label={t("document.stat.published")}
                  value={publishedCount}
                  icon={<FileCheck className="h-4 w-4" />}
                  tone="teal"
                />
                <DocStatCard
                  label={t("document.stat.draft")}
                  value={draftCount}
                  icon={<BookOpen className="h-4 w-4" />}
                  tone="amber"
                />
                <DocStatCard
                  label={t("document.stat.files")}
                  value={filesCount}
                  icon={<FolderOpen className="h-4 w-4" />}
                  tone="violet"
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Body: sidebar + content ───────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Folder sidebar — only for HR / MANAGER */}
        {permissions.canManageFolder && (
          <aside className="flex w-56 shrink-0 flex-col border-r border-stroke bg-white px-3 py-4">
            <DocFolderTree
              roots={roots}
              loading={treeLoading}
              selectedId={selectedFolderId}
              totalCount={totalDocs}
              onSelect={setSelectedFolderId}
              canManage={permissions.canManageFolder}
              onCreateRoot={() => setFolderModal({ open: true, mode: "create" })}
              onCreateChild={(parentId) =>
                setFolderModal({ open: true, mode: "create", parentId })
              }
              onRename={(folderId, currentName) =>
                setFolderModal({ open: true, mode: "rename", folderId, currentName })
              }
              onDelete={handleDeleteFolder}
            />
          </aside>
        )}

        {/* Main content */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
          {/* Employee tabs + acknowledgment progress */}
          {permissions.canAcknowledge && (
            <div className="border-b border-stroke bg-white px-5 pt-3">
              {allFileDocs.length > 0 && (
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex-1 overflow-hidden rounded-full bg-slate-100" style={{ height: 6 }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round(((allFileDocs.length - pendingAckCount) / allFileDocs.length) * 100)}%`,
                        backgroundColor: pendingAckCount === 0 ? "#22c55e" : "#f97316",
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {allFileDocs.length - pendingAckCount}/{allFileDocs.length} đã xác nhận
                  </span>
                </div>
              )}
              <Tabs
                size="small"
                activeKey={employeeTab}
                onChange={(k) => setEmployeeTab(k as EmployeeTab)}
                items={employeeTabItems}
              />
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-stroke bg-white px-5 py-3">
            <Input
              prefix={<SearchOutlined className="text-muted" />}
              placeholder={t("document.search.placeholder")}
              className="max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />

            <Select
              value={kindFilter}
              onChange={(v) => setKindFilter(v as DocKind | "ALL")}
              className="w-36"
              options={[
                { label: t("document.filter.all_types"), value: "ALL" },
                { label: t("document.filter.type_doc"), value: "EDITOR" },
                { label: t("document.filter.type_file"), value: "FILE" },
              ]}
              suffixIcon={<FilterOutlined />}
            />

            <div className="ml-auto flex items-center gap-2">
              {/* Background-refresh indicator */}
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

          {/* Document list */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Batch toolbar */}
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

            {/* Initial loading — skeleton */}
            {isInitialLoading ? (
              view === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <DocCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <DocRowSkeleton key={i} />
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
                          : t("document.empty.no_docs")}
                      </p>
                      {!search && (
                        <p className="text-muted">{t("document.empty.get_started")}</p>
                      )}
                      {!search && permissions.canCreate && (
                        <div className="mt-3 flex justify-center gap-2">
                          <Button
                            type="primary"
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => setNewDocOpen(true)}>
                            {t("document.empty.create_first")}
                          </Button>
                          <Button
                            size="small"
                            icon={<FileAddOutlined />}
                            onClick={() => setUploadOpen(true)}>
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
        </main>
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}

      {/* Upload file modal */}
      <UploadFileModal
        open={uploadOpen}
        selectedFolderId={selectedFolderId}
        selectedFolderName={selectedFolderName}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["file-documents"] });
          queryClient.invalidateQueries({ queryKey: ["doc-folder-tree"] });
        }}
      />

      {/* New document modal */}
      <NewDocModal
        open={newDocOpen}
        selectedFolderId={selectedFolderId}
        loading={createDocMutation.isPending}
        onConfirm={(title) =>
          createDocMutation.mutate({ title, folderId: selectedFolderId ?? undefined })
        }
        onClose={() => setNewDocOpen(false)}
      />

      {/* Create / rename folder modal */}
      <FolderNameModal
        open={folderModal.open}
        title={
          folderModal.mode === "rename"
            ? t("document.folder.rename")
            : folderModal.parentId
              ? t("document.folder.new_sub")
              : t("document.folder.new")
        }
        initialValue={folderModal.mode === "rename" ? folderModal.currentName : ""}
        loading={
          folderModal.mode === "rename"
            ? renameFolderMutation.isPending
            : createFolderMutation.isPending
        }
        onConfirm={(name) => {
          if (folderModal.mode === "rename" && folderModal.folderId) {
            renameFolderMutation.mutate({ folderId: folderModal.folderId, name });
          } else {
            createFolderMutation.mutate({ name, parentId: folderModal.parentId });
          }
        }}
        onClose={() => setFolderModal({ open: false, mode: "create" })}
      />
    </div>
  );
};

export default Documents;
