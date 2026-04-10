import { useState, useMemo } from "react";
import {
  FileAddOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BookOutlined,
  DatabaseOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Form,
  Skeleton,
  Tag,
  Input,
  Divider,
  Tooltip,
  Badge,
  Empty,
} from "antd";
import { BookOpen, FileText } from "lucide-react";
import BaseModal from "@core/components/Modal/BaseModal";
import BaseButton from "@/components/button";
import InputWithLabel from "@core/components/Input/InputWithLabel";
import BaseTextArea from "@core/components/TextArea/BaseTextArea";
import { apiGetDocuments } from "@/api/document/document.api";
import { useLocale } from "@/i18n";
import type { DocumentItem } from "@/interface/document";

// ── Types ─────────────────────────────────────────────────────────────────────

interface KbArticle {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

type ArticleFormValues = Pick<KbArticle, "title" | "content">;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFileExt(url?: string): string {
  if (!url) return "";
  const clean = url.split("?")[0];
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.substring(dot + 1).toLowerCase() : "";
}

const EXT_COLOR: Record<string, string> = {
  pdf: "#ef4444",
  doc: "#2563eb",
  docx: "#2563eb",
  ppt: "#f97316",
  pptx: "#f97316",
  xls: "#16a34a",
  xlsx: "#16a34a",
};

function getExtColor(url?: string): string {
  return EXT_COLOR[getFileExt(url)] ?? "#94a3b8";
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "blue" | "violet" | "teal";
}) {
  const toneMap: Record<typeof tone, string> = {
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    teal: "bg-teal-50 text-teal-700",
  };
  return (
    <Card size="small" className="border border-stroke bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-2.5 ${toneMap[tone]}`}>{icon}</div>
      </div>
    </Card>
  );
}

// ── Article Card ──────────────────────────────────────────────────────────────

