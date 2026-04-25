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
  Skeleton,
  Empty,
  Card,
  message,
} from "antd";
import {
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
  PlusOutlined,
  FileAddOutlined,
  InboxOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { Files, FileCheck, BookOpen, FolderOpen } from "lucide-react";
import type { UploadFile } from "antd/es/upload/interface";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseModal from "@core/components/Modal/BaseModal";

import {
  apiGetDocuments,
  apiUploadDocumentFile,
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

const { Dragger } = Upload;

// ── helpers ──────────────────────────────────────────────────────────────────

function collectEditorDocs(
  nodes: DocFolderNode[],
): { documentId: string; title: string; status: string; published: boolean; folderId: string }[] {
  return nodes.flatMap((n) => [
    ...n.documents.map((d) => ({ ...d, folderId: n.folderId })),
    ...collectEditorDocs(n.children),
  ]);
}

function getDocsInFolder(
  nodes: DocFolderNode[],
  folderId: string,
): { documentId: string; title: string; status: string; published: boolean; folderId: string }[] {
  for (const n of nodes) {
    if (n.folderId === folderId) return n.documents.map((d) => ({ ...d, folderId: n.folderId }));
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

function toUnifiedEditor(doc: {
  documentId: string;
  title: string;
  status: string;
  published: boolean;
  folderId: string;
}): UnifiedDoc {
  return {
    id: doc.documentId,
    kind: "EDITOR",
    title: doc.title,
    status: doc.status,
    published: doc.published,
    folderId: doc.folderId,
  };
}

// ── Upload File Modal ────────────────────────────────────────────────────────

// BE constraint: only EDITOR documents can be placed in folders.
// FILE uploads always land in the global library (visible in "All documents").
function UploadFileModal({
  open,
  folderOptions,
  onClose,
  onSuccess,
}: {
  open: boolean;
  folderOptions: { label: string; value: string }[];
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
      if (values.documentCategoryId) fd.append("documentCategoryId", values.documentCategoryId);
      setUploading(true);
      await apiUploadDocumentFile(fd);
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
            accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx"
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
        {folderOptions.length > 0 && (
          <Form.Item name="documentCategoryId" label={t("document.field.category")}>
            <Select
              options={folderOptions}
              placeholder={t("document.field.category.placeholder")}
              allowClear
            />
          </Form.Item>
        )}
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          File tải lên sẽ được lưu vào <strong>Tất cả tài liệu</strong>. Chỉ tài liệu soạn thảo mới có thể đặt vào thư mục cụ thể.
        </div>
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

// ── Main Documents page ───────────────────────────────────────────────────────

const Documents = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((s) => s.currentUser);
  const canManage = (currentUser?.roles ?? []).some((r) => ["HR", "MANAGER"].includes(r));

  // ── UI state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [kindFilter, setKindFilter] = useState<DocKind | "ALL">("ALL");

  // ── Modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [folderModal, setFolderModal] = useState<{
    open: boolean; mode: "create" | "rename"; parentId?: string; folderId?: string; currentName?: string;
  }>({ open: false, mode: "create" });

  // ── Queries
  const { data: tree, isLoading: treeLoading } = useQuery({
    queryKey: ["doc-folder-tree"],
    queryFn: apiDocFolderTreeWithDocuments,
  });

  const { data: fileDocs = [] } = useQuery({
    queryKey: ["file-documents"],
    queryFn: () => apiGetDocuments(),
    select: (res) => res.items,
  });

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

  const allEditorDocs = useMemo(
    () => collectEditorDocs(roots).map(toUnifiedEditor),
    [roots],
  );

  const allFileDocs = useMemo(
    () => fileDocs.map(toUnifiedFile),
    [fileDocs],
  );

  const displayedDocs = useMemo(() => {
    let docs: UnifiedDoc[];

    if (selectedFolderId) {
      // BE constraint: only EDITOR documents can be placed in folders.
      // FILE docs are always in the global library, never in a specific folder.
      docs = getDocsInFolder(roots, selectedFolderId).map(toUnifiedEditor);
    } else {
      // "All documents": EDITOR docs from tree + FILE docs
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

    return docs;
  }, [selectedFolderId, roots, allEditorDocs, allFileDocs, kindFilter, search]);

  // ── Stats
  const totalDocs = allEditorDocs.length + allFileDocs.length;
  const publishedCount = allEditorDocs.filter((d) => d.published).length;
  const draftCount = allEditorDocs.filter((d) => d.status === "DRAFT").length;
  const filesCount = allFileDocs.length;

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

  // Legacy category options for upload modal (from file docs)
  const legacyCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    fileDocs.forEach((d) => { if (d.documentCategoryId) set.add(d.documentCategoryId); });
    return Array.from(set).map((v) => ({ label: v, value: v }));
  }, [fileDocs]);

  // ── Open doc
  const handleOpenDoc = useCallback(
    (doc: UnifiedDoc) => {
      if (doc.kind === "FILE") navigate(`/documents/${doc.id}`);
      else navigate(`/documents/editor/${doc.id}`);
    },
    [navigate],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-0">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="border-b border-stroke bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-ink">{t("document.page.title")}</h1>
            <p className="mt-0.5 text-sm text-muted">{t("document.page.subtitle")}</p>
          </div>
          {canManage && (
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

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        </div>
      </div>

      {/* ── Body: sidebar + content ───────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* Folder sidebar */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-stroke bg-white px-3 py-4">
          <DocFolderTree
            roots={roots}
            loading={treeLoading}
            selectedId={selectedFolderId}
            totalCount={totalDocs}
            onSelect={setSelectedFolderId}
            canManage={canManage}
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

        {/* Main content */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
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
              <span className="text-xs text-muted">
                {displayedDocs.length} {t("document.stat.results")}
              </span>
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
            {displayedDocs.length === 0 ? (
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
                      {!search && canManage && (
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
                  <DocItemCard key={`${doc.kind}-${doc.id}`} doc={doc} onOpen={handleOpenDoc} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {displayedDocs.map((doc) => (
                  <DocItemRow key={`${doc.kind}-${doc.id}`} doc={doc} onOpen={handleOpenDoc} />
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
        folderOptions={legacyCategoryOptions}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["file-documents"] });
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
