import type {
  Acknowledgment,
  BillingPlan,
  ChatConversation,
  DiscountCode,
  Document,
  DocumentAccessRule,
  DocumentCategory,
  DocumentVersion,
  EmailLog,
  EmployeeProfile,
  FinanceSnapshot,
  Invoice,
  KbArticleTag,
  KnowledgeBaseArticle,
  Notification,
  OnboardingInstance,
  OnboardingTemplate,
  RoleDefinition,
  SurveyInstance,
  SurveyResponse,
  SurveyTemplate,
  TaskInstance,
  TaskTemplate,
  Tenant,
  UsageMetric,
  User,
  AutomationRule,
  ChecklistTemplate,
  ChecklistInstance,
  Department,
  Tag,
} from '../shared/types'

const companyId = '1'

export const departments: Department[] = [
  { id: 'dept-hr', companyId, name: 'HR' },
  { id: 'dept-eng', companyId, name: 'Engineering' },
]

export const tenants: Tenant[] = [
  {
    id: companyId,
    name: 'Acme Co',
    industry: 'SaaS',
    size: '50-100',
    plan: 'Pro',
  },
]

export const users: User[] = [
  {
    id: 'user-1',
    name: 'Alicia Nguyen',
    email: 'admin@acme.com',
    roles: ['COMPANY_ADMIN'],
    companyId,
    department: 'HR',
    status: 'Active',
    createdAt: '2025-01-05',
  },
  {
    id: 'user-2',
    name: 'Huy Tran',
    email: 'hr@acme.com',
    roles: ['HR'],
    companyId,
    department: 'HR',
    status: 'Active',
    createdAt: '2025-01-06',
  },
  {
    id: 'user-3',
    name: 'Minh Pham',
    email: 'manager@acme.com',
    roles: ['MANAGER'],
    companyId,
    department: 'Engineering',
    status: 'Active',
    createdAt: '2025-01-08',
  },
  {
    id: 'user-4',
    name: 'Linh Do',
    email: 'employee@acme.com',
    roles: ['EMPLOYEE'],
    companyId,
    department: 'Engineering',
    status: 'Active',
    manager: 'Minh Pham',
    createdAt: '2025-01-12',
  },
  {
    id: 'user-5',
    name: 'Platform Admin',
    email: 'platform_admin@demo.com',
    roles: ['PLATFORM_ADMIN'],
    companyId: null,
    department: 'Platform Ops',
    status: 'Active',
    createdAt: '2024-12-01',
  },
  {
    id: 'user-6',
    name: 'Platform Manager',
    email: 'platform_manager@demo.com',
    roles: ['PLATFORM_MANAGER'],
    companyId: null,
    department: 'Platform Ops',
    status: 'Active',
    createdAt: '2024-12-05',
  },
  {
    id: 'user-7',
    name: 'Platform Staff',
    email: 'platform_staff@demo.com',
    roles: ['PLATFORM_STAFF'],
    companyId: null,
    department: 'Platform Ops',
    status: 'Active',
    createdAt: '2024-12-06',
  },
]

export const employeeProfiles: EmployeeProfile[] = [
  {
    id: 'emp-1',
    userId: 'user-4',
    companyId,
    departmentId: 'dept-eng',
    managerUserId: 'user-3',
    title: 'Frontend Engineer',
    startDate: '2025-01-15',
  },
]

