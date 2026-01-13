import type {
  Acknowledgment,
  BillingPlan,
  ChatConversation,
  DiscountCode,
  Document,
  Evaluation,
  FinanceSnapshot,
  Invoice,
  KnowledgeBaseArticle,
  OnboardingInstance,
  OnboardingTemplate,
  RoleDefinition,
  SurveyInstance,
  SurveyResponse,
  SurveyTemplate,
  Tenant,
  UsageMetric,
  User,
} from '../shared/types'

export const departments = ['People Ops', 'Engineering', 'Sales', 'Marketing']

export const tenants: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Northwind Logistics',
    industry: 'Logistics',
    size: '250-500',
    plan: 'Business',
  },
  {
    id: 'tenant-2',
    name: 'BluePeak Retail',
    industry: 'Retail',
    size: '100-250',
    plan: 'Pro',
  },
]

export const users: User[] = [
  {
    id: 'user-1',
    name: 'Ariana Chen',
    email: 'ariana@northwind.com',
    role: 'HR Admin',
    department: 'People Ops',
    status: 'Active',
    createdAt: '2025-01-03',
  },
  {
    id: 'user-2',
    name: 'Marco Silva',
    email: 'marco@northwind.com',
    role: 'Manager',
    department: 'Engineering',
    status: 'Active',
    createdAt: '2025-01-08',
  },
  {
    id: 'user-3',
    name: 'Leah Porter',
    email: 'leah@northwind.com',
    role: 'Employee',
    department: 'Sales',
    status: 'Active',
    createdAt: '2025-01-18',
  },
  {
    id: 'user-4',
    name: 'Sanjay Gupta',
    email: 'sanjay@northwind.com',
    role: 'Manager',
    department: 'Marketing',
    status: 'Active',
    createdAt: '2024-12-22',
  },
  {
    id: 'user-5',
    name: 'Talia Morris',
    email: 'talia@northwind.com',
    role: 'Employee',
    department: 'Engineering',
    status: 'Invited',
    createdAt: '2025-01-21',
  },
  {
    id: 'user-6',
    name: 'Evan Cole',
    email: 'evan@northwind.com',
    role: 'Employee',
    department: 'Marketing',
    status: 'Active',
    createdAt: '2025-01-12',
  },
  {
    id: 'user-7',
    name: 'Rhea Das',
    email: 'rhea@bluepeak.com',
    role: 'HR Admin',
    department: 'People Ops',
    status: 'Active',
    createdAt: '2025-01-05',
  },
  {
    id: 'user-8',
    name: 'Samir Patel',
    email: 'samir@bluepeak.com',
    role: 'Manager',
    department: 'Sales',
    status: 'Active',
    createdAt: '2025-01-10',
  },
  {
    id: 'user-9',
    name: 'Jin Park',
    email: 'jin@bluepeak.com',
    role: 'Employee',
    department: 'Engineering',
    status: 'Active',
    createdAt: '2025-01-11',
  },
  {
    id: 'user-10',
    name: 'Mara Olsen',
    email: 'mara@bluepeak.com',
    role: 'Employee',
    department: 'Sales',
    status: 'Invited',
    createdAt: '2025-01-20',
  },
  {
    id: 'user-11',
    name: 'Olive Tran',
    email: 'olive@bluepeak.com',
    role: 'Employee',
    department: 'Marketing',
    status: 'Active',
    createdAt: '2025-01-22',
  },
  {
    id: 'user-12',
    name: 'Super Admin',
    email: 'admin@sme-onboard.com',
    role: 'Super Admin',
    department: 'People Ops',
    status: 'Active',
    createdAt: '2024-12-01',
  },
]

export const roles: RoleDefinition[] = [
  {
    id: 'role-1',
    name: 'HR Admin',
    permissions: ['manage_users', 'manage_templates', 'view_reports'],
  },
  {
    id: 'role-2',
    name: 'Manager',
    permissions: ['assign_tasks', 'review_evaluations'],
  },
  {
    id: 'role-3',
    name: 'Employee',
    permissions: ['complete_tasks', 'submit_surveys'],
  },
  {
    id: 'role-4',
    name: 'Super Admin',
    permissions: ['manage_tenants', 'view_finance'],
  },
]

