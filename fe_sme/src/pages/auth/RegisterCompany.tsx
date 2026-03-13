import { Form } from "antd";
import { useRegisterCompany } from "@/hooks/useRegisterCompany";
import { useLocale } from "@/i18n";
import BaseButton from "@/components/button";
import { RegisterSidebar } from "./components/RegisterSidebar";
import { RegisterTopBar } from "./components/RegisterTopBar";
import {
  RegisterStepEmail,
  RegisterStepCompany,
  RegisterStepAdmin,
} from "./components/RegisterSteps";
import { RegisterStepPlan } from "./components/RegisterStepPlan";
import { RegisterStepPayment } from "./components/RegisterStepPayment";

const TOTAL_STEPS = 5;

const TITLE_KEYS = [
  "register.step0.title",
  "register.step1.title",
  "register.step2.title",
  "register.step3.title",
  "register.step4.title",
];

const SUBTITLE_KEYS = [
  "register.step0.subtitle",
  "register.step1.subtitle",
  "register.step2.subtitle",
  "register.step3.subtitle",
  "register.step4.subtitle",
];

const RegisterCompany = () => {
  const { t } = useLocale();
  const vm = useRegisterCompany();

  return (
    <div className="flex min-h-screen">
      <RegisterSidebar step={vm.step} />

      <div className="flex-1 flex flex-col bg-gray-50/50 min-h-screen">
        <RegisterTopBar />

        <div className="lg:hidden h-1 bg-gray-100">
          <div
            className="h-full bg-brand transition-all duration-500 rounded-r-full"
            style={{ width: `${((vm.step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[440px]">
            <Form
              form={vm.form}
              layout="vertical"
              initialValues={{
                timezone:
                  Intl.DateTimeFormat().resolvedOptions().timeZone ||
                  "Asia/Ho_Chi_Minh",
              }}
              requiredMark={false}>
              {/* Step header */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/8 rounded-full mb-3">
                  <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
                    {t("register.step_badge", {
                      current: String(vm.step + 1),
                      total: String(TOTAL_STEPS),
                    })}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {t(TITLE_KEYS[vm.step] ?? TITLE_KEYS[0])}
                </h1>
                <p className="text-[14px] text-gray-500">
                  {t(SUBTITLE_KEYS[vm.step] ?? SUBTITLE_KEYS[0])}
                </p>
                {(vm.emailExistsError ?? vm.submitError) && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
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
                      {vm.emailExistsError ?? vm.submitError}
                    </p>
                  </div>
                )}
              </div>

              {vm.step === 0 && (
                <RegisterStepEmail
                  checkingEmail={vm.checkingEmail}
                  onContinue={vm.handleNext}
                />
              )}

              {vm.step === 1 && <RegisterStepCompany />}

              {vm.step === 2 && (
                <RegisterStepAdmin
                  showPassword={vm.showPassword}
                  setShowPassword={vm.setShowPassword}
                />
              )}

              {vm.step === 3 && (
                <RegisterStepPlan
                  planList={vm.planList}
                  plansLoading={vm.plansLoading}
                  selectedPlanCode={vm.selectedPlanCode}
                  setSelectedPlanCode={vm.setSelectedPlanCode}
                  onClearError={() => vm.setSubmitError(null)}
                />
              )}

              {vm.step === 4 && vm.clientSecret && vm.checkoutInvoiceId && (
                <RegisterStepPayment
                  clientSecret={vm.clientSecret}
                  invoiceId={vm.checkoutInvoiceId}
                  amount={vm.checkoutAmount}
                  onError={(msg) => vm.setSubmitError(msg)}
                />
              )}

              {vm.step > 0 && vm.step < 4 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  <BaseButton
                    onClick={vm.handleBack}
                    disabled={vm.isPaying}
                    icon={
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 16 16"
                        fill="none">
                        <path
                          d="M13 8H3M7 4l-4 4 4 4"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    }>
                    {t("register.btn.back")}
                  </BaseButton>
                  <BaseButton
                    type="primary"
                    onClick={vm.handleNext}
                    loading={vm.isPaying}
                    disabled={vm.isPaying}
                    iconPosition="end"
                    icon={
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 16 16"
                        fill="none">
                        <path
                          d="M3 8h10M9 4l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    }>
                    {vm.isPaying
                      ? t("register.btn.registering")
                      : t("register.btn.continue")}
                  </BaseButton>
                </div>
              )}
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCompany;
