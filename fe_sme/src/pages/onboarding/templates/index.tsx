import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, message } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import { useGlobalStore } from "@/stores/global.store";
import {
  apiListTemplates,
  apiUpdateTemplate,
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapTemplate } from "@/utils/mappers/onboarding";
import { TemplateFilters } from "./TemplateFilters";
import { TemplateTable } from "./TemplateTable";
import { TemplateToggleModal } from "./TemplateToggleModal";
import type { OnboardingTemplate } from "@/shared/types";

export type StatusFilter = "ACTIVE" | "INACTIVE" | "";

const Templates = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const setBreadcrumbs = useGlobalStore((s) => s.setBreadcrumbs);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [actionTarget, setActionTarget] = useState<OnboardingTemplate | null>(
    null,
  );

  const isActive =
    (actionTarget?.status ?? "ACTIVE").toUpperCase() === "ACTIVE";

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["templates", statusFilter],
    queryFn: () => apiListTemplates(statusFilter),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "templates",
        "items",
        "list",
      ).map(mapTemplate) as OnboardingTemplate[],
  });

  const toggleMutation = useMutation({
    mutationFn: (payload: {
      templateId: string;
      status: "ACTIVE" | "INACTIVE";
    }) => apiUpdateTemplate(payload),
  });

  const handleConfirm = useCallback(async () => {
    if (!actionTarget) return;
    const newStatus = isActive ? "INACTIVE" : "ACTIVE";
    try {
      await toggleMutation.mutateAsync({
        templateId: actionTarget.id,
        status: newStatus,
      });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      message.success(
        t(
          isActive
            ? "onboarding.template.toast.deactivated"
            : "onboarding.template.toast.activated",
        ),
      );
      setActionTarget(null);
    } catch (e) {
      message.error(
        e instanceof Error
          ? e.message
          : t(
              isActive
                ? "onboarding.template.toast.deactivate_failed"
                : "onboarding.template.toast.activate_failed",
            ),
      );
    }
  }, [actionTarget, isActive, toggleMutation, queryClient, t]);

  const handleEdit = useCallback(
    (tmpl: OnboardingTemplate) => {
      setBreadcrumbs({ [tmpl.id]: tmpl.name });
      navigate(`/onboarding/templates/${tmpl.id}`);
    },
    [navigate, setBreadcrumbs],
  );

  const handleDuplicate = useCallback(
    (tmpl: OnboardingTemplate) => {
      navigate("/onboarding/templates/new", {
        state: { duplicateFrom: tmpl },
      });
    },
    [navigate],
  );

  const handleNewTemplate = useCallback(
    () => navigate("/onboarding/templates/new"),
    [navigate],
  );

  return (
    <div className="space-y-4">
      {/* Filter tabs + action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TemplateFilters
          statusFilter={statusFilter}
          onChange={setStatusFilter}
          count={data?.length}
          isLoading={isLoading}
        />
        <Button type="primary" onClick={handleNewTemplate}>
          {t("onboarding.template.action.new")}
        </Button>
      </div>

      <Card className="p-0">
        <TemplateTable
          isLoading={isLoading}
          isError={isError}
          error={error as Error | null}
          data={data}
          statusFilter={statusFilter}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onToggleStatus={setActionTarget}
          onRetry={refetch}
          onNewTemplate={handleNewTemplate}
        />
      </Card>

      <TemplateToggleModal
        actionTarget={actionTarget}
        isActive={isActive}
        isPending={toggleMutation.isPending}
        onConfirm={handleConfirm}
        onClose={() => setActionTarget(null)}
      />
    </div>
  );
};

export default Templates;
