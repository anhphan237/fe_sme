import { useNavigate } from "react-router-dom";
import { PageHeader } from "@core/components/PageHeader";
import { Card } from "@core/components/ui/Card";
import { Table } from "@core/components/ui/Table";
import { Skeleton } from "@core/components/ui/Skeleton";
import { EmptyState } from "@core/components/ui/EmptyState";
import { useQuery } from "@tanstack/react-query";
import { apiGetDocuments } from "@/api/document/document.api";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapUser } from "@/utils/mappers/identity";
import type { User } from "@/shared/types";

/** @deprecated stub — no gateway operation yet */
const useAcknowledgmentsQuery = () =>
  useQuery({
    queryKey: ["acknowledgments"],
    queryFn: () => Promise.resolve([]),
  });
const useDocumentsQuery = () =>
  useQuery({ queryKey: ["documents"], queryFn: apiGetDocuments });
const useUsersQuery = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: any) =>
      extractList(res, "users", "items").map(mapUser) as User[],
  });

const Acknowledgments = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useAcknowledgmentsQuery();
  const { data: documents } = useDocumentsQuery();
  const { data: users } = useUsersQuery();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Acknowledgments"
        subtitle="Track which employees have acknowledged required documents."
      />

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <select className="rounded-2xl border border-stroke px-4 py-2 text-sm">
            <option>Document</option>
            {documents?.map((doc) => (
              <option key={doc.id}>{doc.title}</option>
            ))}
          </select>
          <select className="rounded-2xl border border-stroke px-4 py-2 text-sm">
            <option>Department</option>
            <option>HR</option>
            <option>Engineering</option>
          </select>
          <select className="rounded-2xl border border-stroke px-4 py-2 text-sm">
            <option>Status</option>
            <option>Acknowledged</option>
            <option>Pending</option>
          </select>
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm">
            Something went wrong.{" "}
            <button className="font-semibold" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : data && data.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No acknowledgments yet"
              description="Acknowledge documents to start tracking progress."
              actionLabel="Go to Documents"
              onAction={() => navigate("/documents")}
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Progress %</th>
                <th className="px-4 py-3">Acknowledged</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((ack) => {
                const doc = documents?.find(
                  (item) => item.id === ack.documentId,
                );
                const user = users?.find((item) => item.id === ack.employeeId);
                return (
                  <tr
                    key={ack.id}
                    className="border-t border-stroke hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{user?.name}</td>
                    <td className="px-4 py-3 text-muted">{doc?.title}</td>
                    <td className="px-4 py-3 text-muted">{ack.progress}%</td>
                    <td className="px-4 py-3 text-muted">
                      {ack.acknowledged ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {ack.timestamp ?? "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default Acknowledgments;
