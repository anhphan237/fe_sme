import { Navigate } from "react-router-dom";
import { useUserStore } from "@/stores/user.store";
import HrDashboard from "./HrDashboard";
import ManagerDashboard from "./ManagerDashboard";

const OnboardingDashboard = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const roles = currentUser?.roles ?? [];

  if (roles.includes("HR")) return <HrDashboard />;
  if (roles.includes("MANAGER")) return <ManagerDashboard />;
  // EMPLOYEE → redirect to My Journey
  return <Navigate to="/onboarding/my-journey" replace />;
};

export default OnboardingDashboard;
