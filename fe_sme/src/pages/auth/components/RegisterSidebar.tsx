import { useLocale } from "@/i18n";
import {
  Mail,
  Building2,
  User,
  CreditCard,
  CheckCircle,
  Check,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { AuthSidebarShell } from "./AuthSidebarShell";

const STEP_ICONS = [
  <Mail key="email" className="w-4 h-4" />,
  <Building2 key="company" className="w-4 h-4" />,
  <User key="admin" className="w-4 h-4" />,
  <CreditCard key="plan" className="w-4 h-4" />,
  <CheckCircle key="confirm" className="w-4 h-4" />,
];

const STEP_KEYS = [
  { label: "register.step1.label", desc: "register.step1.desc" },
  { label: "register.step2.label", desc: "register.step2.desc" },
  { label: "register.step3.label", desc: "register.step3.desc" },
  { label: "register.step4.label", desc: "register.step4.desc" },
  { label: "register.step5.label", desc: "register.step5.desc" },
];

interface RegisterSidebarProps {
  step: number;
}

export const RegisterSidebar = ({ step }: RegisterSidebarProps) => {
  const { t } = useLocale();

  const steps = STEP_KEYS.map((k, i) => ({
    label: t(k.label),
    desc: t(k.desc),
    icon: STEP_ICONS[i],
  }));

  const trustBadges = [
    t("register.trust.no_card"),
    t("register.trust.trial"),
    t("register.trust.cancel"),
  ];

  return (
    <AuthSidebarShell>
      <BrandLogo variant="full" to="/" />

      <div className="mt-12 mb-10">
        <h2 className="text-2xl font-bold text-white leading-snug mb-2">
          {t("register.panel.heading")}
          <br />
          <span className="text-brand">
            {t("register.panel.heading_highlight")}
          </span>
        </h2>
        <p className="text-sm text-white/50 leading-relaxed">
          {t("register.panel.subtitle")}
        </p>
      </div>

        <nav className="flex flex-col gap-1">
          {steps.map((s, i) => {
            const isDone = i < step;
            const isActive = i === step;
            return (
              <div
                key={s.label}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive ? "bg-white/10 border border-white/15" : ""}
                  ${isDone ? "opacity-60" : isActive ? "opacity-100" : "opacity-40"}`}>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all
                    ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isActive
                          ? "bg-brand text-white shadow-md shadow-brand/40"
                          : "bg-white/8 text-white/40"
                    }`}>
                  {isDone ? <Check className="w-4 h-4" /> : s.icon}
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-[13px] font-semibold ${isActive ? "text-white" : "text-white/60"}`}>
                    {s.label}
                  </p>
                  <p
                    className={`text-[11px] ${isActive ? "text-white/50" : "text-white/30"}`}>
                    {s.desc}
                  </p>
                </div>

                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand animate-pulse shrink-0" />
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-10 space-y-2.5">
          {trustBadges.map((badge) => (
            <div
              key={badge}
              className="flex items-center gap-2 text-[12px] text-white/40">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              {badge}
            </div>
          ))}
        </div>
    </AuthSidebarShell>
  );
};
