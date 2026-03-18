import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Tag, Skeleton, Empty, Form, Button } from "antd";
import BaseButton from "@/components/button";
import BaseSearch from "@/components/search";
import BaseModal from "@core/components/Modal/BaseModal";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import { useLocale } from "@/i18n";
import { apiGetDocuments, apiSaveDocument } from "@/api/document/document.api";
import type { DocumentItem } from "@/interface/document";

const useDocumentsQuery = () =>
  useQuery({
    queryKey: ["documents"],
    queryFn: apiGetDocuments,
    select: (res) => res.items,
  });

const folders = ["Company", "Department", "Compliance", "Security"];
const folderOptions = folders.map((f) => ({ label: f, value: f }));

const Documents = () => {
  const { t } = useLocale();
  const { data, isLoading, isError, refetch } = useDocumentsQuery();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [form] = Form.useForm();

  const handleUpload = () => {
    form.validateFields().then((values) => {
      apiSaveDocument(values).finally(() => {
        form.resetFields();
        setOpen(false);
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BaseSearch placeholder={t("global.search")} />
        <BaseButton type="primary" onClick={() => setOpen(true)}>
          {t("document.action.upload")}
        </BaseButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card>
          <h3 className="mb-4 text-base font-semibold text-gray-700">
            {t("document.sidebar.folders")}
          </h3>
          <div className="space-y-2 text-sm">
            {folders.map((folder) => (
              <button
                key={folder}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50">
                <span>{folder}</span>
                <span className="text-xs text-gray-400">12</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-700">
              {t("document.library.title")}
            </h3>
            <div className="flex gap-2">
              <Button
                size="small"
                type={view === "grid" ? "primary" : "default"}
                onClick={() => setView("grid")}>
                {t("document.view.grid")}
              </Button>
              <Button
                size="small"
                type={view === "list" ? "primary" : "default"}
                onClick={() => setView("list")}>
                {t("document.view.list")}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton active />
              <Skeleton active />
            </div>
          ) : isError ? (
            <div className="py-4 text-sm text-gray-500">
              {t("document.error.something_wrong")}{" "}
              <button
                className="font-semibold text-blue-600 hover:underline"
                onClick={() => refetch()}>
                {t("document.error.retry")}
              </button>
            </div>
          ) : !data || data.length === 0 ? (
            <Empty description={t("document.empty.description")} className="py-8">
              <BaseButton type="primary" onClick={() => setOpen(true)}>
                {t("document.action.upload")}
              </BaseButton>
            </Empty>
          ) : view === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2">
              {data.map((doc: DocumentItem) => (
                <Card
                  key={doc.documentId}
                  size="small"
                  className="border border-gray-200 transition hover:border-blue-300 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="flex-1 truncate text-sm font-semibold">
                      {doc.name}
                    </h4>
                    {doc.status && (
                      <Tag color="blue" className="shrink-0 text-xs">
                        {doc.status}
                      </Tag>
                    )}
                  </div>
                  {doc.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {doc.description}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data.map((doc: DocumentItem) => (
                <div
                  key={doc.documentId}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                  <span className="font-medium">{doc.name}</span>
                  {doc.status && (
                    <Tag color="blue" className="text-xs">
                      {doc.status}
                    </Tag>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <BaseModal
        open={open}
        title={t("document.modal.upload.title")}
        onCancel={() => setOpen(false)}
        onOk={handleUpload}
        okText={t("document.action.upload")}>
        <Form form={form} layout="vertical" className="mt-4 space-y-3">
          <BaseInput
            name="name"
            label={t("document.field.name")}
            placeholder={t("document.field.name.placeholder")}
            formItemProps={{ rules: [{ required: true }] }}
          />
          <BaseInput
            name="fileUrl"
            label={t("document.field.file_url")}
            placeholder={t("document.field.file_url.placeholder")}
            formItemProps={{ rules: [{ required: true }] }}
          />
          <BaseInput
            name="description"
            label={t("document.field.description")}
            placeholder={t("document.field.description.placeholder")}
          />
          <BaseSelect
            name="documentCategoryId"
            label={t("document.field.category")}
            options={folderOptions}
            placeholder={t("document.field.category.placeholder")}
          />
        </Form>
      </BaseModal>
    </div>
  );
};

export default Documents;