function ArticleCard({
  article,
  onEdit,
  onDelete,
}: {
  article: KbArticle;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useLocale();
  return (
    <Card
      size="small"
      className="group flex h-full flex-col border border-stroke bg-white shadow-sm transition hover:border-slate-300 hover:shadow-soft">
      {/* Header */}
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">
          <BookOutlined className="text-sm text-violet-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-snug text-ink">
            {article.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {new Date(article.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>

      {/* Content preview */}
      {article.content && (
        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted">
          {article.content}
        </p>
      )}

      <Divider className="my-3" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-slate-100 hover:text-ink"
          onClick={onEdit}>
          <EditOutlined />
          {t("global.edit")}
        </button>
        <button
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-50 hover:text-red-600"
          onClick={onDelete}>
          <DeleteOutlined />
          {t("global.delete")}
        </button>
      </div>
    </Card>
  );
}

// ── Source Row ────────────────────────────────────────────────────────────────

function SourceRow({
  doc,
  selected,
  onToggle,
}: {
  doc: DocumentItem;
  selected: boolean;
  onToggle: () => void;
}) {
  const ext = getFileExt(doc.fileUrl);
  const accentColor = getExtColor(doc.fileUrl);

  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
        selected
          ? "border-brand bg-blue-50"
          : "border-stroke bg-white hover:bg-slate-50"
      }`}
      onClick={onToggle}>
      {/* File icon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${accentColor}18` }}>
        <DatabaseOutlined style={{ color: accentColor }} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{doc.name}</p>
        {doc.description && (
          <p className="truncate text-xs text-muted">{doc.description}</p>
        )}
      </div>

      {/* Type badge */}
      {ext && (
        <span
          className="shrink-0 rounded-md px-2 py-0.5 text-xs font-bold uppercase text-white"
          style={{ backgroundColor: accentColor }}>
          {ext}
        </span>
      )}

      {/* Toggle */}
      {selected ? (
        <CheckCircleFilled className="shrink-0 text-lg text-brand" />
      ) : (
        <div className="h-5 w-5 shrink-0 rounded-full border-2 border-stroke" />
      )}
    </label>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const KnowledgeBase = () => {
  const { t } = useLocale();
  const [tab, setTab] = useState<"articles" | "sources">("articles");
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    new Set(),
  );
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [articleSearch, setArticleSearch] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const [form] = Form.useForm<ArticleFormValues>();

  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ["documents", undefined],
    queryFn: () => apiGetDocuments(),
  });

  const allDocs: DocumentItem[] = docsData?.items ?? [];

  const filteredArticles = useMemo(() => {
    if (!articleSearch.trim()) return articles;
    const q = articleSearch.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q),
    );
  }, [articles, articleSearch]);

  const filteredDocs = useMemo(() => {
    if (!sourceSearch.trim()) return allDocs;
    const q = sourceSearch.toLowerCase();
    return allDocs.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q),
    );
  }, [allDocs, sourceSearch]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (article: KbArticle) => {
    setEditingId(article.id);
    form.setFieldsValue({ title: article.title, content: article.content });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    if (editingId) {
      setArticles((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, ...values } : a)),
      );
    } else {
      setArticles((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          ...values,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleSource = (id: string) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────

  const TABS = [
    {
      key: "articles" as const,
      label: t("kb.tab.articles"),
      icon: <BookOutlined />,
      count: articles.length,
    },
    {
      key: "sources" as const,
      label: t("kb.tab.sources"),
      icon: <DatabaseOutlined />,
      count: selectedSources.size,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Knowledge Base</h1>
          <p className="mt-0.5 text-sm text-muted">
            {t("kb.sources.subtitle")}
          </p>
        </div>
        {tab === "articles" && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brandDark active:scale-95">
            <FileAddOutlined />
            {t("kb.btn.new_article")}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("kb.stat.articles")}
          value={articles.length}
          icon={<BookOpen className="h-4 w-4" />}
          tone="violet"
        />
        <StatCard
          label={t("kb.stat.sources")}
          value={allDocs.length}
          icon={<FileText className="h-4 w-4" />}
          tone="blue"
        />
        <StatCard
          label={t("kb.stat.selected")}
          value={selectedSources.size}
          icon={<CheckCircleFilled className="text-sm" />}
          tone="teal"
        />
      </div>

      {/* Custom tab bar */}
      <div className="flex items-center gap-1 border-b border-stroke">
        {TABS.map((t_) => (
          <button
            key={t_.key}
            className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition ${
              tab === t_.key
                ? "border-brand text-brand"
                : "border-transparent text-muted hover:text-ink"
            }`}
            onClick={() => setTab(t_.key)}>
            {t_.icon}
            {t_.label}
            {t_.count > 0 && (
              <Badge
                count={t_.count}
                size="small"
                style={{
                  backgroundColor: tab === t_.key ? "#1d4ed8" : "#e2e8f0",
                  color: tab === t_.key ? "white" : "#64748b",
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Articles tab */}
      {tab === "articles" && (
        <div className="space-y-4">
          {/* Search */}
          <Input
            prefix={<SearchOutlined className="text-muted" />}
            placeholder={t("kb.search.articles")}
            value={articleSearch}
            onChange={(e) => setArticleSearch(e.target.value)}
            allowClear
            className="max-w-xs"
          />

          {filteredArticles.length === 0 ? (
            <Card className="border border-stroke bg-white shadow-sm">
              <Empty
                description={
                  articleSearch ? t("kb.empty.no_result") : t("kb.empty.title")
                }
                className="py-10">
                {!articleSearch && (
                  <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brandDark">
                    <FileAddOutlined />
                    {t("kb.btn.new_article")}
                  </button>
                )}
              </Empty>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onEdit={() => openEdit(article)}
                  onDelete={() => handleDelete(article.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sources tab */}
      {tab === "sources" && (
        <div className="space-y-4">
          {/* Header + search */}
          <Card
            size="small"
            className="border border-stroke bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                prefix={<SearchOutlined className="text-muted" />}
                placeholder={t("kb.search.sources")}
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                allowClear
                className="max-w-xs"
              />
              <span className="ml-auto text-xs text-muted">
                {selectedSources.size}/{allDocs.length}{" "}
                {t("kb.sources.selected_count")}
              </span>
              {selectedSources.size > 0 && (
                <Tooltip title={t("kb.sources.clear_all")}>
                  <button
                    className="text-xs font-medium text-red-400 hover:text-red-600"
                    onClick={() => setSelectedSources(new Set())}>
                    {t("kb.sources.clear_all")}
                  </button>
                </Tooltip>
              )}
            </div>
          </Card>

          {docsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Card key={i} size="small" className="border border-stroke">
                  <Skeleton.Input active block />
                </Card>
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <Card className="border border-stroke bg-white shadow-sm">
              <Empty
                description={
                  sourceSearch ? t("kb.empty.no_result") : t("kb.empty.no_docs")
                }
                className="py-8"
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map((doc) => (
                <SourceRow
                  key={doc.documentId}
                  doc={doc}
                  selected={selectedSources.has(doc.documentId)}
                  onToggle={() => toggleSource(doc.documentId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Article modal */}
      <BaseModal
        open={open}
        title={t(editingId ? "kb.modal.edit_title" : "kb.modal.create_title")}
        onCancel={handleClose}
        footer={null}>
        <Form form={form} layout="vertical" className="mt-2">
          <InputWithLabel
            name="title"
            label={t("kb.form.title_label")}
            formItemProps={{
              rules: [{ required: true, message: t("kb.form.title_required") }],
            }}
            autoFocus
          />
          <BaseTextArea
            name="content"
            label={t("kb.form.content_label")}
            rows={5}
          />
          <div className="flex justify-end gap-2 pt-2">
            <BaseButton
              htmlType="button"
              onClick={handleClose}
              label="global.cancel"
            />
            <BaseButton
              type="primary"
              htmlType="button"
              onClick={handleSave}
              label={editingId ? "global.save_changes" : "global.create"}
            />
          </div>
        </Form>
      </BaseModal>
    </div>
  );
};

export default KnowledgeBase;
