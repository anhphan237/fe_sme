export interface IEmployeeData {
    id: string;
    fullName: string;
    code: string;
    gender: Gender;
    dateOfBirth: string;
    placeOfBirth?: string;
    workEmail?: string;
    taxCode?: string;
    ethnicity?: string;
    nationality?: string;
    maritalStatus: MaritalStatus;
    hireDate: string;
    salary: number;
    status: EmployeeStatus;
    tenantId?: string;
    phone?: string;
    created: string;
    createdBy?: string;
    createdByName?: string;
    lastModified?: string;
    lastModifiedBy?: string;
    lastModifiedByName?: string;
    mobilePhone?: string;
    identityDocuments?: IEmployeeIdentityDocument[];
    educations?: IEmployeeEducation[];
    contact?: IEmployeeContact;
    address?: IEmployeeAddress;
    emergencyContacts?: IEmployeeEmergencyContact[];
    contracts?: IEmployeeContract[];
}

export interface IAddEditEmployee {
    id?: string;
    fullName: string;
    employeeCode?: string;
    avatar?: string;
    gender: number;
    dateOfBirth: string;
    placeOfBirth?: string;
    workEmail?: string;
    taxCode?: string;
    ethnicity?: string;
    nationality?: string;
    maritalStatus: number;
    hireDate: string;
    salary: number;
    status: number;
    isSaveAdd?: boolean;

    identityDocuments: IEmployeeIdentityDocument[];
    educations?: IEmployeeEducation[];
    contact: IEmployeeContact;
    address: IEmployeeAddress;
    emergencyContacts?: IEmployeeEmergencyContact[];
    contracts: IEmployeeContract[];
}

export interface IEmployeeContact {
    id?: string;
    mobilePhone: string;
    workPhone?: string;
    // workEmail?: string;
    otherPhone?: string;
    personalEmail?: string;
}

export interface IEmployeeAddress {
    id?: string;
    addressType: string;
    country: string;
    city: string;
    district?: string;
    ward?: string;
    street?: string;
}

export interface IEmployeeIdentityDocument {
    id?: string;
    documentType: string;
    documentNumber: string;
    issueDate?: string;
    issuePlace?: string;
    expiryDate?: string;
    number?: number;
}

export interface IEmployeeEducation {
    id?: string;
    educationLevel: EducationLevel;
    major?: string;
    school?: string;
    graduationYear?: number;
    classification?: string;
    number?: number;
}

export interface IEmployeeEmergencyContact {
    id?: string;
    fullName?: string;
    relationship?: string;
    phone?: string;
    email?: string;
    address?: string;
    number?: number;
}

export interface IEmployeeContract {
    id?: string;
    contractType: string;
    startDate: string;
    endDate?: string;
    salary?: number;
    note?: string;
    number?: number;
}

export enum Gender {
    FEMALE = 0,
    MALE = 1,
}

export enum MaritalStatus {
    SINGLE = 0,
    MARRIED = 1,
    DIVORCED = 2,
    WIDOWED = 3,
    SEPARATED = 4,
}

export enum EmployeeStatus {
    PROBATION = 0,
    OFFICIAL = 1,
    RESIGNED = 2,
    RETIRED = 3,
    TERMINATED = 4,
    MATERNITY_LEAVE = 5,
}

export enum EducationLevel {
    NONE = 0,
    PRIMARY = 1,
    SECONDARY = 2,
    HIGH_SCHOOL = 3,
    VOCATIONAL = 4,
    COLLEGE = 5,
    UNIVERSITY = 6,
    MASTER = 7,
    DOCTOR = 8,
    OTHER = 9,
}
