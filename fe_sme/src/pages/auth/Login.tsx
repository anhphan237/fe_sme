import LoginSidebar from "./components/LoginSidebar";
import LoginFormSection from "./components/LoginFormSection";
import { LangSwitcher } from "@/components/LangSwitcher";

const Login = () => (
  <div className="flex min-h-screen relative">
    <LoginSidebar />
    <LoginFormSection />
    <div className="absolute top-4 right-4 z-10">
      <LangSwitcher />
    </div>
  </div>
);

export default Login;
