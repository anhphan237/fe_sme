import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Mail, Phone, Eye, EyeOff } from "lucide-react";
import { useLocale } from "@/i18n";
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

/** Shared wrapper – gives every step form consistent vertical rhythm */
const StepSection = ({ children }: { children: ReactNode }) => (
  <section className="flex flex-col gap-4">{children}</section>
);

export const RegisterStepEmail = () => {
  const { t } = useLocale();

  return (
    <StepSection>
      <BaseInput
        name="adminUsername"
        label={t("register.email.label")}
        type="email"
        autoFocus
        autoComplete="email"
        placeholder={t("register.email.placeholder")}
        spellCheck={false}
        prefix={<Mail className="w-4 h-4 text-gray-400" aria-hidden="true" />}
        formItemProps={{
          rules: [
            { required: true, message: t("register.zod.email_required") },
            { type: "email", message: t("register.zod.email_required") },
          ],
        }}
      />
      <p className="text-xs text-gray-400 -mt-2 leading-relaxed">
        {t("register.email.hint")}
      </p>
    </StepSection>
  );
};

export const RegisterStepCompany = () => {
  const { t } = useLocale();

  return (
    <StepSection>
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
    </StepSection>
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
    <StepSection>
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
            className="flex items-center text-gray-400 hover:text-gray-600 transition-colors focus-visible:ring-2 focus-visible:ring-brand rounded"
            aria-label={
              showPassword
                ? t("register.admin.password.hide")
                : t("register.admin.password.show")
            }>
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
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
        prefix={<Phone className="w-4 h-4 text-gray-400" aria-hidden="true" />}
      />
    </StepSection>
  );
};