export const templates: OnboardingTemplate[] = [
  {
    id: 'template-1',
    name: 'Operations Essentials',
    description: 'Core onboarding for operations hires.',
    updatedAt: '2025-01-22',
    stages: [
      {
        id: 'stage-1',
        name: 'Welcome',
        tasks: [
          {
            id: 'task-1',
            title: 'Complete HR paperwork',
            ownerRole: 'HR Admin',
            dueOffset: 'Day 1',
            required: true,
          },
          {
            id: 'task-2',
            title: 'Team introductions',
            ownerRole: 'Manager',
            dueOffset: 'Day 1',
            required: true,
          },
        ],
      },
      {
        id: 'stage-2',
        name: 'Systems',
        tasks: [
          {
            id: 'task-3',
            title: 'Access warehouse dashboard',
            ownerRole: 'Employee',
            dueOffset: 'Day 3',
            required: true,
          },
          {
            id: 'task-4',
            title: 'Safety walkthrough',
            ownerRole: 'Manager',
            dueOffset: 'Day 5',
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: 'template-2',
    name: 'Sales Acceleration',
    description: 'Ramp plan for revenue teams.',
    updatedAt: '2025-01-18',
    stages: [
      {
        id: 'stage-3',
        name: 'Day One',
        tasks: [
          {
            id: 'task-5',
            title: 'CRM orientation',
            ownerRole: 'Manager',
            dueOffset: 'Day 1',
            required: true,
          },
          {
            id: 'task-6',
            title: 'Shadow top rep',
            ownerRole: 'Employee',
            dueOffset: 'Day 3',
            required: false,
          },
        ],
      },
    ],
  },
  {
    id: 'template-3',
    name: 'Engineering Launch',
    description: 'Technical onboarding for engineers.',
    updatedAt: '2025-01-12',
    stages: [
      {
        id: 'stage-4',
        name: 'Environment',
        tasks: [
          {
            id: 'task-7',
            title: 'Setup dev environment',
            ownerRole: 'Employee',
            dueOffset: 'Day 2',
            required: true,
          },
          {
            id: 'task-8',
            title: 'Security training',
            ownerRole: 'HR Admin',
            dueOffset: 'Day 4',
            required: true,
          },
        ],
      },
    ],
  },
  {
    id: 'template-4',
    name: 'Retail Floor Ready',
    description: 'In-store onboarding for frontline teams.',
    updatedAt: '2025-01-05',
    stages: [
      {
        id: 'stage-5',
        name: 'Store tour',
        tasks: [
          {
            id: 'task-9',
            title: 'Shadow shift',
            ownerRole: 'Manager',
            dueOffset: 'Day 1',
            required: true,
          },
          {
            id: 'task-10',
            title: 'POS training',
            ownerRole: 'Employee',
            dueOffset: 'Day 2',
            required: true,
          },
        ],
      },
    ],
  },
]

export const instances: OnboardingInstance[] = Array.from({ length: 10 }).map(
  (_, index) => ({
    id: `instance-${index + 1}`,
    employeeId: users[(index % 6) + 2].id,
    templateId: templates[index % templates.length].id,
    startDate: `2025-01-${10 + index}`,
    progress: 40 + (index % 5) * 10,
    status: 'Active',
  })
)

export const evaluations: Evaluation[] = [
  { id: 'eval-1', employeeId: 'user-3', milestone: '7', rating: 4 },
  { id: 'eval-2', employeeId: 'user-3', milestone: '30', rating: 5 },
]

export const documents: Document[] = Array.from({ length: 12 }).map(
  (_, index) => ({
    id: `doc-${index + 1}`,
    title: `Policy Document ${index + 1}`,
    tags: ['HR', index % 2 === 0 ? 'Required' : 'Guide'],
    required: index % 3 === 0,
    updatedAt: `2025-01-${index + 5}`,
    folder: index % 2 === 0 ? 'Company' : 'Department',
  })
)

export const acknowledgments: Acknowledgment[] = Array.from({ length: 20 }).map(
  (_, index) => ({
    id: `ack-${index + 1}`,
    documentId: documents[index % documents.length].id,
    employeeId: users[(index % 6) + 2].id,
    progress: 40 + (index % 5) * 10,
    acknowledged: index % 4 === 0,
    timestamp: `2025-01-${15 + index}`,
  })
)

export const surveyTemplates: SurveyTemplate[] = [
  {
    id: 'survey-template-1',
    name: 'Day 7 Pulse',
    target: '7',
    updatedAt: '2025-01-22',
    questions: [
      { id: 'q1', type: 'rating', label: 'How supported do you feel?' },
      {
        id: 'q2',
        type: 'text',
        label: 'What would improve your onboarding?',
      },
    ],
  },
  {
    id: 'survey-template-2',
    name: 'Day 30 Check-in',
    target: '30',
    updatedAt: '2025-01-18',
    questions: [
      { id: 'q3', type: 'rating', label: 'Confidence in role?' },
      {
        id: 'q4',
        type: 'multiple',
        label: 'Most helpful resource',
        options: ['Buddy', 'Manager', 'Docs'],
      },
    ],
  },
  {
    id: 'survey-template-3',
    name: 'Custom Journey Survey',
    target: 'custom',
    updatedAt: '2025-01-10',
    questions: [
      { id: 'q5', type: 'text', label: 'One word for your week' },
    ],
  },
]

export const surveyInstances: SurveyInstance[] = Array.from({ length: 15 }).map(
  (_, index) => ({
    id: `survey-${index + 1}`,
    employeeId: users[(index % 6) + 2].id,
    templateId: surveyTemplates[index % surveyTemplates.length].id,
    dueDate: `2025-02-${(index % 20) + 1}`,
    status: index % 3 === 0 ? 'Completed' : 'Pending',
  })
)

export const surveyResponses: SurveyResponse[] = Array.from({ length: 10 }).map(
  (_, index) => ({
    id: `response-${index + 1}`,
    surveyId: surveyInstances[index].id,
    answers: {
      q1: 4,
      q2: 'More buddy check-ins',
    },
  })
)

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
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    price: 'Custom',
    limits: 'Unlimited employees',
    features: ['Dedicated support', 'SSO', 'Finance exports'],
  },
]

export const usage: UsageMetric[] = [
  { label: 'Active onboardings', used: 86, limit: 120 },
  { label: 'Survey sends', used: 240, limit: 500 },
  { label: 'Document storage (GB)', used: 58, limit: 100 },
]

export const invoices: Invoice[] = Array.from({ length: 12 }).map((_, index) => ({
  id: `INV-2025-${100 + index}`,
  amount: `$${120 + index * 10}`,
  status: index % 4 === 0 ? 'Overdue' : index % 3 === 0 ? 'Open' : 'Paid',
  date: `2025-${(index % 12) + 1}-05`,
}))

export const knowledgeBase: KnowledgeBaseArticle[] = Array.from({ length: 6 }).map(
  (_, index) => ({
    id: `kb-${index + 1}`,
    title: `Onboarding Playbook ${index + 1}`,
    content: 'Curated guidance for consistent onboarding experiences.',
    tags: ['Onboarding', index % 2 === 0 ? 'Policy' : 'How-to'],
  })
)

export const conversations: ChatConversation[] = Array.from({ length: 5 }).map(
  (_, index) => ({
    id: `chat-${index + 1}`,
    title: `New hire day ${index + 1}`,
    messages: [
      {
        id: `msg-${index + 1}-1`,
        sender: 'user',
        content: 'Where do I find the badge policy?',
        timestamp: '09:10',
      },
      {
        id: `msg-${index + 1}-2`,
        sender: 'assistant',
        content: 'The badge policy is in the Security & Access folder.',
        timestamp: '09:11',
      },
    ],
  })
)

export const discountCodes: DiscountCode[] = [
  { id: 'disc-1', code: 'WELCOME15', amount: '15%', status: 'Active' },
  { id: 'disc-2', code: 'YEARLY25', amount: '25%', status: 'Active' },
  { id: 'disc-3', code: 'BETA10', amount: '10%', status: 'Expired' },
]

export const financeSnapshots: FinanceSnapshot[] = [
  { month: 'Sep', mrr: 180, churn: 3 },
  { month: 'Oct', mrr: 200, churn: 2.6 },
  { month: 'Nov', mrr: 220, churn: 2.8 },
  { month: 'Dec', mrr: 240, churn: 2.3 },
  { month: 'Jan', mrr: 260, churn: 2.1 },
]

