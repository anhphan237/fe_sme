// Enum cho trạng thái nhân viên
export enum EmployeeStatus {
    PROBATION = 'probation', // Thử việc
    OFFICIAL = 'official', // Chính thức
    MATERNITY = 'maternity', // Nghỉ thai sản
    OTHER = 'other', // Khác
}

// Enum cho giới tính
export enum Gender {
    MALE = 'male', // Nam
    FEMALE = 'female', // Nữ
    UNSPECIFIED = 'unspecified', // Không xác định
}

// Interface cho thống kê
export interface EmployeeStats {
    probation: number; // Số lượng thử việc
    official: number; // Số lượng chính thức
    maternity: number; // Số lượng nghỉ thai sản
    other: number; // Số lượng khác
}

// Interface cho dữ liệu nhân viên
export interface IEmployee {
    id: string;
    code: string; // Mã nhân viên (NV000001)
    fullName: string; // Họ và tên
    avatar?: string; // URL avatar
    gender: Gender; // Giới tính
    dateOfBirth?: string; // Ngày sinh
    phoneNumber: string; // ĐT di động
    email: string; // Email cơ quan
    position: string; // Vị trí công việc
    department: string; // Đơn vị có
    status: EmployeeStatus; // Trạng thái
    created: string;
    lastModified?: string;
}

// Interface cho filter
export interface EmployeeFilter {
    pageNumber: number;
    pageSize: number;
    search?: string;
    status?: EmployeeStatus;
    gender?: Gender;
    departmentId?: string;
    positionId?: string;
}

// Interface cho response API
export interface EmployeeResponse {
    data: IEmployee[];
    totalItems: number;
    pageNumber: number;
    pageSize: number;
}

// Interface cho chart data
export interface ChartData {
    type: string;
    value: number;
}
