import type { Dispatch, SetStateAction } from "react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { RegisterFormSchema } from "@/hooks/useRegisterCompany";
import { useLocale } from "@/i18n";
import { RegisterField, INPUT_CLS, SELECT_CLS } from "./RegisterField";

const TIMEZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "UTC",
  "Europe/London",
  "America/New_York",
];

// ── Step 0: Email ──────────────────────────────────────────────────────────────

interface RegisterStepEmailProps {
  register: UseFormRegister<RegisterFormSchema>;
  errors: FieldErrors<RegisterFormSchema>;
  checkingEmail: boolean;
  onContinue: () => Promise<void>;
}

export function RegisterStepEmail({
  register,
  errors,
  checkingEmail,
  onContinue,
}: RegisterStepEmailProps) {
  const { t } = useLocale();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onContinue();
      }}
      className="space-y-5">
      <RegisterField
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
      </RegisterField>

      <p className="text-[12px] text-gray-400">{t("register.email.hint")}</p>

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
  );
}

// ── Step 1: Company Info ───────────────────────────────────────────────────────

interface RegisterStepCompanyProps {
  register: UseFormRegister<RegisterFormSchema>;
  errors: FieldErrors<RegisterFormSchema>;
}

export function RegisterStepCompany({
  register,
  errors,
}: RegisterStepCompanyProps) {
  const { t } = useLocale();

  return (
    <div className="space-y-5">
      <RegisterField
        label={t("register.company.name.label")}
        error={errors.companyName?.message}>
        <input
          className={INPUT_CLS}
          placeholder={t("register.company.name.placeholder")}
          {...register("companyName")}
        />
      </RegisterField>

      <RegisterField
        label={t("register.company.taxcode.label")}
        error={errors.taxCode?.message}>
        <input
          className={INPUT_CLS}
          placeholder={t("register.company.taxcode.placeholder")}
          {...register("taxCode")}
        />
      </RegisterField>

      <RegisterField
        label={t("register.company.address.label")}
        error={errors.address?.message}>
        <input
          className={INPUT_CLS}
          placeholder={t("register.company.address.placeholder")}
          {...register("address")}
        />
      </RegisterField>

      <RegisterField
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
      </RegisterField>
    </div>
  );
}

// ── Step 2: Admin Account ──────────────────────────────────────────────────────

interface RegisterStepAdminProps {
  register: UseFormRegister<RegisterFormSchema>;
  errors: FieldErrors<RegisterFormSchema>;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
}

export function RegisterStepAdmin({
  register,
  errors,
  showPassword,
  setShowPassword,
}: RegisterStepAdminProps) {
  const { t } = useLocale();

  return (
    <div className="space-y-5">
      <RegisterField
        label={t("register.admin.fullname.label")}
        error={errors.adminFullName?.message}>
        <input
          className={INPUT_CLS}
          placeholder={t("register.admin.fullname.placeholder")}
          {...register("adminFullName")}
        />
      </RegisterField>

      <RegisterField
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
            className="absolute inset-y-0 right-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={
              showPassword
                ? t("register.admin.password.hide")
                : t("register.admin.password.show")
            }>
            {showPassword ? (
              <svg className="w-4.5 h-4.5" viewBox="0 0 20 20" fill="none">
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
              <svg className="w-4.5 h-4.5" viewBox="0 0 20 20" fill="none">
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
      </RegisterField>

      <RegisterField
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
      </RegisterField>
    </div>
  );
}
