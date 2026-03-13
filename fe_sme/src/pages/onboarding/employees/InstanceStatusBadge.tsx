import { Badge } from "@core/components/ui/Badge";

const INSTANCE_STATUS_VARIANT: Record<
  string,
  "success" | "default" | "warning"
> = {
  ACTIVE: "success",
  COMPLETED: "default",
  CANCELLED: "warning",
};

interface InstanceStatusBadgeProps {
  status: string;
}

export const InstanceStatusBadge = ({ status }: InstanceStatusBadgeProps) => {
  const variant = INSTANCE_STATUS_VARIANT[status.toUpperCase()] ?? "default";
  return <Badge variant={variant}>{status}</Badge>;
};
