import { Card } from "antd";
import BaseButton from "@/components/button";

const Notifications = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Notifications</h1>
        <p className="mt-1 text-sm text-slate-600">
          Choose how you receive onboarding updates.
        </p>
      </div>
      <Card>
        <div className="space-y-4">
          <label className="flex items-center justify-between text-sm">
            Email reminders
            <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between text-sm">
            In-app notifications
            <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between text-sm">
            Weekly summary
            <input type="checkbox" />
          </label>
        </div>
        <div className="mt-6">
          <BaseButton>Save</BaseButton>
        </div>
      </Card>
    </div>
  );
};

export default Notifications;