export const roles: RoleDefinition[] = [
  {
    id: 'role-company-admin',
    name: 'COMPANY_ADMIN',
    permissions: ['manage_departments', 'manage_users', 'manage_roles', 'view_company_billing'],
  },
  {
    id: 'role-hr',
    name: 'HR',
    permissions: [
      'manage_employee_profiles',
      'manage_onboarding_templates',
      'create_onboarding_instances',
      'assign_tasks',
      'track_onboarding_progress',
      'manage_automation',
      'manage_surveys',
      'view_survey_analytics',
      'manage_documents',
      'manage_kb',
    ],
  },
  {
    id: 'role-manager',
    name: 'MANAGER',
    permissions: [
      'view_team_onboarding',
      'update_assigned_tasks',
      'comment_tasks',
      'upload_attachments',
      'answer_surveys',
      'view_documents',
    ],
  },
  {
    id: 'role-employee',
    name: 'EMPLOYEE',
    permissions: [
      'view_my_onboarding',
      'update_task_status',
      'upload_attachments',
      'comment_tasks',
      'answer_surveys',
      'view_documents',
    ],
  },
  {
    id: 'role-platform-admin',
    name: 'PLATFORM_ADMIN',
    permissions: [
      'manage_tenants',
      'manage_plans',
      'manage_subscriptions',
      'manage_invoices',
      'manage_payments',
      'manage_dunning',
      'manage_discounts',
      'view_usage',
      'view_finance',
      'view_email_logs',
    ],
  },
  {
    id: 'role-platform-manager',
    name: 'PLATFORM_MANAGER',
    permissions: ['view_usage', 'view_finance', 'view_tenant_health'],
  },
  {
    id: 'role-platform-staff',
    name: 'PLATFORM_STAFF',
    permissions: ['support_lookup_invoices', 'support_lookup_payments', 'view_email_logs'],
  },
]

export const taskTemplates: TaskTemplate[] = [
  {
    id: 'task-template-1',
    companyId,
    title: 'Collect signed offer letter',
    ownerRole: 'HR',
    dueOffset: 'Day 1',
  },
  {
    id: 'task-template-2',
    companyId,
    title: 'Provision accounts and access',
    ownerRole: 'HR',
    dueOffset: 'Day 1',
  },
  {
    id: 'task-template-3',
    companyId,
    title: 'Schedule manager intro',
    ownerRole: 'MANAGER',
    dueOffset: 'Day 2',
  },
  {
    id: 'task-template-4',
    companyId,
    title: 'Complete role expectations brief',
    ownerRole: 'MANAGER',
    dueOffset: 'Day 3',
  },
  {
    id: 'task-template-5',
    companyId,
    title: 'Finish security training',
    ownerRole: 'EMPLOYEE',
    dueOffset: 'Day 3',
  },
  {
    id: 'task-template-6',
    companyId,
    title: 'Submit workstation request',
    ownerRole: 'EMPLOYEE',
    dueOffset: 'Day 4',
  },
]

export const checklistTemplates: ChecklistTemplate[] = [
  {
    id: 'checklist-template-1',
    companyId,
    name: 'Week 1 Essentials',
    description: 'Critical steps to complete in the first week.',
  },
]

export const templates: OnboardingTemplate[] = [
  {
    id: 'template-1',
    name: 'Acme New Hire Journey',
    description: 'Standard onboarding for new hires at Acme Co.',
    updatedAt: '2025-01-20',
    companyId,
    stages: [
      {
        id: 'stage-1',
        name: 'Welcome',
        tasks: [
          {
            id: 'task-1',
            title: 'Collect signed offer letter',
            ownerRole: 'HR',
            dueOffset: 'Day 1',
            required: true,
          },
          {
            id: 'task-2',
            title: 'Provision accounts and access',
            ownerRole: 'HR',
            dueOffset: 'Day 1',
            required: true,
          },
        ],
      },
      {
        id: 'stage-2',
        name: 'Team setup',
        tasks: [
          {
            id: 'task-3',
            title: 'Schedule manager intro',
            ownerRole: 'MANAGER',
            dueOffset: 'Day 2',
            required: true,
          },
          {
            id: 'task-4',
            title: 'Complete role expectations brief',
            ownerRole: 'MANAGER',
            dueOffset: 'Day 3',
            required: true,
          },
        ],
      },
      {
        id: 'stage-3',
        name: 'First week',
        tasks: [
          {
            id: 'task-5',
            title: 'Finish security training',
            ownerRole: 'EMPLOYEE',
            dueOffset: 'Day 3',
            required: true,
          },
          {
            id: 'task-6',
            title: 'Submit workstation request',
            ownerRole: 'EMPLOYEE',
            dueOffset: 'Day 4',
            required: true,
          },
        ],
      },
    ],
  },
]

export const instances: OnboardingInstance[] = [
  {
    id: 'instance-1',
    employeeId: 'user-4',
    templateId: 'template-1',
    startDate: '2025-01-15',
    progress: 35,
    status: 'Active',
    companyId,
  },
]

