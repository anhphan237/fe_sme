import { useParams } from "react-router-dom";
import { Card, Skeleton, Progress } from "antd";
import BaseButton from "@/components/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import { apiAcknowledgeDocument } from "@/api/document/document.api";

/** @deprecated stub — no gateway operation yet */
const useDocumentQuery = (id?: string) =>
  useQuery({
    queryKey: ["document", id],
    queryFn: () => Promise.resolve(null),
    enabled: Boolean(id),
  });
const useAcknowledgeDocument = () =>
  useMutation({ mutationFn: apiAcknowledgeDocument });

const DocumentDetail = () => {
  const { t } = useLocale();
  const { documentId } = useParams();
  const { data, isLoading, isError, refetch } = useDocumentQuery(
    documentId ?? "",
  );
  const acknowledge = useAcknowledgeDocument();

  if (isLoading) {
    return <Skeleton active className="mt-4" />;
  }

  if (isError) {
    return (
      <Card>
        <p className="text-sm text-gray-500">
          {t("document.error.something_wrong")}{" "}
          <button
            className="font-semibold text-blue-600 hover:underline"
            onClick={() => refetch()}>
            {t("document.error.retry")}
          </button>
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-gray-700">
            {t("document.detail.preview")}
          </h3>
          <div className="h-64 rounded-xl border border-dashed border-gray-200 bg-gray-50" />
        </Card>
        <Card>
          <h3 className="mb-2 text-base font-semibold text-gray-700">
            {t("document.detail.progress_title")}
          </h3>
          <p className="text-sm text-gray-400">
            {t("document.detail.time_spent")}
          </p>
          <Progress percent={54} className="mt-4" />
          {data && (
            <BaseButton
              type="primary"
              className="mt-6 w-full"
              onClick={() => acknowledge.mutate(data.documentId)}>
              {t("document.action.acknowledge")}
            </BaseButton>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-base font-semibold text-gray-700">
            {t("document.detail.access")}
          </h3>
          <div className="mt-2 space-y-2 text-sm text-gray-500">
            <p>Visibility: All departments</p>
            <p>Required roles: HR, Manager</p>
          </div>
        </Card>
        <Card>
          <h3 className="mb-3 text-base font-semibold text-gray-700">
            {t("document.detail.versions")}
          </h3>
          <div className="mt-2 space-y-2 text-sm text-gray-500">
            <p>v3 — Updated 2025-01-18</p>
            <p>v2 — Updated 2024-12-08</p>
            <p>v1 — Initial release</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DocumentDetail;
