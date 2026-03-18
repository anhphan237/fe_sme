import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";

const FEATURE_ICONS = [
  <path
    key="f-onboarding"
    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
  <path
    key="f-roles"
    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
  <path
    key="f-progress"
    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
  <path
    key="f-documents"
    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
];

const FEATURE_KEYS = [
  {
    title: "auth.sidebar.feature.onboarding.title",
    desc: "auth.sidebar.feature.onboarding.desc",
  },
  {
    title: "auth.sidebar.feature.roles.title",
    desc: "auth.sidebar.feature.roles.desc",
  },
  {
    title: "auth.sidebar.feature.progress.title",
    desc: "auth.sidebar.feature.progress.desc",
  },
  {
    title: "auth.sidebar.feature.documents.title",
    desc: "auth.sidebar.feature.documents.desc",
  },
] as const;

const TRUST_KEYS = [
  "auth.sidebar.trust.no_cc",
  "auth.sidebar.trust.trial",
  "auth.sidebar.trust.cancel",
] as const;

const LoginSidebar = () => {
  const { t } = useLocale();

  return (
    <aside className="hidden lg:flex flex-col w-[380px] xl:w-[440px] shrink-0 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 20%, #3b82f620 0%, transparent 55%),
                            radial-gradient(circle at 75% 75%, #7c3aed18 0%, transparent 55%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative flex flex-col h-full px-10 py-10">
        <Link to="/" className="flex items-center gap-2.5 w-fit">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand to-brandDark opacity-90 shadow-md shadow-brand/30" />
            <div className="relative flex items-center justify-center w-full h-full">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="w-[18px] h-[18px]">
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
            {t("auth.sidebar.headline")}
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            {t("auth.sidebar.subheadline")}
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {FEATURE_KEYS.map((keys, idx) => (
            <div
              key={keys.title}
              className="flex items-start gap-3.5 px-4 py-3 rounded-xl opacity-80 hover:opacity-100 hover:bg-white/5 transition-all duration-200">
              <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center shrink-0 text-white/70 mt-0.5">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  {FEATURE_ICONS[idx]}
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white/80">
                  {t(keys.title)}
                </p>
                <p className="text-[11px] text-white/40 leading-relaxed">
                  {t(keys.desc)}
                </p>
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto pt-10 space-y-2.5">
          {TRUST_KEYS.map((key) => (
            <div
              key={key}
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
              {t(key)}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default LoginSidebar;
