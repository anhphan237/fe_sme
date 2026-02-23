/**
 * Gateway Type Definitions
 * Types for Gateway API requests and responses
 */

// ========== Common Types ==========

export interface PaginatedRequest {
    pageNumber: number;
    pageSize: number;
    search?: string;
    filters?: Record<string, any>;
}

export interface PaginatedResponse<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

// ========== Authentication ==========

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    tokenType: string;
    expiresInSeconds: number;
    user: UserInfo;
}

export interface UserInfo {
    id: string;
    fullName: string;
    email: string;
    roleCode: string;
}

export interface CheckEmailRequest {
    email: string;
}

export interface CheckEmailResponse {
    exists: boolean;
}

export interface RegisterRequest {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
}

/**
 * Response sau khi đăng ký thành công.
 * onboardingStep = 'org_setup' — luôn điều hướng về trang thiết lập tổ chức.
 */
export interface RegisterResponse {
    accessToken: string;
    tokenType: string;
    expiresInSeconds: number;
    user: UserInfo;
    tenantId: string;
    onboardingStep: 'org_setup';
}

// ========== User Management ==========

export interface User {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    roleCode?: string;
    isActive: boolean;
    companyId: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateUserRequest {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    roleCode?: string;
}

export interface UpdateUserRequest {
    userId: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    roleCode?: string;
}

export interface UserListResponse extends PaginatedResponse<User> {}

// ========== Company & Department ==========

export interface Company {
    id: string;
    name: string;
    taxCode?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    industry?: string;
    size?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface Department {
    id: string;
    name: string;
    description?: string;
    parentDepartmentId?: string;
    companyId: string;
    managerId?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CompanySetupRequest {
    companyName: string;
    taxCode?: string;
    industry?: string;
    size?: string;
    adminEmail: string;
    adminPassword: string;
    adminFullName: string;
}

export interface CompanySetupResponse {
    company: Company;
    admin: User;
    accessToken: string;
}

export interface CreateDepartmentRequest {
    name: string;
    description?: string;
    parentDepartmentId?: string;
    managerId?: string;
}

export interface DepartmentListResponse {
    departments: Department[];
}

// ========== Onboarding Templates ==========

export interface OnboardingTemplate {
    id: string;
    name: string;
    description?: string;
    durationDays: number;
    departmentIds?: string[];
    isActive: boolean;
    checKlistTemplateId?: string;
    companyId: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateTemplateRequest {
    name: string;
    description?: string;
    durationDays: number;
    departmentIds?: string[];
    tasks?: TaskTemplateItem[];
}

export interface TaskTemplateItem {
    title: string;
    description?: string;
    daysAfterStart: number;
    assigneeRole?: string;
    isRequired: boolean;
}

export interface OnboardingTemplateListResponse {
    templates: OnboardingTemplate[];
    totalCount: number;
}

// ========== Onboarding Instances ==========

export interface OnboardingInstance {
    id: string;
    templateId: string;
    templateName?: string;
    employeeId: string;
    employeeName?: string;
    status: OnboardingStatus;
    startDate: string;
    targetEndDate: string;
    actualEndDate?: string;
    progress: number;
    companyId: string;
    createdAt: string;
    updatedAt?: string;
}

export type OnboardingStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface CreateOnboardingRequest {
    templateId: string;
    employeeId: string;
    startDate: string;
}

export interface OnboardingInstanceListResponse extends PaginatedResponse<OnboardingInstance> {}

// ========== Onboarding Tasks ==========

export interface OnboardingTask {
    id: string;
    instanceId: string;
    title: string;
    description?: string;
    status: TaskStatus;
    assigneeId?: string;
    assigneeName?: string;
    dueDate: string;
    completedAt?: string;
    completedBy?: string;
    order: number;
    isRequired: boolean;
    createdAt: string;
    updatedAt?: string;
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface AssignTaskRequest {
    taskId: string;
    assigneeId: string;
}

export interface UpdateTaskStatusRequest {
    taskId: string;
    status: TaskStatus;
    notes?: string;
}

export interface TaskListResponse {
    tasks: OnboardingTask[];
    totalCount: number;
}

// ========== Documents ==========

export interface Document {
    id: string;
    title: string;
    description?: string;
    fileUrl: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    categoryId?: string;
    categoryName?: string;
    requiresAcknowledgment: boolean;
    uploadedBy: string;
    companyId: string;
    createdAt: string;
    updatedAt?: string;
}

export interface UploadDocumentRequest {
    title: string;
    description?: string;
    file: File;
    categoryId?: string;
    requiresAcknowledgment: boolean;
}

export interface DocumentListResponse {
    documents: Document[];
    totalCount: number;
}

export interface AcknowledgeDocumentRequest {
    documentId: string;
}

// ========== Surveys ==========

export interface SurveyTemplate {
    id: string;
    title: string;
    description?: string;
    type: SurveyType;
    isActive: boolean;
    companyId: string;
    createdAt: string;
    updatedAt?: string;
}

export type SurveyType = 'ONBOARDING' | 'SATISFACTION' | 'ENGAGEMENT' | 'EXIT' | 'CUSTOM';

export interface SurveyQuestion {
    id: string;
    templateId: string;
    text: string;
    type: QuestionType;
    options?: string[];
    isRequired: boolean;
    order: number;
    createdAt: string;
}

export type QuestionType = 'TEXT' | 'RATING' | 'MULTIPLE_CHOICE' | 'YES_NO' | 'SCALE';

export interface CreateSurveyTemplateRequest {
    title: string;
    description?: string;
    type: SurveyType;
    questions: CreateQuestionRequest[];
}

export interface CreateQuestionRequest {
    text: string;
    type: QuestionType;
    options?: string[];
    isRequired: boolean;
    order: number;
}

export interface SurveyInstance {
    id: string;
    templateId: string;
    templateName?: string;
    targetEmployeeId?: string;
    scheduledDate: string;
    expiryDate?: string;
    status: SurveyInstanceStatus;
    responseCount: number;
    companyId: string;
    createdAt: string;
}

export type SurveyInstanceStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED';

export interface SurveyResponse {
    id: string;
    surveyInstanceId: string;
    respondentId: string;
    respondentName?: string;
    answers: SurveyAnswer[];
    submittedAt: string;
}

export interface SurveyAnswer {
    questionId: string;
    questionText?: string;
    answerText?: string;
    answerValue?: number;
}

export interface SubmitSurveyRequest {
    surveyInstanceId: string;
    answers: {
        questionId: string;
        answerText?: string;
        answerValue?: number;
    }[];
}

export interface SurveyTemplateListResponse {
    templates: SurveyTemplate[];
    totalCount: number;
}

export interface SurveyResponseListResponse {
    responses: SurveyResponse[];
    totalCount: number;
}

// ========== Analytics ==========

export interface OnboardingSummary {
    totalOnboardings: number;
    activeOnboardings: number;
    completedOnboardings: number;
    cancelledOnboardings: number;
    averageCompletionDays: number;
    completionRate: number;
    onTimeCompletionRate: number;
}

export interface OnboardingFunnel {
    started: number;
    active: number;
    completed: number;
    cancelled: number;
}

export interface OnboardingByDepartment {
    departmentId: string;
    departmentName: string;
    totalOnboardings: number;
    completedOnboardings: number;
    completionRate: number;
    averageCompletionDays: number;
}

export interface OnboardingByDepartmentResponse {
    departments: OnboardingByDepartment[];
}

export interface TaskCompletionStats {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
    averageCompletionDays: number;
}

export interface AnalyticsDateRange {
    dateFrom?: string;
    dateTo?: string;
}

// ========== Notifications ==========

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    relatedEntityId?: string;
    relatedEntityType?: string;
    createdAt: string;
}

export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'ONBOARDING_STARTED';

export interface NotificationListResponse {
    notifications: Notification[];
    unreadCount: number;
    totalCount: number;
}

// ========== Billing (Optional) ==========

export interface Subscription {
    id: string;
    companyId: string;
    planId: string;
    planName?: string;
    status: SubscriptionStatus;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    trialEnd?: string;
    createdAt: string;
}

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

export interface BillingPlan {
    id: string;
    name: string;
    description?: string;
    priceMonthly: number;
    priceYearly?: number;
    features: string[];
    maxUsers: number;
    maxOnboardings: number;
}

export interface BillingPlanListResponse {
    plans: BillingPlan[];
}

export interface UsageTrackingRequest {
    eventType: string;
    quantity: number;
    metadata?: Record<string, any>;
}

export interface UsageSummary {
    userCount: number;
    onboardingCount: number;
    documentCount: number;
    surveyResponseCount: number;
    period: string;
}

export interface CreateSubscriptionRequest {
    planId: string;
}

// ========== AI Assistant (Optional) ==========

export interface AIAssistantRequest {
    question: string;
    context?: {
        employeeId?: string;
        onboardingId?: string;
        documentId?: string;
    };
}

export interface AIAssistantResponse {
    answer: string;
    confidence: number;
    sources?: string[];
}
