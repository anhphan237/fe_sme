import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/ui/Card";
import { Tabs } from "../../../components/ui/Tabs";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import BaseModal from "@core/components/Modal/BaseModal";
import BaseButton from "@/components/button";
import { apiGetDocuments } from "@/api/document/document.api";

interface Article {
  id: string;
  title: string;
  content: string;
  tags: string;
}

const INITIAL_ARTICLES: Article[] = [
  {
    id: "1",
    title: "New hire checklist",
    content: "Structured onboarding checklist with milestones.",
    tags: "onboarding, checklist",
  },
  {
    id: "2",
    title: "Security & access policy",
    content: "Badge, device, and data access guidelines.",
    tags: "security, policy",
  },
  {
    id: "3",
    title: "Manager readiness",
    content: "Ensure managers are prepped for day one.",
    tags: "manager, onboarding",
  },
];

const BLANK_FORM = { title: "", content: "", tags: "" };

const useDocumentsQuery = () =>
  useQuery({ queryKey: ["documents"], queryFn: apiGetDocuments });

function KnowledgeBase() {
  const [tab, setTab] = useState("articles");
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [open, setOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const { data, isLoading } = useDocumentsQuery();

  const openCreate = () => {
    setEditingArticle(null);
    setForm(BLANK_FORM);
    setOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditingArticle(article);
    setForm({
      title: article.title,
      content: article.content,
      tags: article.tags,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingArticle(null);
    setForm(BLANK_FORM);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (editingArticle) {
      setArticles((prev) =>
        prev.map((a) =>
          a.id === editingArticle.id ? { ...editingArticle, ...form } : a,
        ),
      );
    } else {
      setArticles((prev) => [...prev, { id: String(Date.now()), ...form }]);
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base"
        subtitle="Curate articles and sources used by the chatbot."
        actionLabel="New article"
        onAction={openCreate}
      />

      <Tabs
        items={[
          { label: "Articles", value: "articles" },
          { label: "Sources", value: "sources" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "articles" ? (
        articles.length === 0 ? (
          <Card className="py-12 text-center">
            <p className="text-sm text-slate-400">No articles yet.</p>
            <Button className="mt-4" onClick={openCreate}>
              New article
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {articles.map((article) => (
              <Card key={article.id}>
                <h3 className="text-lg font-semibold text-slate-900">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{article.content}</p>
                {article.tags && (
                  <p className="mt-1 text-xs text-slate-400">{article.tags}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => openEdit(article)}
                    className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleDelete(article.id)}
                    className="gap-1.5 text-red-500 hover:bg-red-50 hover:text-red-700">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card>
          <h3 className="text-lg font-semibold">Searchable sources</h3>
          <p className="text-sm text-muted">
            Toggle which documents are used for AI answers.
          </p>
          {isLoading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-5" />
              <Skeleton className="h-5" />
              <Skeleton className="h-5" />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {data?.map((doc) => (
                <label
                  key={doc.id}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border border-stroke bg-slate-50 px-4 py-3 text-sm transition-colors hover:bg-slate-100">
                  {doc.title}
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-indigo-600"
                  />
                </label>
              ))}
            </div>
          )}
        </Card>
      )}

      <BaseModal
        open={open}
        title={editingArticle ? "Edit article" : "New article"}
        onCancel={handleClose}
        footer={null}>
        <form onSubmit={handleSave} className="grid gap-3 text-sm">
          <label className="grid gap-2">
            Title <span className="text-red-400">*</span>
            <input
              autoFocus
              required
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className="rounded-2xl border border-stroke px-4 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="grid gap-2">
            Content
            <textarea
              value={form.content}
              onChange={(e) =>
                setForm((f) => ({ ...f, content: e.target.value }))
              }
              className="rounded-2xl border border-stroke px-4 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              rows={4}
            />
          </label>
          <label className="grid gap-2">
            Tags
            <input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. onboarding, hr"
              className="rounded-2xl border border-stroke px-4 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <BaseButton
              htmlType="button"
              onClick={handleClose}
              label="global.cancel"
            />
            <BaseButton
              type="primary"
              htmlType="submit"
              label={editingArticle ? "global.save_changes" : "global.create"}
            />
          </div>
        </form>
      </BaseModal>
    </div>
  );
}

export default KnowledgeBase;
