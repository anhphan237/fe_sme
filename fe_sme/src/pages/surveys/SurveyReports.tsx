import { PageHeader } from "@core/components/PageHeader";
import { Card } from "@core/components/ui/Card";
import { Button } from "@core/components/ui/Button";
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";

const trendData = [
  { month: "Sep", value: 72 },
  { month: "Oct", value: 75 },
  { month: "Nov", value: 78 },
  { month: "Dec", value: 82 },
  { month: "Jan", value: 86 },
];

const deptData = [
  { dept: "HR", value: 88 },
  { dept: "Engineering", value: 74 },
];

const SurveyReports = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Survey Reports"
        subtitle="Aggregate insights from onboarding surveys."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-muted">Response rate</p>
          <p className="mt-2 text-2xl font-semibold">82%</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Avg satisfaction</p>
          <p className="mt-2 text-2xl font-semibold">4.3</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">NPS-like score</p>
          <p className="mt-2 text-2xl font-semibold">58</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Completion trend</p>
          <p className="mt-2 text-2xl font-semibold">+12%</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold">Completion trend</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold">By department</h3>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dept" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Responses</h3>
          <Button variant="secondary">Export CSV</Button>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-stroke pb-2 text-muted">
            <span>Employee</span>
            <span>Score</span>
            <span>Submitted</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Leah Porter</span>
            <span>4.6</span>
            <span>2025-01-22</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Jin Park</span>
            <span>4.2</span>
            <span>2025-01-20</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SurveyReports;
