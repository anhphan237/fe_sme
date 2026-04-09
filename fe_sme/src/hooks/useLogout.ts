/**
 * useLogout — logout flow hook (adapted from PMS for SME)
 */
import { APP_CONFIG, AppRouters } from "@/constants";
import { useUserStore } from "@/stores/user.store";
import { useGlobalStore } from "@/stores/global.store";
import { queryClient } from "@/lib/queryClient";

const useLogout = () => {
  const { logout: storeLogout } = useUserStore();
  const { resetGlobal } = useGlobalStore();

  const handleLogout = () => {
    storeLogout();
    resetGlobal();
    queryClient.clear();
    localStorage.removeItem(APP_CONFIG.ACCESS_TOKEN);
    localStorage.removeItem(APP_CONFIG.REFRESH_TOKEN);
    window.location.href = AppRouters.LOGIN;
  };

  return { handleLogout };
};

export default useLogout;
