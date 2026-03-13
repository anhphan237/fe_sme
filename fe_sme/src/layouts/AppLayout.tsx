import { type ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";

type Props = {
  children: ReactNode;
};

const AppLayout = ({ children }: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          <TopBar
            pathname={location.pathname}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
