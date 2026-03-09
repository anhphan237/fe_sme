import { create } from "zustand";
import type { Tenant, User } from "../shared/types";

export type Locale = "vi_VN" | "en_US";
export type Theme = "light" | "dark";

const AUTH_TOKEN_KEY = "auth_token";

interface AppState {
  // --- Existing auth state ---
  currentTenant: Tenant | null;
  currentUser: User | null;
  token: string | null;

  // --- Ported from PMS global.store ---
  loading: boolean;
  theme: Theme;
  permissions: string[];
  roles: string[];

  // --- Ported from PMS user.store ---
  locale: Locale;
  logged: boolean;

  // --- Actions ---
  setTenant: (tenant: Tenant | null) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setTheme: (theme: Theme) => void;
  setPermissions: (permissions: string[]) => void;
  setRoles: (roles: string[]) => void;
  setLocale: (locale: Locale) => void;
  logout: () => void;

  // --- Breadcrumb mapping (PMS setBreadCrumbs pattern) ---
  breadcrumbs: { [key: string]: string };
  setBreadcrumbs: (entries: { [key: string]: string }) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  currentTenant: null,
  currentUser: null,
  token:
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null,

  // Global (PMS global.store)
  loading: false,
  theme: "light",
  permissions: [],
  roles: [],

  // User (PMS user.store)
  locale: ((typeof window !== "undefined"
    ? localStorage.getItem("locale")
    : null) || "vi_VN") as Locale,
  logged:
    typeof window !== "undefined"
      ? !!localStorage.getItem(AUTH_TOKEN_KEY)
      : false,

  // Actions
  setTenant: (tenant) => set({ currentTenant: tenant }),
  setUser: (user) => set({ currentUser: user }),
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
      else localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    set({ token, logged: !!token });
  },
  setLoading: (loading) => set({ loading }),
  setTheme: (theme) => set({ theme }),
  setPermissions: (permissions) => set({ permissions }),
  setRoles: (roles) => set({ roles }),
  setLocale: (locale) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", locale);
    }
    set({ locale });
  },
  breadcrumbs: {},
  setBreadcrumbs: (entries) =>
    set((state) => ({ breadcrumbs: { ...state.breadcrumbs, ...entries } })),
  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem("auth_user");
    }
    set({
      currentTenant: null,
      currentUser: null,
      token: null,
      logged: false,
      permissions: [],
      roles: [],
    });
  },
}));
