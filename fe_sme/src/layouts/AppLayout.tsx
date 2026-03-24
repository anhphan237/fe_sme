import { type ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { useGlobalStore } from "@/stores/global.store";

type Props = {
  children: ReactNode;
};

const AppLayout = ({ children }: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const sidebarCollapsed = useGlobalStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-slate-100 text-ink">
      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
        />

        <div className="flex h-screen flex-1 flex-col overflow-hidden transition-all duration-300">
          <TopBar
            pathname={location.pathname}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-100 via-slate-100 to-white/80 px-4 py-4 md:px-6 md:py-5">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
