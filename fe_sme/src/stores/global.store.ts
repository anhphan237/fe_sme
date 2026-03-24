import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "light" | "dark";

interface GlobalState {
  loading: boolean;
  theme: Theme;
  permissions: string[];
  roles: string[];
  breadcrumbs: { [key: string]: string };
  sidebarCollapsed: boolean;

  setLoading: (loading: boolean) => void;
  setTheme: (theme: Theme) => void;
  setPermissions: (permissions: string[]) => void;
  setRoles: (roles: string[]) => void;
  setBreadcrumbs: (entries: { [key: string]: string }) => void;
  resetGlobal: () => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      loading: false,
      theme: "light",
      permissions: [],
      roles: [],
      breadcrumbs: {},
      sidebarCollapsed: false,

      setLoading: (loading) => set({ loading }),
      setTheme: (theme) => set({ theme }),
      setPermissions: (permissions) => set({ permissions }),
      setRoles: (roles) => set({ roles }),
      setBreadcrumbs: (entries) =>
        set((state) => ({ breadcrumbs: { ...state.breadcrumbs, ...entries } })),
      resetGlobal: () =>
        set({ permissions: [], roles: [], breadcrumbs: {}, loading: false }),
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: "sme-sidebar-collapsed",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);
