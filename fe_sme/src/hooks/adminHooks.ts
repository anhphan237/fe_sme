import { useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";
import { apiSearchUsers } from "@/api/identity/identity.api";
import {
  apiListDepartments,
  apiListDepartmentTypes,
} from "@/api/company/company.api";
import { extractList } from "@/api/core/types";
import { mapUser } from "@/utils/mappers/identity";
import type { User } from "@/shared/types";
import type { UserListItem } from "@/interface/identity";
import type { DepartmentItem, DepartmentTypeItem } from "@/interface/company";

type QueryOptions = Pick<UseQueryOptions, "enabled" | "staleTime">;

const selectUsers = (res: unknown): User[] =>
  extractList<UserListItem>(res, "users", "items").map(mapUser) as User[];

export const useUsersQuery = (options?: QueryOptions) =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: selectUsers,
    ...options,
  });

export const useManagerUsersQuery = (options?: QueryOptions) =>
  useQuery({
    queryKey: ["users", "role", "MANAGER"],
    queryFn: () => apiSearchUsers({ role: "MANAGER" }),
    select: selectUsers,
    ...options,
  });

export const useDepartmentsQuery = () =>
  useQuery({
    queryKey: ["departments"],
    queryFn: () => apiListDepartments(),
    select: (res: unknown) => extractList<DepartmentItem>(res, "items"),
  });

export const useDepartmentTypesQuery = (status?: string) =>
  useQuery({
    queryKey: ["departmentTypes", status ?? "ALL"],
    queryFn: () =>
      apiListDepartmentTypes(status ? { status } : undefined),
    select: (res: unknown) => extractList<DepartmentTypeItem>(res, "items"),
  });
