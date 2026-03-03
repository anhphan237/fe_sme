/**
 * RegisterStepConfirm (Step 4)
 *
 * Summary review of company info, admin info, and chosen plan.
 * Submitting triggers subscription creation + invoice generation + navigation to checkout.
 */
import type { FormEvent } from "react";
import type { UseFormGetValues } from "react-hook-form";
import type { RegisterFormSchema } from "@/hooks/useRegisterCompany";
import type { BillingPlan } from "@/shared/types";
import { useLocale } from "@/i18n";

interface RegisterStepConfirmProps {
  getValues: UseFormGetValues<RegisterFormSchema>;
  selectedPlanCode: string | null;
  planList: BillingPlan[] | undefined;
  isPaying: boolean;
  onSubmit: (e: FormEvent) => Promise<void>;
  onBack: () => void;
}

export function RegisterStepConfirm({
  getValues,
  selectedPlanCode,
  planList,
  isPaying,
  onSubmit,
  onBack,
}: RegisterStepConfirmProps) {
  const { t } = useLocale();

  const selectedPlan = planList?.find((p) => p.code === selectedPlanCode);

  const companyFields = [
    { label: t("register.confirm.field.name"), value: getValues("companyName") },
    { label: t("register.confirm.field.taxcode"), value: getValues("taxCode") },
    { label: t("register.confirm.field.address"), value: getValues("address") },
    { label: t("register.confirm.field.timezone"), value: getValues("timezone") },
  ];

  const adminFields = [
    { label: t("register.confirm.field.name"), value: getValues("adminFullName") },
    { label: t("register.confirm.field.email"), value: getValues("adminUsername") },
    ...(getValues("adminPhone")
      ? [{ label: t("register.confirm.field.phone"), value: getValues("adminPhone")! }]
      : []),
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* ── Company card ──────────────────────────────────────────────── */}
      <SummaryCard
        iconBg="bg-blue-50"
        icon={
          <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 text-brand">
            <path
              d="M3 17V7l7-4 7 4v10M3 17h14M8 17v-4h4v4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        title={t("register.confirm.company_section")}>
        <FieldList fields={companyFields} />
      </SummaryCard>

      {/* ── Admin card ────────────────────────────────────────────────── */}
      <SummaryCard
        iconBg="bg-violet-50"
        icon={
          <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 text-violet-600">
            <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        }
        title={t("register.confirm.admin_section")}>
        <FieldList fields={adminFields} />
        {/* Password row — always masked */}
        <div className="flex items-start justify-between gap-4">
          <dt className="text-[13px] text-gray-400 shrink-0">
            {t("register.confirm.field.password")}
          </dt>
          <dd className="text-[13px] font-semibold text-gray-800">••••••••</dd>
        </div>
      </SummaryCard>

      {/* ── Selected plan card ────────────────────────────────────────── */}
      {selectedPlan && (
        <div className="rounded-2xl border border-brand/30 bg-brand/5 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-brand/15">
            <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 text-brand">
                <rect x="2.5" y="5.5" width="15" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2.5 8.5h15" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 12h2M11 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[12px] font-bold text-brand uppercase tracking-wider">
              {t("register.plan.selected")}
            </span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-[14px] font-bold text-gray-900">{selectedPlan.name}</span>
            <span className="text-[14px] font-bold text-brand">
              {selectedPlan.price}
              <span className="text-[11px] font-normal text-gray-400 ml-1">
                {t("register.plan.per_month")}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* ── Submit ────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isPaying}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand text-white text-[14px] font-semibold hover:bg-brandDark transition-all shadow-md shadow-brand/20 disabled:opacity-60 mt-2">
        {isPaying ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".25" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            {t("register.btn.creating")}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("register.btn.create")}
          </>
        )}
      </button>

      {/* ── Back to edit ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 w-full justify-center py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-500 hover:bg-gray-50 transition-all">
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
    </form>
  );
}

// ── Private sub-components ────────────────────────────────────────────────────

interface SummaryCardProps {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function SummaryCard({ iconBg, icon, title, children }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
          {title}
        </span>
      </div>
      <dl className="px-5 py-4 space-y-3">{children}</dl>
    </div>
  );
}

function FieldList({ fields }: { fields: { label: string; value: string }[] }) {
  return (
    <>
      {fields.map(({ label, value }) => (
        <div key={label} className="flex items-start justify-between gap-4">
          <dt className="text-[13px] text-gray-400 shrink-0">{label}</dt>
          <dd className="text-[13px] font-semibold text-gray-800 text-right">{value}</dd>
        </div>
      ))}
    </>
  );
}
