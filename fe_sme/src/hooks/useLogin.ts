/**
 * useLogin — login flow hook (adapted from PMS for SME gateway)
 */
import { apiLogin } from "@/api/identity/identity.api";
import { mapLoginToAppUser } from "@/utils/mappers/identity";
import { APP_CONFIG, AppRouters } from "@/constants";
import { useAppStore } from "@/store/useAppStore";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export interface LoginFormData {
  email: string;
  password: string;
}

const useLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setToken, setRoles } = useAppStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (form: LoginFormData) => {
    setLoading(true);
    try {
      const res = await apiLogin({
        email: form.email,
        password: form.password,
      });
      const user = mapLoginToAppUser(res);

      localStorage.setItem(APP_CONFIG.ACCESS_TOKEN, res.accessToken);
      setToken(res.accessToken);
      setUser(user as any);
      setRoles(user.roles);

      const from =
        (location.state as { from?: { pathname: string } })?.from?.pathname ??
        AppRouters.DASHBOARD;
      navigate(from, { replace: true });
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading };
};

export default useLogin;
