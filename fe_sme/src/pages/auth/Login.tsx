import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/Toast";
import { useUserStore } from "@/stores/user.store";
import { apiLogin } from "@/api/identity/identity.api";
import { mapLoginToAppUser } from "@/utils/mappers/identity";
import { LoginLeftPanel } from "./components/LoginLeftPanel";
import { LoginFormCard, type LoginForm } from "./components/LoginFormCard";
import { RegisterTopBar } from "./components/RegisterTopBar";

// ── Page ─────────────────────────────────────────────────

function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const setUser = useUserStore((state) => state.setUser);
  const setToken = useUserStore((state) => state.setToken);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmitData = async (data: LoginForm) => {
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
      setSubmitError(raw.length > 200 ? `${raw.slice(0, 200)}…` : raw);
      console.error("Login failed", error);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left – brand panel */}
      <LoginLeftPanel />

      {/* Right – form area */}
      <div className="flex flex-1 flex-col bg-gray-50/50">
        {/* Top bar: language switcher */}
        <RegisterTopBar />

        {/* Centred form */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px]">
            <LoginFormCard
              onSubmitData={handleSubmitData}
              submitError={submitError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
