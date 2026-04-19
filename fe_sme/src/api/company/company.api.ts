import { gatewayRequest } from "../core/gateway";
import type {
  CreateCompanyRequest,
  CreateCompanyResponse,
  CompanyRegisterRequest,
  CompanyRegisterResponse,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  ListDepartmentRequest,
  DepartmentItem,
  ListDepartmentResponse,
  DepartmentMutationResponse,
  ListDepartmentTypeRequest,
  DepartmentTypeItem,
  ListDepartmentTypeResponse,
  CreateDepartmentTypeRequest,
  CreateDepartmentTypeResponse,
  UpdateDepartmentTypeRequest,
  UpdateDepartmentTypeResponse,
  DeleteDepartmentTypeRequest,
  DeleteDepartmentTypeResponse,
} from "@/interface/company";

// ── Company ────────────────────────────────────────────────

/** com.sme.company.create */
export const apiCreateCompany = (payload: CreateCompanyRequest) =>
  gatewayRequest<CreateCompanyRequest, CreateCompanyResponse>(
    "com.sme.company.create",
    payload,
  );

/** com.sme.company.register */
export const apiRegisterCompany = (payload: CompanyRegisterRequest) =>
  gatewayRequest<CompanyRegisterRequest, CompanyRegisterResponse>(
    "com.sme.company.register",
    payload,
    { tenantId: null },
  );

// ── Department ─────────────────────────────────────────────

/** com.sme.company.department.list */
export const apiListDepartments = (params?: ListDepartmentRequest) =>
  gatewayRequest<
    ListDepartmentRequest,
    ListDepartmentResponse | DepartmentItem[]
  >("com.sme.company.department.list", params ?? {}, { flatPayload: true });

/** com.sme.company.department.create */
export const apiCreateDepartment = (payload: CreateDepartmentRequest) =>
  gatewayRequest<CreateDepartmentRequest, DepartmentMutationResponse>(
    "com.sme.company.department.create",
    payload,
  );

/** com.sme.company.department.update */
export const apiUpdateDepartment = (payload: UpdateDepartmentRequest) =>
  gatewayRequest<UpdateDepartmentRequest, DepartmentMutationResponse>(
    "com.sme.company.department.update",
    payload,
  );

/** com.sme.org.department.create */
export const apiCreateOrgDepartment = (payload: CreateDepartmentRequest) =>
  gatewayRequest<CreateDepartmentRequest, DepartmentMutationResponse>(
    "com.sme.org.department.create",
    payload,
  );

/** com.sme.org.department.update */
export const apiUpdateOrgDepartment = (payload: UpdateDepartmentRequest) =>
  gatewayRequest<UpdateDepartmentRequest, DepartmentMutationResponse>(
    "com.sme.org.department.update",
    payload,
  );

// ── Department Type ────────────────────────────────────────

/** com.sme.company.departmentType.list */
export const apiListDepartmentTypes = (params?: ListDepartmentTypeRequest) =>
  gatewayRequest<
    ListDepartmentTypeRequest,
    ListDepartmentTypeResponse | DepartmentTypeItem[]
  >("com.sme.company.departmentType.list", params ?? {}, { flatPayload: true });

/** com.sme.company.departmentType.create */
export const apiCreateDepartmentType = (payload: CreateDepartmentTypeRequest) =>
  gatewayRequest<CreateDepartmentTypeRequest, CreateDepartmentTypeResponse>(
    "com.sme.company.departmentType.create",
    payload,
  );

/** com.sme.company.departmentType.update */
export const apiUpdateDepartmentType = (payload: UpdateDepartmentTypeRequest) =>
  gatewayRequest<UpdateDepartmentTypeRequest, UpdateDepartmentTypeResponse>(
    "com.sme.company.departmentType.update",
    payload,
  );

/** com.sme.company.departmentType.delete */
export const apiDeleteDepartmentType = (payload: DeleteDepartmentTypeRequest) =>
  gatewayRequest<DeleteDepartmentTypeRequest, DeleteDepartmentTypeResponse>(
    "com.sme.company.departmentType.delete",
    payload,
  );

