import { create } from "zustand";

export type Theme = "light" | "dark";

interface GlobalState {
  loading: boolean;
  theme: Theme;
  permissions: string[];
  roles: string[];
  breadcrumbs: { [key: string]: string };

  setLoading: (loading: boolean) => void;
  setTheme: (theme: Theme) => void;
  setPermissions: (permissions: string[]) => void;
  setRoles: (roles: string[]) => void;
  setBreadcrumbs: (entries: { [key: string]: string }) => void;
  resetGlobal: () => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  loading: false,
  theme: "light",
  permissions: [],
  roles: [],
  breadcrumbs: {},

  setLoading: (loading) => set({ loading }),
  setTheme: (theme) => set({ theme }),
  setPermissions: (permissions) => set({ permissions }),
  setRoles: (roles) => set({ roles }),
  setBreadcrumbs: (entries) =>
    set((state) => ({ breadcrumbs: { ...state.breadcrumbs, ...entries } })),
  resetGlobal: () =>
    set({ permissions: [], roles: [], breadcrumbs: {}, loading: false }),
}));
