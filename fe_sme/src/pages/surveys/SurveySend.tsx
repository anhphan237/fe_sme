import { useMemo } from "react";
import { PageHeader } from "@core/components/PageHeader";
import { Card } from "@core/components/ui/Card";
import { Button } from "@core/components/ui/Button";

const SurveySend = () => {
  const dates = useMemo(() => {
    const start = new Date();
    const addDays = (days: number) =>
      new Date(start.getTime() + days * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
    return {
      day7: addDays(7),
      day30: addDays(30),
      day60: addDays(60),
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send Surveys"
        subtitle="Schedule 7-30-60 surveys for new hires."
      />
      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-sm">
            Choose employees
            <select
              className="rounded-2xl border border-stroke px-4 py-2"
              multiple>
              <option>Leah Porter</option>
              <option>Jin Park</option>
              <option>Evan Cole</option>
              <option>Mara Olsen</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Start date
            <input
              type="date"
              className="rounded-2xl border border-stroke px-4 py-2"
            />
          </label>
          <label className="grid gap-2 text-sm">
            Day 7 template
            <select className="rounded-2xl border border-stroke px-4 py-2">
              <option>Day 7 Pulse</option>
              <option>Custom</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Day 30 template
            <select className="rounded-2xl border border-stroke px-4 py-2">
              <option>Day 30 Check-in</option>
              <option>Custom</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Day 60 template
            <select className="rounded-2xl border border-stroke px-4 py-2">
              <option>Custom Journey Survey</option>
              <option>Day 30 Check-in</option>
            </select>
          </label>
        </div>
        <div className="mt-6 rounded-2xl border border-stroke bg-slate-50 p-4 text-sm">
          <p className="font-semibold">Computed send dates</p>
          <p className="text-muted">Day 7: {dates.day7}</p>
          <p className="text-muted">Day 30: {dates.day30}</p>
          <p className="text-muted">Day 60: {dates.day60}</p>
        </div>
        <Button className="mt-6">Schedule</Button>
      </Card>
    </div>
  );
};

export default SurveySend;