export const checklistInstances: ChecklistInstance[] = [
  {
    id: 'checklist-instance-1',
    companyId,
    onboardingInstanceId: 'instance-1',
    checklistTemplateId: 'checklist-template-1',
    status: 'In Progress',
  },
]

export const taskInstances: TaskInstance[] = [
  {
    id: 'task-instance-1',
    companyId,
    onboardingInstanceId: 'instance-1',
    taskTemplateId: 'task-template-1',
    assignedUserId: 'user-2',
    status: 'In Progress',
  },
  {
    id: 'task-instance-2',
    companyId,
    onboardingInstanceId: 'instance-1',
    taskTemplateId: 'task-template-2',
    assignedUserId: 'user-2',
    status: 'Pending',
  },
  {
    id: 'task-instance-3',
    companyId,
    onboardingInstanceId: 'instance-1',
    taskTemplateId: 'task-template-3',
    assignedUserId: 'user-3',
    status: 'Pending',
  },
  {
    id: 'task-instance-4',
    companyId,
    onboardingInstanceId: 'instance-1',
    taskTemplateId: 'task-template-4',
    assignedUserId: 'user-3',
    status: 'Pending',
  },
  {
    id: 'task-instance-5',
    companyId,
    onboardingInstanceId: 'instance-1',
    taskTemplateId: 'task-template-5',
    assignedUserId: 'user-4',
    status: 'In Progress',
  },
  {
    id: 'task-instance-6',
    companyId,
    onboardingInstanceId: 'instance-1',
    taskTemplateId: 'task-template-6',
    assignedUserId: 'user-4',
    status: 'Pending',
  },
]

export const automationRules: AutomationRule[] = [
  {
    id: 'auto-1',
    companyId,
    name: 'Day 1 welcome email',
    trigger: 'onboarding_started',
    channel: 'email',
    enabled: true,
  },
]

export const documents: Document[] = [
  {
    id: 'doc-1',
    title: 'Employee Handbook',
    tags: ['Policy', 'Required'],
    required: true,
    updatedAt: '2025-01-10',
    folder: 'Company',
    companyId,
  },
  {
    id: 'doc-2',
    title: 'Engineering Playbook',
    tags: ['Guide'],
    required: false,
    updatedAt: '2025-01-12',
    folder: 'Department',
    companyId,
  },
]

export const documentCategories: DocumentCategory[] = [
  { id: 'doc-cat-1', companyId, name: 'Company Policies' },
]

export const documentVersions: DocumentVersion[] = [
  { id: 'doc-ver-1', documentId: 'doc-1', version: 'v1.0', createdAt: '2025-01-10' },
]

export const documentAccessRules: DocumentAccessRule[] = [
  { id: 'doc-access-1', documentId: 'doc-1', role: 'EMPLOYEE' },
  { id: 'doc-access-2', documentId: 'doc-2', role: 'MANAGER' },
]

export const acknowledgments: Acknowledgment[] = [
  {
    id: 'ack-1',
    documentId: 'doc-1',
    employeeId: 'user-4',
    progress: 100,
    acknowledged: true,
    timestamp: '2025-01-16T09:15:00Z',
    companyId,
  },
]

export const surveyTemplates: SurveyTemplate[] = [
  {
    id: 'survey-template-7d',
    name: '7-Day Check-in',
    target: '7',
    updatedAt: '2025-01-18',
    companyId,
    questions: [
      { id: 'q1', type: 'rating', label: 'How supported do you feel?' },
      { id: 'q2', type: 'text', label: 'What would help you ramp faster?' },
    ],
  },
  {
    id: 'survey-template-30d',
    name: '30-Day Review',
    target: '30',
    updatedAt: '2025-01-19',
    companyId,
    questions: [
      { id: 'q3', type: 'rating', label: 'Confidence in your role?' },
      {
        id: 'q4',
        type: 'multiple',
        label: 'Most helpful resource',
        options: ['Manager', 'Docs', 'Buddy'],
      },
    ],
  },
]

export const surveyInstances: SurveyInstance[] = [
  {
    id: 'survey-1',
    employeeId: 'user-4',
    templateId: 'survey-template-7d',
    dueDate: '2025-01-22',
    status: 'Pending',
    companyId,
    targetResponderType: 'EMPLOYEE',
  },
  {
    id: 'survey-2',
    employeeId: 'user-3',
    templateId: 'survey-template-30d',
    dueDate: '2025-01-30',
    status: 'Pending',
    companyId,
    targetResponderType: 'MANAGER',
  },
]

