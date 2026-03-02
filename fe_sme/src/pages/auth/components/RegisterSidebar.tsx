import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";

const STEP_ICONS = [
  <svg key="email" viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path
      d="M2 6.5l8 5 8-5M2 6.5A1.5 1.5 0 013.5 5h13A1.5 1.5 0 0118 6.5v7a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 13.5v-7z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>,
  <svg key="company" viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path
      d="M3 17V7l7-4 7 4v10M3 17h14M8 17v-4h4v4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>,
  <svg key="admin" viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>,
  <svg key="plan" viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <rect
      x="2.5"
      y="5.5"
      width="15"
      height="9"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M2.5 8.5h15" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M6 12h2M11 12h3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>,
  <svg key="confirm" viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path
      d="M4 10.5l4 4 8-8"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>,
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

export function RegisterSidebar({ step }: RegisterSidebarProps) {
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
    <aside className="hidden lg:flex flex-col w-[360px] xl:w-[420px] shrink-0 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, #3b82f620 0%, transparent 60%),
                            radial-gradient(circle at 80% 80%, #7c3aed20 0%, transparent 60%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative flex flex-col h-full px-10 py-10">
        <Link to="/" className="flex items-center gap-2.5 group w-fit">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand to-brandDark opacity-90 shadow-md shadow-brand/30" />
            <div className="relative flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 20 20" fill="none" className="w-4.5 h-4.5">
                <rect
                  x="3"
                  y="2"
                  width="14"
                  height="16"
                  rx="2.5"
                  stroke="white"
                  strokeWidth="1.5"
                />
                <path
                  d="M7 7h6M7 10.5h6M7 14h4"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="15" cy="15" r="3.5" fill="white" />
                <path
                  d="M13.5 15l1 1 2-1.5"
                  stroke="#6C63FF"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[17px] font-bold text-white tracking-tight">
              Onboard<span className="text-brand">IQ</span>
            </span>
            <span className="text-[9px] font-semibold text-white/40 uppercase tracking-[0.2em]">
              SME Platform
            </span>
          </div>
        </Link>

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
                  {isDone ? (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8l3.5 3.5L13 4.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    s.icon
                  )}
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
              <svg
                className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                viewBox="0 0 16 16"
                fill="none">
                <path
                  d="M3 8l3.5 3.5L13 4.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {badge}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
