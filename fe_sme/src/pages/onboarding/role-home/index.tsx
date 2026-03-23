import { Navigate } from "react-router-dom";
import { useUserStore } from "@/stores/user.store";
import { canManageOnboarding, isOnboardingEmployee } from "@/shared/rbac";

const OnboardingRoleHome = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const roles = currentUser?.roles ?? [];

  if (isOnboardingEmployee(roles)) {
    return <Navigate to="/onboarding/home/employee" replace />;
  }

  if (roles.includes("HR")) {
    return <Navigate to="/onboarding/hr" replace />;
  }

  if (canManageOnboarding(roles)) {
    return <Navigate to="/onboarding/home/manager" replace />;
  }

  return <Navigate to="/onboarding/tasks" replace />;
};

export default OnboardingRoleHome;
