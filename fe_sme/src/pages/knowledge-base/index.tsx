import { useState } from "react";
import {
  FileAddOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Card, Form, Skeleton, Tabs, Typography } from "antd";
import BaseModal from "@core/components/Modal/BaseModal";
import BaseButton from "@/components/button";
import InputWithLabel from "@core/components/Input/InputWithLabel";
import BaseTextArea from "@core/components/TextArea/BaseTextArea";
import { apiGetDocuments } from "@/api/document/document.api";
import { useLocale } from "@/i18n";

const { Text } = Typography;

interface KbArticle {
  id: string;
  title: string;
  content: string;
}

type ArticleFormValues = Pick<KbArticle, "title" | "content">;

const KnowledgeBase = () => {
  const { t } = useLocale();
  const [tab, setTab] = useState("articles");
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm<ArticleFormValues>();

  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: apiGetDocuments,
  });

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
      setArticles((prev) => [...prev, { id: String(Date.now()), ...values }]);
    }
    handleClose();
  };

  const handleDelete = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex justify-end">
        <BaseButton
          type="primary"
          icon={<FileAddOutlined />}
          label="kb.btn.new_article"
          onClick={openCreate}
        />
      </div>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: "articles", label: t("kb.tab.articles") },
          { key: "sources", label: t("kb.tab.sources") },
        ]}
      />

      {tab === "articles" ? (
        articles.length === 0 ? (
          <Card className="py-6 text-center">
            <Text type="secondary" className="block text-sm">
              {t("kb.empty.title")}
            </Text>
            <div className="mt-3">
              <BaseButton label="kb.btn.new_article" onClick={openCreate} />
            </div>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {articles.map((article) => (
              <Card key={article.id} size="small">
                <h3 className="text-base font-semibold text-slate-900">
                  {article.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{article.content}</p>
                <div className="mt-3 flex gap-2">
                  <BaseButton
                    type="text"
                    icon={<EditOutlined />}
                    label="global.edit"
                    onClick={() => openEdit(article)}
                  />
                  <BaseButton
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    label="global.delete"
                    onClick={() => handleDelete(article.id)}
                  />
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card title={t("kb.sources.title")}>
          <Text type="secondary" className="text-sm">
            {t("kb.sources.subtitle")}
          </Text>
          {isLoading ? (
            <div className="mt-3 space-y-2">
              <Skeleton.Input active block />
              <Skeleton.Input active block />
              <Skeleton.Input active block />
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {data?.items?.map((doc) => (
                <label
                  key={doc.documentId}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-stroke bg-slate-50 px-4 py-2.5 text-sm transition-colors hover:bg-slate-100">
                  {doc.name}
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
            rows={4}
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
