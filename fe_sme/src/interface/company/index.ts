// ============================================================
// Company Module Interfaces
// Maps to BE: modules/company
// Operations: com.sme.company.*, com.sme.org.department.*
// ============================================================

import type { EntityStatus } from "../common";

// ---------------------------
// Company
// ---------------------------

/** com.sme.company.create */
export interface CreateCompanyRequest {
  companyId?: string;
  name: string;
  taxCode?: string;
  address?: string;
  timezone?: string;
  /** default: ACTIVE */
  status?: EntityStatus;
}

/** com.sme.company.create → response data */
export interface CreateCompanyResponse {
  companyId: string;
  name: string;
  status: EntityStatus;
}

/** com.sme.company.register — public self-registration */
export interface CompanyRegisterRequest {
  company: {
    name: string;
    taxCode?: string;
    /** 3-char company code used as employee ID prefix, e.g. "ABC" → ABC000001. Optional; BE derives from name if omitted. */
    code?: string;
    address?: string;
    timezone?: string;
    /** Industry/sector, e.g. "Công nghệ", "Bán lẻ". Used by AI to generate default onboarding template. */
    industry?: string;
    /** Company size: STARTUP, SME, ENTERPRISE. Used by AI to generate default onboarding template. */
    companySize?: string;
  };
  admin: {
    username: string;
    password: string;
    fullName: string;
    phone?: string;
  };
  planCode: string;
  billingCycle?: "MONTHLY" | "YEARLY";
}

/** com.sme.company.register → response data */
export interface CompanyRegisterResponse {
  companyId: string;
  adminUserId: string;
  accessToken: string;
}

// ---------------------------
// Department
// ---------------------------

/** com.sme.company.department.create / com.sme.org.department.create */
export interface CreateDepartmentRequest {
  companyId?: string;
  name: string;
  type?: string;
  managerId?: string;
}

/** com.sme.company.department.update / com.sme.org.department.update */
export interface UpdateDepartmentRequest {
  departmentId: string;
  name?: string;
  type?: string;
  status?: EntityStatus;
  managerUserId?: string;
}

/** com.sme.company.department.list */
export interface ListDepartmentRequest {
  status?: EntityStatus;
}

/** Single department item in list response (matches BE DepartmentItem) */
export interface DepartmentItem {
  departmentId: string;
  name: string;
  type: string | null;
  managerUserId: string | null;
}

/** com.sme.company.department.list → response data */
export interface ListDepartmentResponse {
  items: DepartmentItem[];
}

/** Create/update department response */
export interface DepartmentMutationResponse {
  departmentId: string;
  name: string;
}
