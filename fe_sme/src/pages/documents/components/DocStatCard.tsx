import { Card } from "antd";

type Tone = "blue" | "teal" | "amber" | "violet" | "rose" | "indigo";

const TONE_CLASS: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-600",
  teal: "bg-teal-50 text-teal-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  rose: "bg-rose-50 text-rose-600",
  indigo: "bg-indigo-50 text-indigo-600",
};

interface DocStatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone: Tone;
  onClick?: () => void;
}

const DocStatCard = ({ label, value, icon, tone, onClick }: DocStatCardProps) => (
  <Card
    size="small"
    className={`border border-stroke bg-white shadow-sm transition hover:shadow-soft ${onClick ? "cursor-pointer" : ""}`}
    onClick={onClick}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{value}</p>
      </div>
      <div className={`rounded-xl p-2.5 ${TONE_CLASS[tone]}`}>{icon}</div>
    </div>
  </Card>
);

export default DocStatCard;
