import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return <div className="min-h-screen bg-[#fbfbfd]">{children}</div>;
};

export default AuthLayout;
