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

export const useUsersQuery = (options?: Pick<UseQueryOptions, "enabled" | "staleTime">) =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: unknown) =>
      extractList<UserListItem>(res, "users", "items").map(mapUser) as User[],
    ...options,
  });

export const useDepartmentsQuery = () =>
  useQuery({
    queryKey: ["departments"],
    queryFn: () => apiListDepartments(),
    select: (res: unknown) => extractList<DepartmentItem>(res, "items"),
  });

export const useDepartmentTypesQuery = () =>
  useQuery({
    queryKey: ["departmentTypes"],
    queryFn: () => apiListDepartmentTypes(),
    select: (res: unknown) => extractList<DepartmentTypeItem>(res, "items"),
  });
