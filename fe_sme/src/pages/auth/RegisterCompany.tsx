import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Stepper } from "../../components/ui/Stepper";
import { useToast } from "../../components/ui/Toast";
import { useAppStore } from "../../store/useAppStore";
import type { Tenant } from "../../shared/types";
import { apiCheckEmailExists } from "@/api/identity/identity.api";
import { apiRegisterCompany } from "@/api/company/company.api";

const schema = z.object({
  adminUsername: z.string().email("Valid email is required"),
  companyName: z.string().min(2, "Company name is required"),
  taxCode: z.string().min(1, "Tax code is required"),
  address: z.string().min(2, "Address is required"),
  timezone: z.string().min(1, "Timezone is required"),
  adminFullName: z.string().min(2, "Full name is required"),
  adminPassword: z.string().min(1, "Password is required"),
  adminPhone: z.string().optional(),
});

type RegisterForm = z.infer<typeof schema>;

const STEPS = ["Email", "Company", "Admin", "Confirm"];

const TIMEZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "UTC",
  "Europe/London",
  "America/New_York",
];

function RegisterCompany() {
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailExistsError, setEmailExistsError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { setTenant, setUser, setToken } = useAppStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
    trigger,
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      timezone: "Asia/Ho_Chi_Minh",
    },
  });

  const handleContinueFromEmail = async () => {
    setEmailExistsError(null);
    const ok = await trigger("adminUsername");
    if (!ok) return;
    const email = getValues("adminUsername");
    setCheckingEmail(true);
    try {
      const { exists } = await apiCheckEmailExists(email);
      if (exists) {
        setEmailExistsError(
          "Email already exists. Please choose another email.",
        );
        return;
      }
      setStep(1);
    } catch {
      setEmailExistsError("Could not check email. Please try again.");
    } finally {
      setCheckingEmail(false);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    if (step !== 3) return;
    setSubmitError(null);
    const payload = {
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
    };

    try {
      const result = await apiRegisterCompany(payload);
      if (!result?.user || !result?.token) {
        setSubmitError("Registration failed. No user or token returned.");
        toast("Registration failed. Please try again.");
        return;
      }
      setUser(result.user);
      setToken(result.token);
      const tenant: Tenant = {
        id: result.user.companyId ?? "company-new",
        name: data.companyName,
        industry: "",
        size: "",
        plan: "Pro",
      };
      setTenant(tenant);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("auth_token", result.token);
        window.localStorage.setItem("auth_user", JSON.stringify(result.user));
      }
      toast("Company registered successfully.");
      navigate("/dashboard", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Registration failed";
      setSubmitError(msg);
      toast("Registration failed. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
          Register Company
        </h1>
      </div>
      <Stepper steps={STEPS} current={step} />
      <Card className="border border-[#e5e5e7] bg-white shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          {(submitError || emailExistsError) && (
            <div
              className="rounded-lg bg-[#fff5f5] px-4 py-3 text-[13px] text-[#c53030]"
              role="alert">
              {emailExistsError ?? submitError}
            </div>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#1d1d1f]">
                  Admin email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                  placeholder="admin@company.com"
                  {...register("adminUsername")}
                />
                {errors.adminUsername && (
                  <p className="mt-1 text-[12px] text-[#c53030]">
                    {errors.adminUsername.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#1d1d1f]">
                  Company name
                </label>
                <input
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                  placeholder="Acme Corporation"
                  {...register("companyName")}
                />
                {errors.companyName && (
                  <p className="mt-1 text-[12px] text-[#c53030]">
                    {errors.companyName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#1d1d1f]">
                  Tax code
                </label>
                <input
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                  placeholder="ACME-001"
                  {...register("taxCode")}
                />
                {errors.taxCode && (
                  <p className="mt-1 text-[12px] text-[#c53030]">
                    {errors.taxCode.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#1d1d1f]">
                  Address
                </label>
                <input
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                  placeholder="123 Main Street"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="mt-1 text-[12px] text-[#c53030]">
                    {errors.address.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#1d1d1f]">
                  Timezone
                </label>
                <select
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[15px] text-[#1d1d1f] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                  {...register("timezone")}>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                {errors.timezone && (
                  <p className="mt-1 text-[12px] text-[#c53030]">
                    {errors.timezone.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#1d1d1f]">
                  Full name
                </label>
                <input
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                  placeholder="John Doe"
                  {...register("adminFullName")}
                />
                {errors.adminFullName && (
                  <p className="mt-1 text-[12px] text-[#c53030]">
                    {errors.adminFullName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#1d1d1f]">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                  placeholder="••••••••"
                  {...register("adminPassword")}
                />
                {errors.adminPassword && (
                  <p className="mt-1 text-[12px] text-[#c53030]">
                    {errors.adminPassword.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#1d1d1f]">
                  Phone <span className="text-[#86868b]">(optional)</span>
                </label>
                <input
                  type="tel"
                  className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                  placeholder="0900000000"
                  {...register("adminPhone")}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="rounded-lg border border-[#e5e5e7] bg-[#fbfbfd] p-4">
              <h3 className="text-[15px] font-semibold text-[#1d1d1f]">
                Summary
              </h3>
              <dl className="mt-3 space-y-2 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#86868b]">Company</dt>
                  <dd className="font-medium text-[#1d1d1f]">
                    {getValues("companyName")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#86868b]">Tax code</dt>
                  <dd className="font-medium text-[#1d1d1f]">
                    {getValues("taxCode")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#86868b]">Address</dt>
                  <dd className="font-medium text-[#1d1d1f]">
                    {getValues("address")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#86868b]">Timezone</dt>
                  <dd className="font-medium text-[#1d1d1f]">
                    {getValues("timezone")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#86868b]">Admin</dt>
                  <dd className="font-medium text-[#1d1d1f]">
                    {getValues("adminFullName")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#86868b]">Email</dt>
                  <dd className="font-medium text-[#1d1d1f]">
                    {getValues("adminUsername")}
                  </dd>
                </div>
                {getValues("adminPhone") && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#86868b]">Phone</dt>
                    <dd className="font-medium text-[#1d1d1f]">
                      {getValues("adminPhone")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-[#e5e5e7] pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                setEmailExistsError(null);
                if (step === 0) {
                  navigate("/login");
                } else {
                  setStep((s) => s - 1);
                }
              }}
              className="rounded-lg border-[#d2d2d7] text-[15px]">
              Back
            </Button>
            {step === 0 ? (
              <Button
                type="button"
                disabled={checkingEmail}
                onClick={(e) => {
                  e.preventDefault();
                  handleContinueFromEmail();
                }}
                className="rounded-lg bg-[#0071e3] text-[15px] hover:bg-[#0077ed] disabled:opacity-50">
                {checkingEmail ? "Checking…" : "Continue"}
              </Button>
            ) : step < 3 ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setStep((s) => s + 1);
                }}
                className="rounded-lg bg-[#0071e3] text-[15px] hover:bg-[#0077ed]">
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#0071e3] text-[15px] hover:bg-[#0077ed] disabled:opacity-50">
                {isSubmitting ? "Creating…" : "Create account"}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

export default RegisterCompany;
