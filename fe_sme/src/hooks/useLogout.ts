/**
 * useLogout — logout flow hook (adapted from PMS for SME)
 */
import { APP_CONFIG, AppRouters } from "@/constants";
import { useAppStore } from "@/store/useAppStore";

const useLogout = () => {
  const { logout: storeLogout } = useAppStore();

  const handleLogout = () => {
    storeLogout();
    localStorage.removeItem(APP_CONFIG.ACCESS_TOKEN);
    localStorage.removeItem(APP_CONFIG.REFRESH_TOKEN);
    window.location.href = AppRouters.LOGIN;
  };

  return { handleLogout };
};

export default useLogout;
