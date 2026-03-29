import { create } from "zustand";
import type { Tenant, User } from "@/shared/types";

export type Locale = "vi_VN" | "en_US";

const AUTH_TOKEN_KEY = "auth_token";
const TENANT_KEY = "auth_tenant";

const parseStoredTenant = (raw: string | null): Tenant | null => {
  if (!raw) return null;
  try {
    const t = JSON.parse(raw);
    if (!t || typeof t !== "object" || !("id" in t)) return null;
    return t as Tenant;
  } catch {
    return null;
  }
};

const normalizeLocale = (value: string | null): Locale => {
  if (!value) return "vi_VN";
  if (value === "vi_VN" || value === "vi-VN") return "vi_VN";
  if (value === "en_US" || value === "en-US") return "en_US";
  return "vi_VN";
};

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
  currentTenant:
    typeof window !== "undefined"
      ? parseStoredTenant(localStorage.getItem(TENANT_KEY))
      : null,
  currentUser: null,
  token:
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null,
  locale: normalizeLocale(
    typeof window !== "undefined" ? localStorage.getItem("locale") : null,
  ),
  logged:
    typeof window !== "undefined"
      ? !!localStorage.getItem(AUTH_TOKEN_KEY)
      : false,

  setTenant: (tenant) => {
    if (typeof window !== "undefined") {
      if (tenant) localStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
      else localStorage.removeItem(TENANT_KEY);
    }
    set({ currentTenant: tenant });
  },
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
      localStorage.setItem("locale", normalizeLocale(locale));
    }
    set({ locale: normalizeLocale(locale) });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem("auth_user");
      window.localStorage.removeItem(TENANT_KEY);
    }
    set({
      currentTenant: null,
      currentUser: null,
      token: null,
      logged: false,
    });
  },
}));
