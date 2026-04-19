/**
 * userResolver — ID-to-name resolution for Identity users
 *
 * API: com.sme.identity.user.list
 *
 * Usage (hook):
 *   const { nameMap, resolveName } = useUserNameMap();
 *   resolveName("some-user-id"); // "Nguyen Van A"
 *
 * Usage (standalone async):
 *   const map = await fetchUserNameMap();
 *   resolveUserName("some-user-id", map); // "Nguyen Van A"
 */

import { useQuery } from "@tanstack/react-query";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import type { UserListItem, UserListRequest } from "@/interface/identity";

// ── Types ─────────────────────────────────────────────────────────────────────

/** userId → display name */
export type UserNameMap = Record<string, string>;

// ── Core async function ───────────────────────────────────────────────────────

/**
 * Fetches users from `com.sme.identity.user.list` and returns a map of
 * `userId → fullName` (falls back to email, then userId when fullName is empty).
 *
 * @param params  Optional filter params forwarded to the API (status, departmentId, keyword)
 */
export async function fetchUserNameMap(
  params?: UserListRequest,
): Promise<UserNameMap> {
  const res = await apiSearchUsers(params);
  const users = extractList<UserListItem>(
    res,
    "users",
    "items",
    "content",
    "list",
  );
  return Object.fromEntries(
    users.map((u) => [u.userId, u.fullName || u.email || u.userId]),
  );
}

// ── Lookup helper ─────────────────────────────────────────────────────────────

/**
 * Resolves a `userId` to a display name using a pre-built `UserNameMap`.
 *
 * @param id        The userId to look up
 * @param map       The map returned by `fetchUserNameMap` / `useUserNameMap`
 * @param fallback  Value to return when the id is absent from the map.
 *                  Defaults to `"—"` when `fallback` is not provided.
 *
 * @example
 * resolveUserName("abc-123", nameMap);            // "Nguyen Van A"
 * resolveUserName(null,      nameMap);            // "—"
 * resolveUserName("unknown", nameMap, "Unknown"); // "Unknown"
 */
export function resolveUserName(
  id: string | null | undefined,
  map: UserNameMap,
  fallback?: string,
): string {
  if (!id) return fallback ?? "—";
  return map[id] ?? fallback ?? id;
}

// ── React Query hook ──────────────────────────────────────────────────────────

interface UseUserNameMapOptions {
  /** Extra filter params forwarded to the API */
  params?: UserListRequest;
  /** Whether to run the query (default: true) */
  enabled?: boolean;
  /** Cache lifetime in ms (default: 5 minutes) */
  staleTime?: number;
}

interface UseUserNameMapResult {
  /** The resolved id → name map (empty object while loading) */
  nameMap: UserNameMap;
  /** Shorthand: `resolveUserName(id, nameMap, fallback)` */
  resolveName: (id: string | null | undefined, fallback?: string) => string;
  isLoading: boolean;
  isError: boolean;
}

/**
 * React Query hook that fetches and caches the full user list as a
 * `userId → name` map.  Re-renders are minimal: the map reference only
 * changes when the data actually changes.
 *
 * @example
 * function MyComponent({ assigneeId }: { assigneeId: string }) {
 *   const { resolveName } = useUserNameMap();
 *   return <span>{resolveName(assigneeId)}</span>;
 * }
 */
export function useUserNameMap(
  options: UseUserNameMapOptions = {},
): UseUserNameMapResult {
  const { params, enabled = true, staleTime = 5 * 60 * 1000 } = options;

  const { data, isLoading, isError } = useQuery<UserNameMap>({
    queryKey: ["user-name-map", params ?? {}],
    queryFn: () => fetchUserNameMap(params),
    enabled,
    staleTime,
  });

  const nameMap: UserNameMap = data ?? {};

  return {
    nameMap,
    resolveName: (id, fallback) => resolveUserName(id, nameMap, fallback),
    isLoading,
    isError,
  };
}
