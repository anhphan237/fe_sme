import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Form } from "antd";
import { useLocale } from "@/i18n";
import { notify } from "@/utils/notify";
import BaseButton from "@/components/button";
import { useUserStore } from "@/stores/user.store";
import { apiLogin } from "@/api/identity/identity.api";
import { mapLoginToAppUser } from "@/utils/mappers/identity";
import BaseInput from "@core/components/Input/InputWithLabel";

const LoginFormSection = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);
  const setToken = useUserStore((state) => state.setToken);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmitData = async (values: {
    email: string;
    password: string;
  }) => {
    try {
      setLoading(true);
      setSubmitError(null);
      const response = await apiLogin(values);
      const user = mapLoginToAppUser(response);
      setUser(user as any);
      setToken(response.accessToken);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("auth_token", response.accessToken);
        window.localStorage.setItem("auth_user", JSON.stringify(user));
      }
      notify.success("Welcome back!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Login failed";
      setSubmitError(raw.length > 200 ? `${raw.slice(0, 200)}…` : raw);
      console.error("Login failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-gray-50/50">
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px] flex flex-col">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand to-brandDark opacity-90" />
              <div className="relative flex items-center justify-center w-full h-full">
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                  <rect
                    x="3"
                    y="2"
                    width="14"
                    height="16"
                    rx="2.5"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M7 7h6M7 10.5h4"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <span className="text-[16px] font-bold text-ink tracking-tight">
              Onboard<span className="text-brand">IQ</span>
            </span>
          </div>

          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              {t("auth.login.title")}
            </h1>
            <p className="mt-1.5 text-sm text-muted">
              {t("auth.login.subtitle")}
            </p>
          </div>

          {/* Server-side error */}
          {submitError && (
            <Alert
              type="error"
              showIcon
              message={submitError}
              className="mb-5 rounded-xl"
            />
          )}

          {/* Form */}
          <Form
            form={form}
            onFinish={handleSubmitData}
            layout="vertical"
            className="space-y-4">
            <BaseInput
              name="email"
              label={t("auth.email")}
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message: t("global.required", { field: t("auth.email") }),
                  },
                  {
                    type: "email",
                    message: t("global.invalid", { field: t("auth.email") }),
                  },
                ],
              }}
            />

            <BaseInput
              name="password"
              label={t("auth.password")}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              suffix={
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-muted hover:text-ink transition-colors flex items-center"
                  onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </button>
              }
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message: t("global.required", {
                      field: t("auth.password"),
                    }),
                  },
                ],
              }}
            />

            {/* Forgot password — below password field */}
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                className="text-[12px] font-medium text-brand hover:text-brandDark transition-colors"
                onClick={() => navigate("/forgot-password")}>
                {t("auth.forgot_password")}
              </button>
            </div>

            <BaseButton
              type="primary"
              htmlType="submit"
              loading={loading}
              className="mt-2 w-full"
              label="auth.login.submit"
            />
          </Form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-stroke" />
            <span className="text-[12px] text-muted">{t("auth.login.or")}</span>
            <div className="h-px flex-1 bg-stroke" />
          </div>

          {/* Register CTA */}
          <BaseButton
            type="default"
            htmlType="button"
            className="w-full"
            label="auth.login.register_cta"
            onClick={() => navigate("/register-company")}
          />

          {/* Terms */}
          <p className="mt-auto pt-8 text-center text-[12px] text-muted">
            {t("auth.login.terms_prefix")}{" "}
            <Link to="/terms" className="font-medium text-ink hover:underline">
              {t("auth.login.terms")}
            </Link>{" "}
            {t("auth.login.terms_and")}{" "}
            <Link
              to="/privacy"
              className="font-medium text-ink hover:underline">
              {t("auth.login.privacy")}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginFormSection;
