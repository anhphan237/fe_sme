import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Form } from "antd";
import { Eye, EyeOff } from "lucide-react";
import { useLocale } from "@/i18n";
import { notify } from "@/utils/notify";
import BaseButton from "@/components/button";
import BrandLogo from "@/components/BrandLogo";
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
          <div className="mb-8 lg:hidden">
            <BrandLogo variant="compact" asLink={false} />
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
                  className="text-muted hover:text-ink transition-colors flex items-center focus-visible:ring-2 focus-visible:ring-brand rounded"
                  onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
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
              <Link
                to="/forgot-password"
                className="text-[12px] font-medium text-brand hover:text-brandDark transition-colors">
                {t("auth.forgot_password")}
              </Link>
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
