import { useEffect, useState, type ReactNode } from "react";
import { useUserStore } from "@/stores/user.store";
import type { User } from "../../shared/types";
import { PageSkeleton } from "../ui/Skeleton";

const AUTH_USER_KEY = "auth_user";

function parseStoredUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as unknown;
    if (!u || typeof u !== "object" || !("id" in u) || !("email" in u))
      return null;
    const user = u as User;
    return {
      id: user.id,
      name: user.name ?? "",
      email: user.email,
      roles: Array.isArray(user.roles) ? user.roles : ["EMPLOYEE"],
      companyId: user.companyId ?? null,
      department: user.department ?? "",
      status: user.status ?? "Active",
      createdAt: user.createdAt ?? new Date().toISOString().slice(0, 10),
    };
  } catch {
    return null;
  }
}

interface AuthRehydrateProps {
  children: ReactNode;
}

/**
 * On mount: restore token + user from localStorage so reload keeps session.
 * Optionally refreshes user via me() in background.
 */
export function AuthRehydrate({ children }: AuthRehydrateProps) {
  const [rehydrated, setRehydrated] = useState(false);
  const setToken = useUserStore((s) => s.setToken);
  const setUser = useUserStore((s) => s.setUser);
  const logout = useUserStore((s) => s.logout);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("auth_token")
        : null;
    const storedUser =
      typeof window !== "undefined"
        ? localStorage.getItem(AUTH_USER_KEY)
        : null;

    if (!token) {
      setRehydrated(true);
      return;
    }

    setToken(token);
    const user = parseStoredUser(storedUser);
    if (user) {
      setUser(user);
    } else {
      // No stored user state — session is stale, force re-login
      logout();
    }
    setRehydrated(true);
  }, [setToken, setUser, logout]);

  if (!rehydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageSkeleton />
      </div>
    );
  }

  return <>{children}</>;
}
