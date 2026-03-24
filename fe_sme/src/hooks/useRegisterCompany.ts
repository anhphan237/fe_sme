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
import { mapPlan, mapSubscription } from "@/utils/mappers/billing";

export interface RegisterFormValues {
  adminUsername: string;
  companyName: string;
  taxCode: string;
  address: string;
  timezone: string;
  adminFullName: string;
  adminPassword: string;
  adminPhone?: string;
}

const HIDDEN_PLANS = ["Basic Plan", "Premium Plan"];

const getCurrentPeriod = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return {
    periodStart: new Date(y, m, 1).toISOString().slice(0, 10),
    periodEnd: new Date(y, m + 1, 1).toISOString().slice(0, 10),
  };
};

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

  // Step 4 — inline payment
  clientSecret: string | null;
  checkoutInvoiceId: string | null;
  checkoutAmount: string;
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
  /** Stores the result of the first successful apiRegisterCompany call so that
   *  going back to change plan (Step 3 → Step 4) does NOT trigger a second
   *  registration attempt with the same email. */
  const [registrationResult, setRegistrationResult] = useState<{
    companyId: string;
    accessToken: string;
    adminUserId: string;
    newUser: ReturnType<typeof Object.assign>;
    tenantData: Tenant;
  } | null>(null);
  const [checkout, setCheckout] = useState<{
    secret: string | null;
    invoiceId: string | null;
    amount: string;
  }>({ secret: null, invoiceId: null, amount: "0 ₫" });

  const { data: planList, isLoading: plansLoading } = useQuery({
    queryKey: ["register_plans"],
    queryFn: () => apiGetPlans(),
    enabled: step === 3,
    staleTime: 5 * 60 * 1000,
    select: (res: any) =>
      extractList(res, "plans", "items")
        .map(mapPlan)
        .filter((p: BillingPlan) => !HIDDEN_PLANS.includes(p.name)),
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
      let currentTenantData: Tenant;

      if (registrationResult) {
        // User went back from Step 4 to change plan — reuse existing registration,
        // do NOT call apiRegisterCompany again (would fail: duplicate email).
        companyId = registrationResult.companyId;
        currentTenantData = {
          ...registrationResult.tenantData,
          plan: selectedPlanCode,
        };
        setTenant(currentTenantData);
      } else {
        setPayingLabel("Đang tạo tài khoản...");
        // getFieldsValue(true) returns ALL fields including unmounted steps
        const data = form.getFieldsValue(true);
        const result = await apiRegisterCompany({
          company: {
            name: data.companyName,
            taxCode: data.taxCode,
            address: data.address,
            timezone: data.timezone,
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

        const newUser = {
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

        currentTenantData = {
          id: result.companyId ?? "company-new",
          name: data.companyName,
          industry: "",
          size: "",
          plan: selectedPlanCode ?? "",
        };

        setUser(newUser);
        setToken(result.accessToken);
        setTenant(currentTenantData);

        if (typeof window !== "undefined") {
          window.localStorage.setItem("auth_user", JSON.stringify(newUser));
        }

        companyId = result.companyId;
        setRegistrationResult({
          companyId,
          accessToken: result.accessToken,
          adminUserId: result.adminUserId,
          newUser,
          tenantData: currentTenantData,
        });
      }

      if (selectedPlanCode.toUpperCase() === "FREE") {
        notify.success(t("global.save_success"));
        navigate("/dashboard", { replace: true });
        return;
      }

      setPayingLabel("Đang kích hoạt gói...");
      const sub = await apiGetSubscription(companyId);
      const subData = mapSubscription(sub as any);
      if (subData.planCode)
        setTenant({ ...currentTenantData, plan: subData.planCode });
      let invoiceId: string | undefined = subData?.invoiceId;
      if (!invoiceId && subData?.subscriptionId) {
        const { periodStart, periodEnd } = getCurrentPeriod();
        try {
          const gen = await apiGenerateInvoice(
            subData.subscriptionId,
            periodStart,
            periodEnd,
          );
          invoiceId = (gen as any)?.invoiceId;
        } catch {
          /* no invoice for this plan */
        }
      }

      if (invoiceId) {
        // Derive display amount from the already-loaded plan list to avoid
        // an extra apiGetInvoiceById round-trip before showing the Stripe form.
        const selectedPlan = planList?.find((p) => p.code === selectedPlanCode);
        const amount =
          billingCycle === "YEARLY"
            ? (selectedPlan?.priceYearly ?? "0 ₫")
            : (selectedPlan?.price ?? "0 ₫");

        setPayingLabel("Đang khởi tạo thanh toán...");
        let secret: string | undefined;
        try {
          const intentResult = await apiCreatePaymentIntent(invoiceId);
          secret = (intentResult as any)?.clientSecret as string | undefined;
        } catch {
          /* payment intent creation failed — fall through to checkout page */
        }

        if (secret) {
          setCheckout({ secret, invoiceId, amount });
          setStep(4);
          return;
        }
        navigate(
          `/billing/checkout/${invoiceId}?amount=${encodeURIComponent(amount)}`,
        );
      } else {
        notify.success(t("global.save_success"));
        navigate("/dashboard", { replace: true });
      }
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
  };

  const handleBack = () => {
    setEmailExistsError(null);
    setSubmitError(null);
    if (step === 0) navigate("/login");
    else setStep((s) => s - 1);
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
    clientSecret: checkout.secret,
    checkoutInvoiceId: checkout.invoiceId,
    checkoutAmount: checkout.amount,
  };
};
