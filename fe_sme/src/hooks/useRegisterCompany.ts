import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Form } from "antd";
import type { FormInstance } from "antd";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { notify } from "@/utils/notify";
import { useUserStore } from "@/stores/user.store";
import { useLocale } from "@/i18n";
import type { BillingPlan, Tenant } from "@/shared/types";
import type { Role } from "@/shared/types";
import { apiCheckEmailExists } from "@/api/identity/identity.api";
import { apiRegisterCompany } from "@/api/company/company.api";
import {
  apiGetPlans,
  apiGetSubscription,
  apiGenerateInvoice,
  apiCreatePaymentIntent,
} from "@/api/billing/billing.api";
import { extractList } from "@/api/core/types";
import { mapPlan, mapSubscription, formatVnd } from "@/utils/mappers/billing";
import { pickLatestPayableInvoiceIdFromList } from "@/utils/resolveRegisterInvoice";

export interface RegisterFormValues {
  adminUsername: string;
  companyName: string;
  taxCode: string;
  address: string;
  timezone: string;
  industry?: string;
  companySize?: string;
  adminFullName: string;
  adminPassword: string;
  adminPhone?: string;
}

const HIDDEN_PLANS = ["Basic Plan", "Premium Plan"];

type RegisterAdminUser = {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  companyId: string;
  department: string;
  departmentId: null;
  status: "Active";
  createdAt: string;
};

const getCurrentPeriod = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return {
    periodStart: new Date(y, m, 1).toISOString().slice(0, 10),
    periodEnd: new Date(y, m + 1, 1).toISOString().slice(0, 10),
  };
};

export interface PaymentState {
  clientSecret: string;
  invoiceId: string;
  amount: string;
  planName: string;
  billingCycle: "MONTHLY" | "YEARLY";
}

export interface UseRegisterCompanyResult {
  step: number;
  handleNext: () => Promise<void>;
  handleBack: () => void;

  form: FormInstance<RegisterFormValues>;

  emailExistsError: string | null;
  checkingEmail: boolean;

  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;

  planList: BillingPlan[] | undefined;
  plansLoading: boolean;
  selectedPlanCode: string | null;
  setSelectedPlanCode: Dispatch<SetStateAction<string | null>>;
  billingCycle: "MONTHLY" | "YEARLY";
  setBillingCycle: Dispatch<SetStateAction<"MONTHLY" | "YEARLY">>;

  isPaying: boolean;
  /** Context-aware loading message shown while isPaying is true */
  payingLabel: string | null;

  submitError: string | null;
  setSubmitError: Dispatch<SetStateAction<string | null>>;

  /** Set when payment intent is ready — used to render the embedded payment step */
  paymentState: PaymentState | null;
}

