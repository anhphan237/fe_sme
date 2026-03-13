import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Form } from "antd";
import type { FormInstance } from "antd";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@core/components/ui/Toast";
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
  apiGetInvoiceById,
  apiCreatePaymentIntent,
} from "@/api/billing/billing.api";
import { extractList } from "@/api/core/types";
import { mapPlan, mapSubscription, mapInvoice } from "@/utils/mappers/billing";

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

function getCurrentPeriod() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return {
    periodStart: new Date(y, m, 1).toISOString().slice(0, 10),
    periodEnd: new Date(y, m + 1, 1).toISOString().slice(0, 10),
  };
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

  isPaying: boolean;

  submitError: string | null;
  setSubmitError: Dispatch<SetStateAction<string | null>>;

  // Step 4 — inline payment
  clientSecret: string | null;
  checkoutInvoiceId: string | null;
  checkoutAmount: string;
}

export function useRegisterCompany(): UseRegisterCompanyResult {
  const { t } = useLocale();
  const navigate = useNavigate();
  const toast = useToast();
  const { setTenant, setUser, setToken } = useUserStore();

  const detectedTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Ho_Chi_Minh";

  const [form] = Form.useForm<RegisterFormValues>();

  // Set timezone default after form creation
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailExistsError, setEmailExistsError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutInvoiceId, setCheckoutInvoiceId] = useState<string | null>(
    null,
  );
  const [checkoutAmount, setCheckoutAmount] = useState<string>("0 ₫");

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
    setSubmitError(null);
    try {
      const data = form.getFieldsValue();
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
        status: "Active" as const,
        createdAt: new Date().toISOString(),
      };

      setUser(newUser);
      setToken(result.accessToken);
      setTenant({
        id: result.companyId ?? "company-new",
        name: data.companyName,
        industry: "",
        size: "",
        plan: "Pro",
      } as Tenant);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("auth_token", result.accessToken);
        window.localStorage.setItem("auth_user", JSON.stringify(newUser));
      }

      if (selectedPlanCode.toUpperCase() === "FREE") {
        toast(t("global.save_success"));
        navigate("/dashboard", { replace: true });
        return;
      }

      const sub = await apiGetSubscription(result.companyId);
      const subData = mapSubscription(sub as any);
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
        // Fetch the actual invoice to get the real amount (prorateChargeVnd is 0 for new subscriptions)
        let amount = "0 ₫";
        try {
          const invoiceData = await apiGetInvoiceById(invoiceId);
          amount = mapInvoice(invoiceData as any).amount;
        } catch {
          /* keep "0 ₫" fallback */
        }
        try {
          const intentData = await apiCreatePaymentIntent(invoiceId);
          const secret = (intentData as any)?.clientSecret as
            | string
            | undefined;
          if (secret) {
            setClientSecret(secret);
            setCheckoutInvoiceId(invoiceId);
            setCheckoutAmount(amount);
            setStep(4);
            return;
          }
        } catch {
          /* fallback: navigate to standalone checkout page */
        }
        navigate(
          `/billing/checkout/${invoiceId}?amount=${encodeURIComponent(amount)}`,
        );
      } else {
        toast(t("global.save_success"));
        navigate("/dashboard", { replace: true });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("register.error.failed");
      setSubmitError(msg);
      toast(t("register.error.failed"));
    } finally {
      setIsPaying(false);
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
    submitError,
    setSubmitError,
    isPaying,
    clientSecret,
    checkoutInvoiceId,
    checkoutAmount,
  };
}
