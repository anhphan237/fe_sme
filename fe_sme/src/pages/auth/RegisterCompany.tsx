import { Form, Progress } from "antd";
import { ArrowLeft } from "lucide-react";
import { useRegisterCompany } from "@/hooks/useRegisterCompany";
import { RegisterSidebar } from "./components/RegisterSidebar";
import { RegisterTopBar } from "./components/RegisterTopBar";
import { RegisterStepHeader } from "./components/RegisterStepHeader";
import { RegisterStepNavigation } from "./components/RegisterStepNavigation";
import {
  RegisterStepEmail,
  RegisterStepCompany,
  RegisterStepAdmin,
} from "./components/RegisterSteps";
import { RegisterStepPlan } from "./components/RegisterStepPlan";
import { RegisterStepPayment } from "./components/RegisterStepPayment";

const TOTAL_STEPS = 5;

const DEFAULT_TZ =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";

const RegisterCompany = () => {
  const vm = useRegisterCompany();

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
              <RegisterStepHeader
                step={vm.step}
                totalSteps={TOTAL_STEPS}
                error={vm.emailExistsError ?? vm.submitError}
              />

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

              {vm.step === 4 && vm.clientSecret && vm.checkoutInvoiceId && (
                <RegisterStepPayment
                  clientSecret={vm.clientSecret}
                  invoiceId={vm.checkoutInvoiceId}
                  amount={vm.checkoutAmount}
                  planName={
                    vm.planList?.find((p) => p.code === vm.selectedPlanCode)
                      ?.name
                  }
                  onError={(msg) => vm.setSubmitError(msg)}
                />
              )}

              {/* Unified navigation for steps 0-3 */}
              {vm.step < 4 && (
                <RegisterStepNavigation
                  hideBack={vm.step === 0}
                  onBack={vm.handleBack}
                  onNext={vm.handleNext}
                  loading={vm.checkingEmail || vm.isPaying}
                />
              )}

              {/* Step 4: allow going back to change plan */}
              {vm.step === 4 && (
                <button
                  type="button"
                  onClick={vm.handleBack}
                  className="mt-6 flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-brand transition-colors mx-auto">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Đổi gói
                </button>
              )}
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCompany;
