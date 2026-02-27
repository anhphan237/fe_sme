import { useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useQuery } from "@tanstack/react-query";
import { apiGetDocuments } from "@/api/document/document.api";

const useDocumentsQuery = () =>
  useQuery({ queryKey: ["documents"], queryFn: apiGetDocuments });
import { Skeleton } from "../../components/ui/Skeleton";

const articles = [
  {
    title: "New hire checklist",
    content: "Structured onboarding checklist with milestones.",
  },
  {
    title: "Security & access policy",
    content: "Badge, device, and data access guidelines.",
  },
  {
    title: "Manager readiness",
    content: "Ensure managers are prepped for day one.",
  },
];

function KnowledgeBase() {
  const [tab, setTab] = useState("articles");
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useDocumentsQuery();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base"
        subtitle="Curate articles and sources used by the chatbot."
        actionLabel="New article"
        onAction={() => setOpen(true)}
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
        <div className="grid gap-4 lg:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.title}>
              <h3 className="text-lg font-semibold">{article.title}</h3>
              <p className="mt-2 text-sm text-muted">{article.content}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="ghost">Edit</Button>
                <Button variant="ghost">Delete</Button>
              </div>
            </Card>
          ))}
        </div>
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
              {data?.slice(0, 6).map((doc) => (
                <label
                  key={doc.id}
                  className="flex items-center justify-between rounded-2xl border border-stroke bg-slate-50 px-4 py-3 text-sm">
                  {doc.title}
                  <input type="checkbox" defaultChecked />
                </label>
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal open={open} title="New article" onClose={() => setOpen(false)}>
        <div className="grid gap-3 text-sm">
          <label className="grid gap-2">
            Title
            <input className="rounded-2xl border border-stroke px-4 py-2" />
          </label>
          <label className="grid gap-2">
            Content
            <textarea
              className="rounded-2xl border border-stroke px-4 py-2"
              rows={4}
            />
          </label>
          <label className="grid gap-2">
            Tags
            <input className="rounded-2xl border border-stroke px-4 py-2" />
          </label>
          <Button>Save</Button>
        </div>
      </Modal>
    </div>
  );
}

export default KnowledgeBase;