export const surveyResponses: SurveyResponse[] = [
  {
    id: 'response-1',
    surveyId: 'survey-1',
    answers: { q1: 4, q2: 'More pairing time.' },
  },
]

export const knowledgeBase: KnowledgeBaseArticle[] = [
  {
    id: 'kb-1',
    title: 'Onboarding Essentials',
    content: 'Key steps to ensure a smooth first week.',
    tags: ['Onboarding', 'Policy'],
    companyId,
  },
  {
    id: 'kb-2',
    title: 'Manager Checklists',
    content: 'Guidance for leading new hires.',
    tags: ['Manager', 'How-to'],
    companyId,
  },
]

export const kbTags: Tag[] = [
  { id: 'tag-1', name: 'Onboarding' },
  { id: 'tag-2', name: 'Policy' },
  { id: 'tag-3', name: 'Manager' },
]

export const kbArticleTags: KbArticleTag[] = [
  { id: 'kb-tag-1', articleId: 'kb-1', tagId: 'tag-1' },
  { id: 'kb-tag-2', articleId: 'kb-1', tagId: 'tag-2' },
  { id: 'kb-tag-3', articleId: 'kb-2', tagId: 'tag-3' },
]

export const emailLogs: EmailLog[] = [
  {
    id: 'email-1',
    companyId,
    subject: 'Welcome to Acme Co',
    status: 'Sent',
    sentAt: '2025-01-15T08:30:00Z',
  },
  {
    id: 'email-2',
    companyId,
    subject: 'Day 7 Check-in Survey',
    status: 'Failed',
    sentAt: '2025-01-22T09:00:00Z',
  },
]

export const notifications: Notification[] = [
  {
    id: 'notif-1',
    companyId,
    title: 'Survey assigned',
    body: 'Complete your Day 7 check-in survey.',
    createdAt: '2025-01-22T10:00:00Z',
  },
]

export const plans: BillingPlan[] = [
  {
    id: 'plan-basic',
    name: 'Basic',
    price: '$49',
    limits: 'Up to 50 employees',
    features: ['Core onboarding', 'Email reminders', 'Docs library'],
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    price: '$129',
    limits: 'Up to 200 employees',
    features: ['Advanced automation', 'Survey analytics', 'Chatbot'],
    current: true,
  },
  {
    id: 'plan-business',
    name: 'Business',
    price: '$299',
    limits: 'Up to 500 employees',
    features: ['Multi-tenant insights', 'Custom templates', 'Priority SLA'],
  },
]

export const usage: UsageMetric[] = [
  { label: 'Active onboardings', used: 12, limit: 50 },
  { label: 'Survey sends', used: 34, limit: 200 },
  { label: 'Document storage (GB)', used: 12, limit: 50 },
]

export const invoices: Invoice[] = [
  { id: 'INV-2025-101', amount: '$129', status: 'Paid', date: '2025-01-05', companyId },
  { id: 'INV-2025-102', amount: '$129', status: 'Open', date: '2025-02-05', companyId },
]

export const discountCodes: DiscountCode[] = [
  { id: 'disc-1', code: 'WELCOME15', amount: '15%', status: 'Active' },
  { id: 'disc-2', code: 'YEARLY25', amount: '25%', status: 'Active' },
]

export const financeSnapshots: FinanceSnapshot[] = [
  { month: 'Sep', mrr: 180, churn: 3 },
  { month: 'Oct', mrr: 200, churn: 2.6 },
  { month: 'Nov', mrr: 220, churn: 2.8 },
  { month: 'Dec', mrr: 240, churn: 2.3 },
  { month: 'Jan', mrr: 260, churn: 2.1 },
]

export const conversations: ChatConversation[] = [
  {
    id: 'chat-1',
    title: 'Welcome questions',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        content: 'Where do I find the badge policy?',
        timestamp: '09:10',
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        content: 'The badge policy is in the Employee Handbook.',
        timestamp: '09:11',
      },
    ],
  },
]
