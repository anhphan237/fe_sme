import { Form, Progress, Alert } from "antd";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRegisterCompany } from "@/hooks/useRegisterCompany";
import { RegisterSidebar } from "./components/RegisterSidebar";
import { RegisterTopBar } from "./components/RegisterTopBar";
import {
  RegisterStepEmail,
  RegisterStepCompany,
  RegisterStepAdmin,
} from "./components/RegisterSteps";
import { RegisterStepPlan } from "./components/RegisterStepPlan";
import { RegisterStepPayment } from "./components/RegisterStepPayment";
import { useLocale } from "@/i18n";
import BaseButton from "@/components/button";

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

const DEFAULT_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";

const RegisterCompany = () => {
  const vm = useRegisterCompany();
  const { t } = useLocale();

  const isPaymentStep = vm.step === 4;

  return (
    <div className="flex min-h-screen">
      <RegisterSidebar step={vm.step} />

      <div className="flex-1 flex flex-col bg-gray-50/50 min-h-screen">
        <RegisterTopBar />

        <Progress
          className="lg:hidden !mb-0"
          percent={((vm.step + 1) / TOTAL_STEPS) * 100}
          showInfo={false}
          strokeColor="var(--color-brand)"
          size={[undefined as unknown as number, 4]}
          trailColor="#f3f4f6"
        />

        <div className="flex-1 min-h-0 overflow-y-auto flex items-start justify-center px-6 py-12">
          <div
            className={`w-full ${vm.step === 3 ? "max-w-5xl" : "max-w-[440px]"}`}>
            <Form
              form={vm.form}
              layout="vertical"
              initialValues={{ timezone: DEFAULT_TZ }}
              requiredMark={false}>
              {/* ── Step header ── */}
              <header className="mb-8">
                <div className="flex items-center gap-2 mb-5">
                  {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                    <span
                      key={i}
                      className={`h-2 rounded-full transition-all duration-300 shrink-0 ${
                        i === vm.step
                          ? "w-6 bg-brand"
                          : i < vm.step
                            ? "w-3 bg-brand/50"
                            : "w-3 bg-gray-200"
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                  <span className="ml-auto text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
                    {t("register.step_badge", {
                      current: String(vm.step + 1),
                      total: String(TOTAL_STEPS),
                    })}
                  </span>
                </div>
                <h1 className="text-[22px] font-bold text-gray-900 leading-snug mb-1.5">
                  {t(TITLE_KEYS[vm.step] ?? TITLE_KEYS[0])}
                </h1>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t(SUBTITLE_KEYS[vm.step] ?? SUBTITLE_KEYS[0])}
                </p>
                {(vm.emailExistsError ?? vm.submitError) && (
                  <Alert
                    type="error"
                    showIcon
                    message={vm.emailExistsError ?? vm.submitError}
                    className="mt-4 rounded-xl"
                  />
                )}
              </header>

              {vm.step === 0 && <RegisterStepEmail />}

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
                  billingCycle={vm.billingCycle}
                  setBillingCycle={vm.setBillingCycle}
                  onClearError={() => vm.setSubmitError(null)}
                />
              )}

              {vm.step === 4 && vm.paymentState && (
                <RegisterStepPayment
                  clientSecret={vm.paymentState.clientSecret}
                  invoiceId={vm.paymentState.invoiceId}
                  amount={vm.paymentState.amount}
                  planName={vm.paymentState.planName}
                  billingCycle={vm.paymentState.billingCycle}
                  onError={(msg) => vm.setSubmitError(msg)}
                />
              )}

              {/* ── Navigation — hidden on payment step (Stripe form has its own submit) ── */}
              {!isPaymentStep && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  {vm.step === 0 ? (
                    <span />
                  ) : (
                    <BaseButton
                      onClick={vm.handleBack}
                      disabled={vm.checkingEmail || vm.isPaying}
                      icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                      {t("register.btn.back")}
                    </BaseButton>
                  )}
                  <BaseButton
                    type="primary"
                    onClick={vm.handleNext}
                    loading={vm.checkingEmail || vm.isPaying}
                    disabled={vm.checkingEmail || vm.isPaying}
                    iconPosition="end"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    {vm.payingLabel ?? t("register.btn.continue")}
                  </BaseButton>
                </div>
              )}

              {/* ── Back button on payment step ── */}
              {isPaymentStep && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <BaseButton
                    onClick={vm.handleBack}
                    icon={<ArrowLeft className="w-3.5 h-3.5" />}>
                    {t("register.btn.back")}
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
