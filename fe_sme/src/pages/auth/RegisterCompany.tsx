import { useRegisterCompany } from "@/hooks/useRegisterCompany";
import { RegisterSidebar } from "./components/RegisterSidebar";
import { RegisterTopBar } from "./components/RegisterTopBar";
import { RegisterStepHeader } from "./components/RegisterStepHeader";
import {
  RegisterStepEmail,
  RegisterStepCompany,
  RegisterStepAdmin,
} from "./components/RegisterSteps";
import { RegisterStepPlan } from "./components/RegisterStepPlan";
import { RegisterStepPayment } from "./components/RegisterStepPayment";
import { RegisterNavButtons } from "./components/RegisterNavButtons";

const TOTAL_STEPS = 5;

function RegisterCompany() {
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
            <RegisterStepHeader
              step={vm.step}
              totalSteps={TOTAL_STEPS}
              errorMessage={vm.emailExistsError ?? vm.submitError}
            />

            {vm.step === 0 && (
              <RegisterStepEmail
                register={vm.register}
                errors={vm.errors}
                checkingEmail={vm.checkingEmail}
                onContinue={vm.handleNext}
              />
            )}

            {vm.step === 1 && (
              <RegisterStepCompany register={vm.register} errors={vm.errors} />
            )}

            {vm.step === 2 && (
              <RegisterStepAdmin
                register={vm.register}
                errors={vm.errors}
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
              <RegisterNavButtons
                step={vm.step}
                handleBack={vm.handleBack}
                handleNext={vm.handleNext}
                registering={vm.isPaying}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterCompany;
