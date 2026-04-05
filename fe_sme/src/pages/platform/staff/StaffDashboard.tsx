import { useNavigate } from "react-router-dom";
import { ClipboardCheck, CreditCard, ArrowRight } from "lucide-react";
import { useLocale } from "@/i18n";

const StaffDashboard = () => {
  const { t } = useLocale();
  const navigate = useNavigate();

  const links = [
    {
      label: t("platform.staff.dashboard.payments"),
      to: "/platform/staff/payments",
      icon: CreditCard,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: t("platform.staff.dashboard.onboarding"),
      to: "/platform/staff/onboarding",
      icon: ClipboardCheck,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          {t("platform.staff.dashboard.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("platform.staff.dashboard.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <button
            key={l.to}
            onClick={() => navigate(l.to)}
            className="flex items-center justify-between rounded-2xl border border-stroke bg-white px-5 py-5 text-left transition hover:shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`rounded-xl p-3 ${l.bg}`}>
                <l.icon className={`h-6 w-6 ${l.color}`} />
              </div>
              <span className="text-base font-medium text-slate-700">
                {l.label}
              </span>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default StaffDashboard;
