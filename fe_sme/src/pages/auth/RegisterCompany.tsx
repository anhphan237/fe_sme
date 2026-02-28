import { useState, useMemo, useRef, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/Toast";
import { useAppStore } from "../../store/useAppStore";
import { useLocale } from "@/i18n";
import type { Locale } from "@/store/useAppStore";
import type { Tenant } from "../../shared/types";
import { apiCheckEmailExists } from "@/api/identity/identity.api";
import { apiRegisterCompany } from "@/api/company/company.api";

// ── Languages ─────────────────────────────────────────────
const LANGUAGES: {
  value: Locale;
  flag: string;
  label: string;
  native: string;
}[] = [
  { value: "vi_VN", flag: "🇻🇳", label: "Tiếng Việt", native: "VI" },
  { value: "en_US", flag: "🇺🇸", label: "English", native: "EN" },
];

// ── Language switcher component ───────────────────────────
function LangSwitcher() {
  const { t } = useLocale();
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.value === locale) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("register.lang.label")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-all duration-200
          ${
            open
              ? "border-brand/40 text-brand bg-brand/5"
              : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 bg-white"
          }`}>
        <span className="text-base leading-none">{current.flag}</span>
        <span>{current.native}</span>
        <svg
          className={`w-3 h-3 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none">
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        className={`absolute right-0 top-[calc(100%+8px)] w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50
        transition-all duration-200 origin-top-right
        ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
            {t("register.lang.label")}
          </p>
        </div>
        {LANGUAGES.map((lang) => {
          const isActive = locale === lang.value;
          return (
            <button
              key={lang.value}
              type="button"
              onClick={() => {
                setLocale(lang.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors
                ${isActive ? "bg-brand/5 text-brand" : "text-gray-700 hover:bg-gray-50"}`}>
              <span className="text-xl leading-none">{lang.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold leading-tight">
                  {lang.label}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">
                  {lang.native}
                </p>
              </div>
              {isActive && (
                <svg
                  className="w-4 h-4 text-brand shrink-0"
                  viewBox="0 0 16 16"
                  fill="none">
                  <path
                    d="M3 8l3.5 3.5L13 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const TIMEZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "UTC",
  "Europe/London",
  "America/New_York",
];

// ── Field wrapper ─────────────────────────────────────────
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-semibold text-gray-700">
          {label}
        </label>
        {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-[12px] text-red-500">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M8 5v4M8 11v.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const INPUT_CLS =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10";

const SELECT_CLS =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 appearance-none cursor-pointer";

// ── Main component ────────────────────────────────────────
function RegisterCompany() {
  const { t } = useLocale();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailExistsError, setEmailExistsError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { setTenant, setUser, setToken } = useAppStore();

  // ── Zod schema (messages are translation keys resolved via t()) ──
  const schema = useMemo(
    () =>
      z.object({
        adminUsername: z.string().email(t("register.zod.email_required")),
        companyName: z.string().min(2, t("register.zod.company_name_required")),
        taxCode: z.string().min(1, t("register.zod.tax_code_required")),
        address: z.string().min(2, t("register.zod.address_required")),
        timezone: z.string().min(1, t("register.zod.timezone_required")),
        adminFullName: z.string().min(2, t("register.zod.fullname_required")),
        adminPassword: z.string().min(6, t("register.zod.password_min")),
        adminPhone: z.string().optional(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  type RegisterForm = z.infer<typeof schema>;

  // ── Translated steps (memoised per locale change) ──
  const STEPS = useMemo(
    () => [
      {
        label: t("register.step1.label"),
        desc: t("register.step1.desc"),
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
            <path
              d="M2 6.5l8 5 8-5M2 6.5A1.5 1.5 0 013.5 5h13A1.5 1.5 0 0118 6.5v7a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 13.5v-7z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        label: t("register.step2.label"),
        desc: t("register.step2.desc"),
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
            <path
              d="M3 17V7l7-4 7 4v10M3 17h14M8 17v-4h4v4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        label: t("register.step3.label"),
        desc: t("register.step3.desc"),
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
            <circle
              cx="10"
              cy="7"
              r="3.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ),
      },
      {
        label: t("register.step4.label"),
        desc: t("register.step4.desc"),
        icon: (
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
            <path
              d="M4 10.5l4 4 8-8"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ],
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
    trigger,
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { timezone: "Asia/Ho_Chi_Minh" },
  });

  const handleContinueFromEmail = async () => {
    setEmailExistsError(null);
    const ok = await trigger("adminUsername");
    if (!ok) return;
    const email = getValues("adminUsername");
    setCheckingEmail(true);
    try {
      const { exists } = await apiCheckEmailExists(email);
      if (exists) {
        setEmailExistsError(t("register.email.error.exists"));
        return;
      }
      setStep(1);
    } catch {
      setEmailExistsError(t("register.email.error.check"));
    } finally {
      setCheckingEmail(false);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    if (step !== 3) return;
    setSubmitError(null);
    const payload = {
      company: {
        name: data.companyName,
        taxCode: data.taxCode,
        address: data.address,
        timezone: data.timezone,
      },
      admin: {
        username: data.adminUsername,
        password: data.adminPassword,
        fullName: data.adminFullName,
        phone: data.adminPhone || undefined,
      },
    };
    try {
      const result = await apiRegisterCompany(payload);
      if (!result?.accessToken || !result?.adminUserId) {
        setSubmitError(t("register.error.failed"));
        toast(t("register.error.failed"));
        return;
      }
      const newUser = {
        id: result.adminUserId,
        name: data.adminFullName,
        email: data.adminUsername,
        roles: ["HR"] as import("@/shared/types").Role[],
        companyId: result.companyId,
        department: "",
        status: "Active" as const,
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      setToken(result.accessToken);
      const tenant: Tenant = {
        id: result.companyId ?? "company-new",
        name: data.companyName,
        industry: "",
        size: "",
        plan: "Pro",
      };
      setTenant(tenant);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("auth_token", result.accessToken);
        window.localStorage.setItem("auth_user", JSON.stringify(newUser));
      }
      toast(t("global.save_success"));
      navigate("/dashboard", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("register.error.failed");
      setSubmitError(msg);
      toast(t("register.error.failed"));
    }
  };

  const handleBack = () => {
    setEmailExistsError(null);
    setSubmitError(null);
    if (step === 0) navigate("/login");
    else setStep((s) => s - 1);
  };

  const handleNext = async () => {
    if (step === 0) {
      await handleContinueFromEmail();
    } else if (step === 1) {
      const ok = await trigger([
        "companyName",
        "taxCode",
        "address",
        "timezone",
      ]);
      if (ok) setStep(2);
    } else if (step === 2) {
      const ok = await trigger(["adminFullName", "adminPassword"]);
      if (ok) setStep(3);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left brand panel ── */}
      <aside className="hidden lg:flex flex-col w-[360px] xl:w-[420px] shrink-0 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
        {/* Background decoration */}
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
          {/* Logo */}
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

          {/* Heading */}
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

          {/* Step tracker */}
          <nav className="flex flex-col gap-1">
            {STEPS.map((s, i) => {
              const isDone = i < step;
              const isActive = i === step;
              return (
                <div
                  key={s.label}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive ? "bg-white/10 border border-white/15" : ""}
                    ${isDone ? "opacity-60" : isActive ? "opacity-100" : "opacity-40"}`}>
                  {/* Indicator */}
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

          {/* Trust badges at bottom */}
          <div className="mt-auto pt-10 space-y-2.5">
            {[
              t("register.trust.no_card"),
              t("register.trust.trial"),
              t("register.trust.cancel"),
            ].map((badge) => (
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

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col bg-gray-50/50 min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand to-brandDark flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="w-3 h-3">
                <rect
                  x="3"
                  y="2"
                  width="14"
                  height="16"
                  rx="2.5"
                  stroke="white"
                  strokeWidth="1.8"
                />
                <path
                  d="M7 7h6M7 10.5h6M7 14h4"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-[14px] font-bold text-gray-900">
              Onboard<span className="text-brand">IQ</span>
            </span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-4">
            <LangSwitcher />
            <div className="flex items-center gap-2 text-[13px] text-gray-500">
              <span>{t("register.topbar.have_account")}</span>
              <Link
                to="/login"
                className="font-semibold text-brand hover:text-brandDark transition-colors">
                {t("register.topbar.sign_in")}
              </Link>
            </div>
          </div>
        </div>

        {/* Progress bar (mobile only) */}
        <div className="lg:hidden h-1 bg-gray-100">
          <div
            className="h-full bg-brand transition-all duration-500 rounded-r-full"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[440px]">
            {/* Step heading */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/8 rounded-full mb-3">
                <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
                  {t("register.step_badge", {
                    current: String(step + 1),
                    total: "4",
                  })}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {
                  [
                    t("register.step0.title"),
                    t("register.step1.title"),
                    t("register.step2.title"),
                    t("register.step3.title"),
                  ][step]
                }
              </h1>
              <p className="text-[14px] text-gray-500">
                {
                  [
                    t("register.step0.subtitle"),
                    t("register.step1.subtitle"),
                    t("register.step2.subtitle"),
                    t("register.step3.subtitle"),
                  ][step]
                }
              </p>
            </div>

            {/* Error banner */}
            {(submitError || emailExistsError) && (
              <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <svg
                  className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
                  viewBox="0 0 16 16"
                  fill="none">
                  <circle
                    cx="8"
                    cy="8"
                    r="6.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <path
                    d="M8 5v4M8 11.5v.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-[13px] text-red-600">
                  {emailExistsError ?? submitError}
                </p>
              </div>
            )}

            {/* ── Step 0: Email ── */}
            {step === 0 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleContinueFromEmail();
                }}
                className="space-y-5">
                <Field
                  label={t("register.email.label")}
                  error={errors.adminUsername?.message}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M2 6.5l8 5 8-5M2 6.5A1.5 1.5 0 013.5 5h13A1.5 1.5 0 0118 6.5v7a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 13.5v-7z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <input
                      type="email"
                      autoFocus
                      autoComplete="email"
                      placeholder={t("register.email.placeholder")}
                      className={`${INPUT_CLS} pl-10`}
                      {...register("adminUsername")}
                    />
                  </div>
                </Field>
                <p className="text-[12px] text-gray-400">
                  {t("register.email.hint")}
                </p>
                <button
                  type="submit"
                  disabled={checkingEmail}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand text-white text-[14px] font-semibold hover:bg-brandDark transition-all shadow-md shadow-brand/20 disabled:opacity-50">
                  {checkingEmail ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeOpacity=".25"
                        />
                        <path
                          d="M12 2a10 10 0 0110 10"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      {t("app.loading")}
                    </>
                  ) : (
                    <>
                      {t("register.btn.continue")}
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 8h10M9 4l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ── Step 1: Company ── */}
            {step === 1 && (
              <div className="space-y-5">
                <Field
                  label={t("register.company.name.label")}
                  error={errors.companyName?.message}>
                  <input
                    className={INPUT_CLS}
                    placeholder={t("register.company.name.placeholder")}
                    {...register("companyName")}
                  />
                </Field>
                <Field
                  label={t("register.company.taxcode.label")}
                  error={errors.taxCode?.message}>
                  <input
                    className={INPUT_CLS}
                    placeholder={t("register.company.taxcode.placeholder")}
                    {...register("taxCode")}
                  />
                </Field>
                <Field
                  label={t("register.company.address.label")}
                  error={errors.address?.message}>
                  <input
                    className={INPUT_CLS}
                    placeholder={t("register.company.address.placeholder")}
                    {...register("address")}
                  />
                </Field>
                <Field
                  label={t("register.company.timezone.label")}
                  error={errors.timezone?.message}>
                  <div className="relative">
                    <select className={SELECT_CLS} {...register("timezone")}>
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-gray-400">
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M4 6l4 4 4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </Field>
              </div>
            )}

            {/* ── Step 2: Admin ── */}
            {step === 2 && (
              <div className="space-y-5">
                <Field
                  label={t("register.admin.fullname.label")}
                  error={errors.adminFullName?.message}>
                  <input
                    className={INPUT_CLS}
                    placeholder={t("register.admin.fullname.placeholder")}
                    {...register("adminFullName")}
                  />
                </Field>
                <Field
                  label={t("register.admin.password.label")}
                  error={errors.adminPassword?.message}>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`${INPUT_CLS} pr-11`}
                      placeholder={t("register.admin.password.placeholder")}
                      {...register("adminPassword")}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? (
                        <svg
                          className="w-4.5 h-4.5"
                          viewBox="0 0 20 20"
                          fill="none">
                          <path
                            d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <circle
                            cx="10"
                            cy="10"
                            r="2.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M3 3l14 14"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4.5 h-4.5"
                          viewBox="0 0 20 20"
                          fill="none">
                          <path
                            d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                          <circle
                            cx="10"
                            cy="10"
                            r="2.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </Field>
                <Field
                  label={t("register.admin.phone.label")}
                  hint={t("register.admin.phone.hint")}>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-gray-400">
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M3.5 4.5c0-.828.672-1.5 1.5-1.5h2.09c.404 0 .765.245.919.617l.972 2.431a1 1 0 01-.23 1.08L7.336 8.042a11.043 11.043 0 004.622 4.622l.914-1.415a1 1 0 011.08-.23l2.431.972c.372.154.617.515.617.919V15a1.5 1.5 0 01-1.5 1.5C7.268 16.5 3.5 12.732 3.5 9"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      className={`${INPUT_CLS} pl-10`}
                      placeholder={t("register.admin.phone.placeholder")}
                      {...register("adminPhone")}
                    />
                  </div>
                </Field>
              </div>
            )}

            {/* ── Step 3: Confirm ── */}
            {step === 3 && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Company card */}
                <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        className="w-3.5 h-3.5 text-brand">
                        <path
                          d="M3 17V7l7-4 7 4v10M3 17h14M8 17v-4h4v4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                      {t("register.confirm.company_section")}
                    </span>
                  </div>
                  <dl className="px-5 py-4 space-y-3">
                    {[
                      {
                        label: t("register.confirm.field.name"),
                        value: getValues("companyName"),
                      },
                      {
                        label: t("register.confirm.field.taxcode"),
                        value: getValues("taxCode"),
                      },
                      {
                        label: t("register.confirm.field.address"),
                        value: getValues("address"),
                      },
                      {
                        label: t("register.confirm.field.timezone"),
                        value: getValues("timezone"),
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-start justify-between gap-4">
                        <dt className="text-[13px] text-gray-400 shrink-0">
                          {label}
                        </dt>
                        <dd className="text-[13px] font-semibold text-gray-800 text-right">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Admin card */}
                <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                  <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                    <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        className="w-3.5 h-3.5 text-violet-600">
                        <circle
                          cx="10"
                          cy="7"
                          r="3.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                      {t("register.confirm.admin_section")}
                    </span>
                  </div>
                  <dl className="px-5 py-4 space-y-3">
                    {[
                      {
                        label: t("register.confirm.field.name"),
                        value: getValues("adminFullName"),
                      },
                      {
                        label: t("register.confirm.field.email"),
                        value: getValues("adminUsername"),
                      },
                      ...(getValues("adminPhone")
                        ? [
                            {
                              label: t("register.confirm.field.phone"),
                              value: getValues("adminPhone")!,
                            },
                          ]
                        : []),
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-start justify-between gap-4">
                        <dt className="text-[13px] text-gray-400 shrink-0">
                          {label}
                        </dt>
                        <dd className="text-[13px] font-semibold text-gray-800 text-right">
                          {value}
                        </dd>
                      </div>
                    ))}
                    <div className="flex items-start justify-between gap-4">
                      <dt className="text-[13px] text-gray-400 shrink-0">
                        {t("register.confirm.field.password")}
                      </dt>
                      <dd className="text-[13px] font-semibold text-gray-800">
                        ••••••••
                      </dd>
                    </div>
                  </dl>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand text-white text-[14px] font-semibold hover:bg-brandDark transition-all shadow-md shadow-brand/20 disabled:opacity-60 mt-2">
                  {isSubmitting ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeOpacity=".25"
                        />
                        <path
                          d="M12 2a10 10 0 0110 10"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      {t("register.btn.creating")}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M8 2v12M2 8h12"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                      </svg>
                      {t("register.btn.create")}
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ── Navigation buttons (steps 1–2) ── */}
            {step > 0 && step < 3 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M13 8H3M7 4l-4 4 4 4"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {t("register.btn.back")}
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-white text-[13px] font-semibold hover:bg-brandDark transition-all shadow-sm shadow-brand/20">
                  {t("register.btn.continue")}
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Back on confirm step */}
            {step === 3 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 mt-4 w-full justify-center py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M13 8H3M7 4l-4 4 4 4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {t("register.btn.edit_details")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterCompany;
