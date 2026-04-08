import { Card } from "antd";
import BaseButton from "@/components/button";
import { useLocale } from "@/i18n";

const Notifications = () => {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          {t("notification.settings.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {t("notification.settings.subtitle")}
        </p>
      </div>
      <Card>
        <div className="space-y-4">
          <label className="flex items-center justify-between text-sm">
            {t("notification.settings.email_reminders")}
            <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between text-sm">
            {t("notification.settings.in_app")}
            <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between text-sm">
            {t("notification.settings.weekly_summary")}
            <input type="checkbox" />
          </label>
        </div>
        <div className="mt-6">
          <BaseButton>{t("global.save")}</BaseButton>
        </div>
      </Card>
    </div>
  );
};

export default Notifications;

