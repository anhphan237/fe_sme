import { Card } from "@core/components/ui/Card";
import { Badge } from "@core/components/ui/Badge";
import { STATUS_BADGE_VARIANT } from "../constants";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
}

export const StatCard = ({ icon, label, value, colorClass }: StatCardProps) => {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className={`rounded-xl p-2.5 ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="text-2xl font-bold text-ink">{value}</p>
      </div>
    </Card>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const variant =
    STATUS_BADGE_VARIANT[status as keyof typeof STATUS_BADGE_VARIANT] ??
    "default";
  return <Badge variant={variant}>{status}</Badge>;
};
