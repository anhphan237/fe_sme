import { create } from "zustand";
import type { Tenant, User } from "@/shared/types";

export type Locale = "vi_VN" | "en_US";

const AUTH_TOKEN_KEY = "auth_token";

interface UserState {
  currentTenant: Tenant | null;
  currentUser: User | null;
  token: string | null;
  locale: Locale;
  logged: boolean;

  setTenant: (tenant: Tenant | null) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLocale: (locale: Locale) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentTenant: null,
  currentUser: null,
  token:
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null,
  locale: ((typeof window !== "undefined"
    ? localStorage.getItem("locale")
    : null) || "vi_VN") as Locale,
  logged:
    typeof window !== "undefined"
      ? !!localStorage.getItem(AUTH_TOKEN_KEY)
      : false,

  setTenant: (tenant) => set({ currentTenant: tenant }),
  setUser: (user) => set({ currentUser: user }),
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
      else localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    set({ token, logged: !!token });
  },
  setLocale: (locale) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", locale);
    }
    set({ locale });
  },
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
    });
  },
}));
