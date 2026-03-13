import { useParams } from "react-router-dom";
import { PageHeader } from "@core/components/PageHeader";
import { Card } from "@core/components/ui/Card";
import { Badge } from "@core/components/ui/Badge";
import { Button } from "@core/components/ui/Button";
import { Progress } from "@core/components/ui/Progress";
import { Skeleton } from "@core/components/ui/Skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  const { documentId } = useParams();
  const { data, isLoading, isError, refetch } = useDocumentQuery(
    documentId ?? "",
  );
  const acknowledge = useAcknowledgeDocument();

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (isError) {
    return (
      <Card>
        <p className="text-sm">
          Something went wrong.{" "}
          <button className="font-semibold" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={data?.title ?? "Document"}
        subtitle="Track reads and acknowledgments."
        extra={data?.required ? <Badge>Required</Badge> : null}
        actionLabel="Edit"
        onAction={() => {}}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold">Preview</h3>
          <div className="mt-4 h-64 rounded-2xl border border-dashed border-stroke bg-slate-50" />
        </Card>
        <Card>
          <h3 className="text-lg font-semibold">Reading progress</h3>
          <p className="text-sm text-muted">Time spent: 4 min</p>
          <div className="mt-4">
            <Progress value={54} />
          </div>
          {data?.required && (
            <Button
              className="mt-6"
              onClick={() => acknowledge.mutate(data.id)}>
              Acknowledge
            </Button>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold">Access settings</h3>
          <div className="mt-4 space-y-2 text-sm text-muted">
            <p>Visibility: All departments</p>
            <p>Required roles: HR, Manager</p>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold">Version history</h3>
          <div className="mt-4 space-y-2 text-sm text-muted">
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
