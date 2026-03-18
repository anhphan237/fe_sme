import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, Skeleton, Empty, Select } from "antd";
import MyTable from "@/components/table";
import type { ColumnsType } from "antd/es/table";
import { useLocale } from "@/i18n";
import { apiGetDocuments } from "@/api/document/document.api";
import type { DocumentItem } from "@/interface/document";

/** @deprecated stub — no gateway operation yet */
const useAcknowledgmentsQuery = () =>
  useQuery({
    queryKey: ["acknowledgments"],
    queryFn: () => Promise.resolve([]),
  });
const useDocumentsQuery = () =>
  useQuery({
    queryKey: ["documents"],
    queryFn: apiGetDocuments,
    select: (res) => res.items,
  });

const Acknowledgments = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useAcknowledgmentsQuery();
  const { data: documents } = useDocumentsQuery();

  const statusOptions = [
    { label: t("document.ack.status.acknowledged"), value: "acknowledged" },
    { label: t("document.ack.status.pending"), value: "pending" },
  ];

  const documentOptions =
    documents?.map((doc: DocumentItem) => ({
      label: doc.name,
      value: doc.documentId,
    })) ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid gap-3 md:grid-cols-2">
          <Select
            placeholder={t("document.ack.filter.document")}
            options={documentOptions}
            allowClear
            className="w-full"
          />
          <Select
            placeholder={t("document.ack.filter.status")}
            options={statusOptions}
            allowClear
            className="w-full"
          />
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton active />
            <Skeleton active />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-gray-500">
            {t("document.error.something_wrong")}{" "}
            <button
              className="font-semibold text-blue-600 hover:underline"
              onClick={() => refetch()}>
              {t("document.error.retry")}
            </button>
          </div>
        ) : data && data.length === 0 ? (
          <div className="p-6">
            <Empty description={t("document.ack.empty.description")}>
              <button
                className="text-sm font-semibold text-blue-600 hover:underline"
                onClick={() => navigate("/documents")}>
                {t("document.ack.goto_documents")}
              </button>
            </Empty>
          </div>
        ) : (
          <MyTable
            dataSource={data}
            rowKey="id"
            columns={
              [
                {
                  title: t("document.ack.col.employee"),
                  dataIndex: "employeeId",
                  key: "employeeId",
                },
                {
                  title: t("document.ack.col.document"),
                  key: "documentId",
                  render: (_: unknown, ack: any) => {
                    const doc = documents?.find(
                      (item: DocumentItem) =>
                        item.documentId === ack.documentId,
                    );
                    return doc?.name ?? ack.documentId;
                  },
                },
                {
                  title: t("document.ack.col.progress"),
                  dataIndex: "progress",
                  key: "progress",
                  render: (val: number) => `${val}%`,
                },
                {
                  title: t("document.ack.col.acknowledged"),
                  dataIndex: "acknowledged",
                  key: "acknowledged",
                  render: (val: boolean) =>
                    val
                      ? t("document.ack.status.acknowledged")
                      : t("document.ack.status.pending"),
                },
                {
                  title: t("document.ack.col.timestamp"),
                  dataIndex: "timestamp",
                  key: "timestamp",
                  render: (val: string | null) => val ?? "-",
                },
              ] as ColumnsType<any>
            }
          />
        )}
      </Card>
    </div>
  );
};

export default Acknowledgments;
