import type { Dispatch, SetStateAction } from "react";
import { useLocale } from "@/i18n";
import BaseButton from "@/components/button";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";

const TIMEZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "UTC",
  "Europe/London",
  "America/New_York",
];

const TIMEZONE_OPTIONS = TIMEZONES.map((tz) => ({ value: tz, label: tz }));

// ── Step 0: Email ──────────────────────────────────────────────────────────────

interface RegisterStepEmailProps {
  checkingEmail: boolean;
  onContinue: () => Promise<void>;
}

export const RegisterStepEmail = ({
  checkingEmail,
  onContinue,
}: RegisterStepEmailProps) => {
  const { t } = useLocale();

  return (
    <div className="space-y-5">
      <BaseInput
        name="adminUsername"
        label={t("register.email.label")}
        type="email"
        autoFocus
        autoComplete="email"
        placeholder={t("register.email.placeholder")}
        prefix={
          <svg
            className="w-4 h-4 text-gray-400"
            viewBox="0 0 20 20"
            fill="none">
            <path
              d="M2 6.5l8 5 8-5M2 6.5A1.5 1.5 0 013.5 5h13A1.5 1.5 0 0118 6.5v7a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 13.5v-7z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        onPressEnter={() => onContinue()}
        formItemProps={{
          rules: [
            { required: true, message: t("register.zod.email_required") },
            { type: "email", message: t("register.zod.email_required") },
          ],
        }}
      />

      <p className="text-[12px] text-gray-400">{t("register.email.hint")}</p>

      <BaseButton
        type="primary"
        htmlType="button"
        loading={checkingEmail}
        disabled={checkingEmail}
        className="w-full"
        onClick={() => onContinue()}>
        {checkingEmail ? t("app.loading") : t("register.btn.continue")}
      </BaseButton>
    </div>
  );
};

// ── Step 1: Company Info ───────────────────────────────────────────────────────

export const RegisterStepCompany = () => {
  const { t } = useLocale();

  return (
    <div className="space-y-5">
      <BaseInput
        name="companyName"
        label={t("register.company.name.label")}
        placeholder={t("register.company.name.placeholder")}
        formItemProps={{
          rules: [
            {
              required: true,
              min: 2,
              message: t("register.zod.company_name_required"),
            },
          ],
        }}
      />

      <BaseInput
        name="taxCode"
        label={t("register.company.taxcode.label")}
        placeholder={t("register.company.taxcode.placeholder")}
        formItemProps={{
          rules: [
            { required: true, message: t("register.zod.tax_code_required") },
          ],
        }}
      />

      <BaseInput
        name="address"
        label={t("register.company.address.label")}
        placeholder={t("register.company.address.placeholder")}
        formItemProps={{
          rules: [
            {
              required: true,
              min: 2,
              message: t("register.zod.address_required"),
            },
          ],
        }}
      />

      <BaseSelect
        name="timezone"
        label={t("register.company.timezone.label")}
        options={TIMEZONE_OPTIONS}
        formItemProps={{
          rules: [
            { required: true, message: t("register.zod.timezone_required") },
          ],
        }}
      />
    </div>
  );
};

// ── Step 2: Admin Account ──────────────────────────────────────────────────────

interface RegisterStepAdminProps {
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
}

export const RegisterStepAdmin = ({
  showPassword,
  setShowPassword,
}: RegisterStepAdminProps) => {
  const { t } = useLocale();

  return (
    <div className="space-y-5">
      <BaseInput
        name="adminFullName"
        label={t("register.admin.fullname.label")}
        placeholder={t("register.admin.fullname.placeholder")}
        formItemProps={{
          rules: [
            {
              required: true,
              min: 2,
              message: t("register.zod.fullname_required"),
            },
          ],
        }}
      />

      <BaseInput
        name="adminPassword"
        label={t("register.admin.password.label")}
        type={showPassword ? "text" : "password"}
        placeholder={t("register.admin.password.placeholder")}
        suffix={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((s) => !s)}
            className="flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={
              showPassword
                ? t("register.admin.password.hide")
                : t("register.admin.password.show")
            }>
            {showPassword ? (
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
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
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
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
        }
        formItemProps={{
          rules: [
            {
              required: true,
              min: 6,
              message: t("register.zod.password_min"),
            },
          ],
        }}
      />

      <BaseInput
        name="adminPhone"
        label={t("register.admin.phone.label")}
        type="tel"
        placeholder={t("register.admin.phone.placeholder")}
        prefix={
          <svg
            className="w-4 h-4 text-gray-400"
            viewBox="0 0 20 20"
            fill="none">
            <path
              d="M3.5 4.5c0-.828.672-1.5 1.5-1.5h2.09c.404 0 .765.245.919.617l.972 2.431a1 1 0 01-.23 1.08L7.336 8.042a11.043 11.043 0 004.622 4.622l.914-1.415a1 1 0 011.08-.23l2.431.972c.372.154.617.515.617.919V15a1.5 1.5 0 01-1.5 1.5C7.268 16.5 3.5 12.732 3.5 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        }
      />
    </div>
  );
};
