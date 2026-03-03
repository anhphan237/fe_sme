import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import {
  apiListTemplates,
  apiDeleteTemplate,
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapTemplate } from "@/utils/mappers/onboarding";
import type { OnboardingTemplate } from "../../shared/types";

const useTemplatesQuery = () =>
  useQuery({
    queryKey: ["templates"],
    queryFn: () => apiListTemplates(),
    select: (res: any) =>
      extractList(res, "templates", "items", "list").map(
        mapTemplate,
      ) as OnboardingTemplate[],
  });
const useDeleteTemplate = () => useMutation({ mutationFn: apiDeleteTemplate });

function Templates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading, isError, error, refetch } = useTemplatesQuery();
  const deleteTemplate = useDeleteTemplate();
  const [deleteTarget, setDeleteTarget] = useState<OnboardingTemplate | null>(
    null,
  );

  const handleEdit = (template: OnboardingTemplate) => {
    navigate(`/onboarding/templates/${template.id}`);
  };

  const handleDuplicate = (template: OnboardingTemplate) => {
    navigate("/onboarding/templates/new", {
      state: { duplicateFrom: template },
    });
  };

  const handleDeleteClick = (template: OnboardingTemplate) => {
    setDeleteTarget(template);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast("Template deleted.");
      setDeleteTarget(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to delete template.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        subtitle="Manage onboarding templates by role and department."
        actionLabel="New Template"
        onAction={() => navigate("/onboarding/templates/new")}
      />

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm">
            {error != null && typeof (error as Error).message === "string"
              ? (error as Error).message
              : "Something went wrong."}{" "}
            <button className="font-semibold" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : data && data.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No templates yet"
              description="Create your first onboarding template to get started."
              actionLabel="New Template"
              onAction={() => navigate("/onboarding/templates/new")}
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Template name</th>
                <th className="px-4 py-3">Stages</th>
                <th className="px-4 py-3">Tasks</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((template) => (
                <tr
                  key={template.id}
                  className="border-t border-stroke hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{template.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {template.stages.length}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {template.stages.reduce(
                      (sum, stage) => sum + stage.tasks.length,
                      0,
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{template.updatedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          navigate(`/onboarding/templates/${template.id}`)
                        }>
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleEdit(template)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDuplicate(template)}>
                        Duplicate
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteClick(template)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={!!deleteTarget}
        title="Delete template?"
        onClose={() => setDeleteTarget(null)}>
        {deleteTarget && (
          <>
            <p className="text-sm text-muted">
              Delete “{deleteTarget.name}”? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDeleteConfirm}
                disabled={deleteTemplate.isPending}>
                {deleteTemplate.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default Templates;
