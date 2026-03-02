import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/Toast";
import { useAppStore } from "../../store/useAppStore";
import { apiLogin } from "@/api/identity/identity.api";
import { mapLoginToAppUser } from "@/utils/mappers/identity";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof schema>;

function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const setUser = useAppStore((state) => state.setUser);
  const setToken = useAppStore((state) => state.setToken);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setSubmitError(null);
      const response = await apiLogin(data);
      const user = mapLoginToAppUser(response);
      setUser(user);
      setToken(response.accessToken);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("auth_token", response.accessToken);
        window.localStorage.setItem("auth_user", JSON.stringify(user));
      }
      toast("Welcome back!");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const raw = error instanceof Error ? error.message : "Login failed";
      const message = raw.length > 200 ? `${raw.slice(0, 200)}…` : raw;
      setSubmitError(message);
      toast("Login failed. Please try again.");
      console.error("Login failed", error);
    }
  };

  const onError = () => {
    setSubmitError("Please check the form fields.");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-16 sm:px-8">
      <div className="w-full max-w-[380px]">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em] text-[#1d1d1f]">
            SME Workspace
          </h1>
        </div>

        {/* Form */}
        <div className="mt-12">
          <form
            className="space-y-5"
            onSubmit={handleSubmit(onSubmit, onError)}
            noValidate>
            {submitError && (
              <div
                className="rounded-lg bg-[#fff5f5] px-4 py-3 text-[13px] text-[#c53030]"
                role="alert">
                {submitError}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[13px] font-medium text-[#1d1d1f]">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] transition-colors focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1.5 text-[12px] text-[#c53030]">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[13px] font-medium text-[#1d1d1f]">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#d2d2d7] bg-white px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] transition-colors focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1.5 text-[12px] text-[#c53030]">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-lg bg-[#0071e3] py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#0077ed] disabled:opacity-50">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4">
            <button
              type="button"
              className="w-full rounded-lg border border-[#d2d2d7] bg-white py-3 text-[15px] font-medium text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7]"
              onClick={() => navigate("/register-company")}>
              Register Company
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
