import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useLocale } from "@/i18n";

// ── Schema (exported so Login page can type the callback) ─

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginForm = z.infer<typeof loginSchema>;

// ── Props ─────────────────────────────────────────────────

export interface LoginFormCardProps {
  /** Called with validated form data — parent owns the API call. */
  onSubmitData: (data: LoginForm) => Promise<void>;
  /** Server-side error message to display (null = no error). */
  submitError: string | null;
}

// ── Component ─────────────────────────────────────────────

export function LoginFormCard({
  onSubmitData,
  submitError,
}: LoginFormCardProps) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  return (
    <div className="flex flex-col h-full">
      {/* ── Greeting ─────────────────────────────────────── */}
      <div className="mb-8">
        {/* Mobile-only logo (sidebar is hidden on small screens) */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand to-brandDark opacity-90" />
            <div className="relative flex items-center justify-center w-full h-full">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
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
                  d="M7 7h6M7 10.5h4"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <span className="text-[16px] font-bold text-ink tracking-tight">
            Onboard<span className="text-brand">IQ</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold text-ink tracking-tight">
          {t("auth.login.title")}
        </h1>
        <p className="mt-1.5 text-sm text-muted">{t("auth.login.subtitle")}</p>
      </div>

      {/* ── Server-side error ─────────────────────────────── */}
      {submitError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{submitError}</span>
        </div>
      )}

      {/* ── Form ─────────────────────────────────────────── */}
      <form
        className="space-y-4"
        onSubmit={handleSubmit(onSubmitData)}
        noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-[13px] font-semibold text-ink">
            {t("auth.email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            className={`w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand/20 ${
              errors.email
                ? "border-red-300 focus:border-red-400"
                : "border-stroke focus:border-brand"
            }`}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-[12px] text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-[13px] font-semibold text-ink">
              {t("auth.password")}
            </label>
            <button
              type="button"
              className="text-[12px] font-medium text-brand hover:text-brandDark transition-colors"
              onClick={() => navigate("/forgot-password")}>
              {t("auth.forgot_password")}
            </button>
          </div>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`w-full rounded-2xl border bg-white px-4 py-2.5 pr-11 text-sm text-ink placeholder:text-muted/60 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                errors.password
                  ? "border-red-300 focus:border-red-400"
                  : "border-stroke focus:border-brand"
              }`}
              {...register("password")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
              onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              )}
            </button>
          </div>

          {errors.password && (
            <p className="text-[12px] text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-2xl bg-brand py-2.5 text-[14px] font-semibold text-white shadow-sm shadow-brand/20 transition-all duration-150 hover:bg-brandDark hover:shadow-md hover:shadow-brand/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50">
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {t("auth.login.submitting")}
            </span>
          ) : (
            t("auth.login.submit")
          )}
        </button>
      </form>

      {/* ── Divider ───────────────────────────────────────── */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-stroke" />
        <span className="text-[12px] text-muted">{t("auth.login.or")}</span>
        <div className="h-px flex-1 bg-stroke" />
      </div>

      {/* ── Register CTA ──────────────────────────────────── */}
      <button
        type="button"
        className="w-full rounded-2xl border border-stroke bg-white py-2.5 text-[14px] font-semibold text-ink transition-all duration-150 hover:border-ink/30 hover:bg-slate-50 active:scale-[0.99]"
        onClick={() => navigate("/register-company")}>
        {t("auth.login.register_cta")}
      </button>

      {/* ── Terms footer ──────────────────────────────────── */}
      <p className="mt-auto pt-8 text-center text-[12px] text-muted">
        {t("auth.login.terms_prefix")}{" "}
        <Link to="/terms" className="font-medium text-ink hover:underline">
          {t("auth.login.terms")}
        </Link>{" "}
        {t("auth.login.terms_and")}{" "}
        <Link to="/privacy" className="font-medium text-ink hover:underline">
          {t("auth.login.privacy")}
        </Link>
        .
      </p>
    </div>
  );
}
