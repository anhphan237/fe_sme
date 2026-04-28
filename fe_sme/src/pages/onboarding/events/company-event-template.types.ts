export type CompanyEventTemplateStatus = "ACTIVE" | "DRAFT" | "INACTIVE";

export type CompanyEventTemplateCreateRequest = {
  name: string;
  content: string;
  description?: string;
  status?: CompanyEventTemplateStatus | string;
};

export type CompanyEventTemplateCreateResponse = {
  eventTemplateId: string;
  name: string;
  content?: string;
  description?: string;
  status: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyEventTemplateListRequest = {
  status?: string;
  keyword?: string;
};

export type CompanyEventTemplateListItem = {
  eventTemplateId: string;
  name: string;
  content?: string;
  description?: string;
  status: string;
  createdBy?: string;
  createdByName?: string;
  createdByEmail?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyEventTemplateListResponse = {
  totalCount: number;
  items: CompanyEventTemplateListItem[];
};

export type CompanyEventTemplateDetailRequest = {
  eventTemplateId: string;
};

export type CompanyEventTemplateDetailResponse = {
  eventTemplateId: string;
  name: string;
  content?: string;
  description?: string;
  status: string;
  createdBy?: string;
  createdByName?: string;
  createdByEmail?: string;
  createdAt?: string;
  updatedAt?: string;
};