export const useRegisterCompany = (): UseRegisterCompanyResult => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { setTenant, setUser, setToken } = useUserStore();

  const [form] = Form.useForm<RegisterFormValues>();

  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailExistsError, setEmailExistsError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">(
    "MONTHLY",
  );
  const [isPaying, setIsPaying] = useState(false);
  const [payingLabel, setPayingLabel] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);

  /** Stores the result of the first successful apiRegisterCompany call so that
   *  going back to change plan does NOT trigger a second registration attempt
   *  with the same email. */
  const [registrationResult, setRegistrationResult] = useState<{
    companyId: string;
    accessToken: string;
    adminUserId: string;
    newUser: RegisterAdminUser;
    tenantData: Tenant;
  } | null>(null);

  const { data: planList, isLoading: plansLoading } = useQuery({
    queryKey: ["register_plans"],
    queryFn: () => apiGetPlans(),
    enabled: step === 3,
    staleTime: 5 * 60 * 1000,
    select: (res: any) =>
      extractList(res, "plans", "items")
        .map(mapPlan)
        .filter(
          (p: BillingPlan) =>
            !HIDDEN_PLANS.includes(p.name) &&
            p.status.toUpperCase() === "ACTIVE",
        ),
  });

  const handleContinueFromEmail = async () => {
    setEmailExistsError(null);
    try {
      await form.validateFields(["adminUsername"]);
    } catch {
      return;
    }
    const email = form.getFieldValue("adminUsername") as string;
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

  const handlePayment = async () => {
    if (!selectedPlanCode) {
      setSubmitError(t("register.plan.none_selected"));
      return;
    }
    setIsPaying(true);
    setPayingLabel(null);
    setSubmitError(null);
    try {
      let companyId: string;
      let companyName: string;
      let accessToken: string;
      let adminUserId: string;
      let newUser: RegisterAdminUser;

      if (registrationResult) {
        companyId = registrationResult.companyId;
        companyName =
          registrationResult.tenantData.name ||
          (form.getFieldValue("companyName") as string);
        accessToken = registrationResult.accessToken;
        adminUserId = registrationResult.adminUserId;
        newUser = registrationResult.newUser as RegisterAdminUser;
        setUser(newUser);
        setToken(accessToken);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("auth_user", JSON.stringify(newUser));
        }
      } else {
        setPayingLabel(t("register.paying.creating_account"));
        const data = form.getFieldsValue(true);
        companyName = data.companyName;
        const result = await apiRegisterCompany({
          company: {
            name: data.companyName,
            taxCode: data.taxCode,
            address: data.address,
            timezone: data.timezone,
            industry: data.industry || undefined,
            companySize: data.companySize || undefined,
          },
          admin: {
            username: data.adminUsername,
            password: data.adminPassword,
            fullName: data.adminFullName,
            phone: data.adminPhone || undefined,
          },
          planCode: selectedPlanCode,
          billingCycle,
        });

        if (!result?.accessToken || !result?.adminUserId) {
          setSubmitError(t("register.error.failed"));
          return;
        }

        accessToken = result.accessToken;
        adminUserId = result.adminUserId;
        companyId = result.companyId;

        newUser = {
          id: result.adminUserId,
          name: data.adminFullName,
          email: data.adminUsername,
          roles: ["HR"] as Role[],
          companyId: result.companyId,
          department: "",
          departmentId: null,
          status: "Active" as const,
          createdAt: new Date().toISOString(),
        };

        setUser(newUser);
        setToken(accessToken);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("auth_user", JSON.stringify(newUser));
        }
      }

      /**
       * Effective entitlement stays FREE on BE until payment clears — never mirror
       * selectedPlanCode into tenant.plan before Stripe succeeds.
       */
      const tenantFromSubscription = (subPlan: string | undefined): Tenant => ({
        id: companyId,
        name: companyName,
        industry: "",
        size: "",
        plan: subPlan || "FREE",
      });

      if (selectedPlanCode.toUpperCase() === "FREE") {
        setPayingLabel(t("register.paying.activating_plan"));
        const sub = await apiGetSubscription(companyId);
        const subData = mapSubscription(sub);
        const tenantData = tenantFromSubscription(subData.planCode);
        setTenant(tenantData);
        setRegistrationResult({
          companyId,
          accessToken,
          adminUserId,
          newUser,
          tenantData,
        });
        notify.success(t("global.save_success"));
        navigate("/dashboard", { replace: true });
        return;
      }

      setPayingLabel(t("register.paying.activating_plan"));
      const sub = await apiGetSubscription(companyId);
      const subData = mapSubscription(sub);
      const tenantData = tenantFromSubscription(subData.planCode);
      setTenant(tenantData);

      setRegistrationResult({
        companyId,
        accessToken,
        adminUserId,
        newUser,
        tenantData,
      });

      setPayingLabel(t("register.paying.preparing_payment"));
      let invoiceId = await pickLatestPayableInvoiceIdFromList(
        subData.subscriptionId,
      );

      if (!invoiceId && subData.subscriptionId) {
        const { periodStart, periodEnd } = getCurrentPeriod();
        try {
          const gen = await apiGenerateInvoice(
            subData.subscriptionId,
            periodStart,
            periodEnd,
          );
          invoiceId = (gen as { invoiceId?: string })?.invoiceId;
        } catch {
          /* BE may not expose invoice yet — error surfaced below */
        }
      }

      if (!invoiceId) {
        const msg = t("register.payment.invoice_unavailable");
        setSubmitError(msg);
        notify.error(msg);
        return;
      }

      const intentResult = await apiCreatePaymentIntent(invoiceId);
      const clientSecret = intentResult.clientSecret ?? "";
      if (!clientSecret) {
        const msg = t("register.payment.intent_unavailable");
        setSubmitError(msg);
        notify.error(msg);
        return;
      }

      const selectedPlan = planList?.find((p) => p.code === selectedPlanCode);
      const amountFromIntent =
        typeof intentResult.amount === "number"
          ? formatVnd(intentResult.amount)
          : null;
      const amountFallback =
        billingCycle === "YEARLY"
          ? (selectedPlan?.priceYearly ?? "0 ₫")
          : (selectedPlan?.price ?? "0 ₫");
      const amount = amountFromIntent ?? amountFallback;

      setPaymentState({
        clientSecret,
        invoiceId,
        amount,
        planName: selectedPlan?.name ?? t("register.payment.plan_default"),
        billingCycle,
      });
      setStep(4);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("register.error.failed");
      setSubmitError(msg);
      notify.error(t("register.error.failed"));
    } finally {
      setIsPaying(false);
      setPayingLabel(null);
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      await handleContinueFromEmail();
    } else if (step === 1) {
      try {
        await form.validateFields([
          "companyName",
          "taxCode",
          "address",
          "timezone",
        ]);
        setStep(2);
      } catch {
        /* validation failed — Ant Form shows inline errors */
      }
    } else if (step === 2) {
      try {
        await form.validateFields(["adminFullName", "adminPassword"]);
        setStep(3);
      } catch {
        /* validation failed */
      }
    } else if (step === 3) {
      await handlePayment();
    }
    // step 4 is payment — handled by Stripe form directly
  };

  const handleBack = () => {
    setEmailExistsError(null);
    setSubmitError(null);
    if (step === 0) navigate("/login");
    else if (step === 4) {
      // Going back from payment step — reset payment state so user can re-select plan
      setPaymentState(null);
      setStep(3);
    } else {
      setStep((s) => s - 1);
    }
  };

  return {
    step,
    handleNext,
    handleBack,
    form,
    emailExistsError,
    checkingEmail,
    showPassword,
    setShowPassword,
    planList,
    plansLoading,
    selectedPlanCode,
    setSelectedPlanCode,
    billingCycle,
    setBillingCycle,
    submitError,
    setSubmitError,
    isPaying,
    payingLabel,
    paymentState,
  };
};
