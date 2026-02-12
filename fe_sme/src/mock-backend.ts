import type {
  Acknowledgment,
  Document,
  Evaluation,
  KnowledgeBaseArticle,
  OnboardingComment,
  OnboardingInstance,
  OnboardingTemplate,
  Role,
  RoleDefinition,
  SurveyInstance,
  SurveyResponse,
  SurveyTemplate,
  TaskInstance,
  Tenant,
  User,
} from './shared/types'
import {
  acknowledgments,
  conversations,
  documents,
  financeSnapshots,
  invoices,
  knowledgeBase,
  plans,
  roles,
  surveyInstances,
  surveyResponses,
  surveyTemplates,
  taskInstances,
  templates,
  tenants,
  usage,
  users,
  instances,
  departments,
  employeeProfiles,
} from './mocks/seed'
import { demoCredentials } from './mocks/credentials'
import { createMockToken, parseMockToken } from './mocks/auth'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

const onboardingComments: OnboardingComment[] = []
const evaluations: Evaluation[] = []

const nowIso = () => new Date().toISOString()

const hasAnyRole = (rolesList: Role[], required?: Role[]) => {
  if (!required || required.length === 0) return true
  return required.some((role) => rolesList.includes(role))
}

const getToken = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('auth_token')
}

const authorize = (requiredRoles?: Role[]) => {
  const token = getToken()
  const payload = parseMockToken(token)
  if (!payload) {
    throw { status: 401, message: 'Unauthorized' }
  }
  if (!hasAnyRole(payload.roles, requiredRoles)) {
    throw { status: 403, message: 'Forbidden' }
  }
  return payload
}

const requireCompany = (companyId: string | null) => {
  if (!companyId) {
    throw { status: 403, message: 'Forbidden' }
  }
  return companyId
}

const filterByCompany = <T extends { companyId?: string | null }>(
  items: T[],
  companyId: string
) => items.filter((item) => item.companyId === companyId)

const findUserById = (id: string) => users.find((user) => user.id === id) ?? null

const parseUrl = (url: string) => url.replace(/\/+$/, '')

const match = (path: string, pattern: RegExp) => {
  const result = path.match(pattern)
  return result?.slice(1) ?? null
}

const handleAuthLogin = async (body: { email?: string; password?: string }) => {
  const matchCredentials = demoCredentials.find(
    (item) => item.email === body.email && item.password === body.password
  )
  if (!matchCredentials) {
    throw { status: 401, message: 'Invalid credentials' }
  }
  const user = users.find((item) => item.email === matchCredentials.email) ?? users[0]
  const token = createMockToken({
    user_id: user.id,
    company_id: user.companyId,
    roles: user.roles,
  })
  return { user, token }
}

const handleAuthMe = async () => {
  const payload = authorize()
  return { user: findUserById(payload.user_id) }
}

const handleTenants = async () => {
  const payload = authorize()
  if (hasAnyRole(payload.roles, ['PLATFORM_ADMIN', 'PLATFORM_MANAGER'])) {
    return tenants
  }
  const companyId = requireCompany(payload.company_id)
  return tenants.filter((tenant) => tenant.id === companyId)
}

const handleTenantPatch = async (id: string, body: Partial<Tenant>) => {
  authorize(['PLATFORM_ADMIN'])
  const index = tenants.findIndex((tenant) => tenant.id === id)
  if (index >= 0) {
    tenants[index] = { ...tenants[index], ...body }
  }
  return tenants[index]
}

const handleUsers = async () => {
  const payload = authorize(['COMPANY_ADMIN', 'HR', 'MANAGER'])
  const companyId = requireCompany(payload.company_id)
  return filterByCompany(users, companyId)
}

const handleUserInvite = async (body: Partial<User>) => {
  const payload = authorize(['COMPANY_ADMIN'])
  const companyId = requireCompany(payload.company_id)
  const next: User = {
    id: `user-${users.length + 1}`,
    name: body.name ?? 'Invited User',
    email: body.email ?? 'invite@company.com',
    roles: body.roles ?? ['EMPLOYEE'],
    companyId,
    department: body.department ?? 'HR',
    status: 'Invited',
    createdAt: nowIso().slice(0, 10),
  }
  users.unshift(next)
  return next
}

const handleUserPatch = async (id: string, body: Partial<User>) => {
  const payload = authorize(['COMPANY_ADMIN'])
  const companyId = requireCompany(payload.company_id)
  const index = users.findIndex((user) => user.id === id)
  if (index >= 0) {
    const next = { ...users[index], ...body }
    if (next.companyId !== companyId) {
      throw { status: 403, message: 'Forbidden' }
    }
    users[index] = next
  }
  return users[index]
}

const handleRoles = async () => {
  authorize(['COMPANY_ADMIN'])
  return roles.filter((role) => !role.name.startsWith('PLATFORM_'))
}

const handleRolePatch = async (id: string, body: Partial<RoleDefinition>) => {
  authorize(['COMPANY_ADMIN'])
  const index = roles.findIndex((role) => role.id === id)
  if (index >= 0) {
    roles[index] = { ...roles[index], ...body }
  }
  return roles[index]
}

const handleDepartments = async () => {
  const payload = authorize(['COMPANY_ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'])
  const companyId = requireCompany(payload.company_id)
  return filterByCompany(departments, companyId)
}

const handleEmployeeProfiles = async () => {
  const payload = authorize(['HR'])
  const companyId = requireCompany(payload.company_id)
  return filterByCompany(employeeProfiles, companyId)
}

const handleOnboardingTemplates = async () => {
  const payload = authorize(['HR', 'MANAGER'])
  const companyId = requireCompany(payload.company_id)
  return filterByCompany(templates, companyId)
}

const handleOnboardingTemplateById = async (id: string) => {
  const payload = authorize(['HR', 'MANAGER'])
  const companyId = requireCompany(payload.company_id)
  return templates.find((item) => item.id === id && item.companyId === companyId)
}

const handleOnboardingTemplatePost = async (
  body: Partial<OnboardingTemplate>
) => {
  const payload = authorize(['HR'])
  const companyId = requireCompany(payload.company_id)
  const next: OnboardingTemplate = {
    id: `template-${templates.length + 1}`,
    name: body.name ?? 'New Template',
    description: body.description ?? '',
    stages: body.stages ?? [],
    updatedAt: nowIso().slice(0, 10),
    companyId,
  }
  templates.unshift(next)
  return next
}

const handleOnboardingInstances = async () => {
  const payload = authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  const companyId = requireCompany(payload.company_id)
  return filterByCompany(instances, companyId)
}

const handleOnboardingInstanceById = async (id: string) => {
  const payload = authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  const companyId = requireCompany(payload.company_id)
  return instances.find((item) => item.id === id && item.companyId === companyId)
}

const handleOnboardingInstancePost = async (
  body: Partial<OnboardingInstance>
) => {
  const payload = authorize(['HR'])
  const companyId = requireCompany(payload.company_id)
  const next: OnboardingInstance = {
    id: `instance-${instances.length + 1}`,
    employeeId: body.employeeId ?? users[3].id,
    templateId: body.templateId ?? templates[0]?.id ?? '',
    startDate: body.startDate ?? nowIso().slice(0, 10),
    progress: body.progress ?? 0,
    status: 'Active',
    companyId,
  }
  instances.unshift(next)
  return next
}

const handleOnboardingTasks = async () => {
  const payload = authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  const companyId = requireCompany(payload.company_id)
  return filterByCompany(taskInstances, companyId)
}

const handleOnboardingTaskPost = async (body: Partial<TaskInstance>) => {
  const payload = authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  const companyId = requireCompany(payload.company_id)
  const next: TaskInstance = {
    id: `task-instance-${taskInstances.length + 1}`,
    companyId,
    onboardingInstanceId: body.onboardingInstanceId ?? '',
    taskTemplateId: body.taskTemplateId ?? '',
    assignedUserId: body.assignedUserId ?? '',
    status: body.status ?? 'Pending',
  }
  taskInstances.unshift(next)
  return next
}

const handleOnboardingComments = async () => {
  authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  return onboardingComments
}

const handleOnboardingCommentPost = async (body: Partial<OnboardingComment>) => {
  authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  const next: OnboardingComment = {
    id: `comment-${onboardingComments.length + 1}`,
    taskId: body.taskId ?? '',
    author: body.author ?? 'Unknown',
    message: body.message ?? '',
    createdAt: nowIso(),
  }
  onboardingComments.unshift(next)
  return next
}

const handleEvaluationPost = async (body: Partial<Evaluation>) => {
  authorize(['HR'])
  const next: Evaluation = {
    id: `eval-${evaluations.length + 1}`,
    employeeId: body.employeeId ?? '',
    milestone: body.milestone ?? '7',
    rating: body.rating,
    notes: body.notes,
    companyId: body.companyId ?? null,
  }
  evaluations.unshift(next)
  return next
}

const handleDocuments = async () => {
  const payload = authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  const companyId = requireCompany(payload.company_id)
  return filterByCompany(documents, companyId)
}

const handleDocumentById = async (id: string) => {
  const payload = authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  const companyId = requireCompany(payload.company_id)
  return documents.find((item) => item.id === id && item.companyId === companyId)
}

const handleDocumentPost = async (body: Partial<Document>) => {
  const payload = authorize(['HR'])
  const companyId = requireCompany(payload.company_id)
  const next: Document = {
    id: `doc-${documents.length + 1}`,
    title: body.title ?? 'New Document',
    tags: body.tags ?? [],
    required: body.required ?? false,
    updatedAt: nowIso().slice(0, 10),
    folder: body.folder ?? 'Company',
    companyId,
  }
  documents.unshift(next)
  return next
}

const handleDocumentPatch = async (id: string, body: Partial<Document>) => {
  authorize(['HR'])
  const index = documents.findIndex((item) => item.id === id)
  if (index >= 0) {
    documents[index] = { ...documents[index], ...body }
  }
  return documents[index]
}

const handleDocumentDelete = async (id: string) => {
  authorize(['HR'])
  const index = documents.findIndex((item) => item.id === id)
  if (index >= 0) {
    documents.splice(index, 1)
  }
  return { ok: true }
}

const handleDocumentAcks = async () => {
  const payload = authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  const companyId = requireCompany(payload.company_id)
  return filterByCompany(acknowledgments, companyId)
}

const handleDocumentProgress = async (
  id: string,
  body: Partial<Acknowledgment>
) => {
  const payload = authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  const companyId = requireCompany(payload.company_id)
  const ack = acknowledgments.find(
    (item) => item.documentId === id && item.companyId === companyId
  )
  if (ack) {
    ack.progress = body.progress ?? ack.progress
  }
  return ack
}

const handleDocumentAck = async (id: string) => {
  const payload = authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  const companyId = requireCompany(payload.company_id)
  const ack = acknowledgments.find(
    (item) => item.documentId === id && item.companyId === companyId
  )
  if (ack) {
    ack.acknowledged = true
    ack.timestamp = nowIso()
  }
  return ack
}

const handleSurveyTemplates = async () => {
  const payload = authorize(['HR'])
  const companyId = requireCompany(payload.company_id)
  return filterByCompany(surveyTemplates, companyId)
}

const handleSurveyTemplatePost = async (body: Partial<SurveyTemplate>) => {
  const payload = authorize(['HR'])
  const companyId = requireCompany(payload.company_id)
  const next: SurveyTemplate = {
    id: `survey-template-${surveyTemplates.length + 1}`,
    name: body.name ?? 'New Survey',
    target: body.target ?? 'custom',
    questions: body.questions ?? [],
    updatedAt: nowIso().slice(0, 10),
    companyId,
  }
  surveyTemplates.unshift(next)
  return next
}

const handleSurveyInstances = async () => {
  const payload = authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  const companyId = requireCompany(payload.company_id)
  return filterByCompany(surveyInstances, companyId)
}

const handleSurveyInstanceById = async (id: string) => {
  const payload = authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  const companyId = requireCompany(payload.company_id)
  return surveyInstances.find(
    (item) => item.id === id && item.companyId === companyId
  )
}

const handleSurveyInstancePost = async (body: Partial<SurveyInstance>) => {
  const payload = authorize(['HR'])
  const companyId = requireCompany(payload.company_id)
  const next: SurveyInstance = {
    id: `survey-${surveyInstances.length + 1}`,
    employeeId: body.employeeId ?? users[3].id,
    templateId: body.templateId ?? surveyTemplates[0]?.id ?? '',
    dueDate: body.dueDate ?? nowIso().slice(0, 10),
    status: 'Pending',
    companyId,
    targetResponderType: body.targetResponderType,
  }
  surveyInstances.unshift(next)
  return next
}

const handleSurveyInstancePatch = async (id: string, body: Partial<SurveyInstance>) => {
  authorize(['HR'])
  const index = surveyInstances.findIndex((item) => item.id === id)
  if (index >= 0) {
    surveyInstances[index] = { ...surveyInstances[index], ...body }
  }
  return surveyInstances[index]
}

const handleSurveyInstanceDelete = async (id: string) => {
  authorize(['HR'])
  const index = surveyInstances.findIndex((item) => item.id === id)
  if (index >= 0) {
    surveyInstances.splice(index, 1)
  }
  return { ok: true }
}

const handleSurveyResponsePost = async (body: Partial<SurveyResponse>) => {
  authorize(['MANAGER', 'EMPLOYEE'])
  const next: SurveyResponse = {
    id: `response-${surveyResponses.length + 1}`,
    surveyId: body.surveyId ?? '',
    answers: body.answers ?? {},
  }
  surveyResponses.unshift(next)
  return next
}

const handleChatbotQuery = async (body: { query?: string }) => {
  authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  return {
    answer: `Here's what I found about "${body.query ?? ''}": review the onboarding policy and employee handbook.`,
    sources: [
      { title: 'Employee Handbook', snippet: 'Guidance on access, benefits, and company policies.' },
      { title: 'Security & Access', snippet: 'Badge and device setup instructions.' },
      { title: 'Manager Checklist', snippet: 'Week one success steps for managers.' },
    ],
  }
}

const handleChatbotConversations = async () => {
  authorize(['HR', 'MANAGER', 'EMPLOYEE'])
  return conversations
}

const handlePlans = async () => {
  authorize(['COMPANY_ADMIN'])
  return plans
}

const handleSubscription = async () => {
  authorize(['COMPANY_ADMIN'])
  const current = plans.find((plan) => plan.current)
  return { planId: current?.id ?? plans[0]?.id ?? '' }
}

const handleSubscriptionPatch = async () => {
  authorize(['COMPANY_ADMIN'])
  return { ok: true }
}

const handleUsage = async () => {
  authorize(['COMPANY_ADMIN'])
  return usage
}

const handleInvoices = async () => {
  const payload = authorize(['COMPANY_ADMIN'])
  const companyId = requireCompany(payload.company_id)
  return filterByCompany(invoices, companyId)
}

const handlePaymentConnect = async () => {
  authorize(['COMPANY_ADMIN'])
  return { ok: true }
}

const handleSaTenants = async () => {
  authorize(['PLATFORM_ADMIN', 'PLATFORM_MANAGER'])
  return tenants
}

const handleSaFinance = async () => {
  authorize(['PLATFORM_ADMIN', 'PLATFORM_MANAGER'])
  return financeSnapshots
}

const handleKnowledgeBase = async () => {
  const payload = authorize(['HR'])
  const companyId = requireCompany(payload.company_id)
  return filterByCompany(knowledgeBase, companyId)
}

const handleKnowledgeBasePost = async (body: Partial<KnowledgeBaseArticle>) => {
  const payload = authorize(['HR'])
  const companyId = requireCompany(payload.company_id)
  const next: KnowledgeBaseArticle = {
    id: `kb-${knowledgeBase.length + 1}`,
    title: body.title ?? 'New Article',
    content: body.content ?? '',
    tags: body.tags ?? [],
    companyId,
  }
  knowledgeBase.unshift(next)
  return next
}

const routes: Record<
  HttpMethod,
  Array<{
    test: RegExp
    handle: (matchGroups: string[], body?: any) => Promise<any> | any
  }>
> = {
  GET: [
    { test: /^\/api\/me$/, handle: () => handleAuthMe() },
    { test: /^\/api\/tenants$/, handle: () => handleTenants() },
    { test: /^\/api\/users$/, handle: () => handleUsers() },
    { test: /^\/api\/roles$/, handle: () => handleRoles() },
    { test: /^\/api\/departments$/, handle: () => handleDepartments() },
    { test: /^\/api\/employees$/, handle: () => handleEmployeeProfiles() },
    { test: /^\/api\/onboarding\/templates$/, handle: () => handleOnboardingTemplates() },
    {
      test: /^\/api\/onboarding\/templates\/([^/]+)$/,
      handle: ([id]) => handleOnboardingTemplateById(id),
    },
    { test: /^\/api\/onboarding\/instances$/, handle: () => handleOnboardingInstances() },
    {
      test: /^\/api\/onboarding\/instances\/([^/]+)$/,
      handle: ([id]) => handleOnboardingInstanceById(id),
    },
    { test: /^\/api\/onboarding\/tasks$/, handle: () => handleOnboardingTasks() },
    { test: /^\/api\/onboarding\/comments$/, handle: () => handleOnboardingComments() },
    { test: /^\/api\/documents$/, handle: () => handleDocuments() },
    {
      test: /^\/api\/documents\/([^/]+)$/,
      handle: ([id]) => handleDocumentById(id),
    },
    {
      test: /^\/api\/documents\/acknowledgments$/,
      handle: () => handleDocumentAcks(),
    },
    { test: /^\/api\/survey-templates$/, handle: () => handleSurveyTemplates() },
    { test: /^\/api\/survey-instances$/, handle: () => handleSurveyInstances() },
    {
      test: /^\/api\/survey-instances\/([^/]+)$/,
      handle: ([id]) => handleSurveyInstanceById(id),
    },
    { test: /^\/api\/plans$/, handle: () => handlePlans() },
    { test: /^\/api\/subscription$/, handle: () => handleSubscription() },
    { test: /^\/api\/usage$/, handle: () => handleUsage() },
    { test: /^\/api\/invoices$/, handle: () => handleInvoices() },
    { test: /^\/api\/sa\/tenants$/, handle: () => handleSaTenants() },
    { test: /^\/api\/sa\/finance$/, handle: () => handleSaFinance() },
    { test: /^\/api\/knowledge-base$/, handle: () => handleKnowledgeBase() },
    { test: /^\/api\/chatbot\/conversations$/, handle: () => handleChatbotConversations() },
  ],
  POST: [
    { test: /^\/api\/login$/, handle: (_m, body) => handleAuthLogin(body ?? {}) },
    { test: /^\/api\/logout$/, handle: () => ({ ok: true }) },
    { test: /^\/api\/users\/invite$/, handle: (_m, body) => handleUserInvite(body ?? {}) },
    { test: /^\/api\/onboarding\/templates$/, handle: (_m, body) => handleOnboardingTemplatePost(body ?? {}) },
    { test: /^\/api\/onboarding\/instances$/, handle: (_m, body) => handleOnboardingInstancePost(body ?? {}) },
    { test: /^\/api\/onboarding\/tasks$/, handle: (_m, body) => handleOnboardingTaskPost(body ?? {}) },
    { test: /^\/api\/onboarding\/comments$/, handle: (_m, body) => handleOnboardingCommentPost(body ?? {}) },
    { test: /^\/api\/onboarding\/evaluations$/, handle: (_m, body) => handleEvaluationPost(body ?? {}) },
    { test: /^\/api\/documents$/, handle: (_m, body) => handleDocumentPost(body ?? {}) },
    {
      test: /^\/api\/documents\/([^/]+)\/progress$/,
      handle: ([id], body) => handleDocumentProgress(id, body ?? {}),
    },
    {
      test: /^\/api\/documents\/([^/]+)\/ack$/,
      handle: ([id]) => handleDocumentAck(id),
    },
    { test: /^\/api\/survey-templates$/, handle: (_m, body) => handleSurveyTemplatePost(body ?? {}) },
    { test: /^\/api\/survey-instances$/, handle: (_m, body) => handleSurveyInstancePost(body ?? {}) },
    { test: /^\/api\/survey-responses$/, handle: (_m, body) => handleSurveyResponsePost(body ?? {}) },
    { test: /^\/api\/chatbot\/query$/, handle: (_m, body) => handleChatbotQuery(body ?? {}) },
    { test: /^\/api\/payment\/connect$/, handle: () => handlePaymentConnect() },
    { test: /^\/api\/knowledge-base$/, handle: (_m, body) => handleKnowledgeBasePost(body ?? {}) },
  ],
  PATCH: [
    { test: /^\/api\/tenants\/([^/]+)$/, handle: ([id], body) => handleTenantPatch(id, body ?? {}) },
    { test: /^\/api\/users\/([^/]+)$/, handle: ([id], body) => handleUserPatch(id, body ?? {}) },
    { test: /^\/api\/roles\/([^/]+)$/, handle: ([id], body) => handleRolePatch(id, body ?? {}) },
    { test: /^\/api\/documents\/([^/]+)$/, handle: ([id], body) => handleDocumentPatch(id, body ?? {}) },
    { test: /^\/api\/survey-instances\/([^/]+)$/, handle: ([id], body) => handleSurveyInstancePatch(id, body ?? {}) },
    { test: /^\/api\/subscription$/, handle: () => handleSubscriptionPatch() },
  ],
  DELETE: [
    { test: /^\/api\/documents\/([^/]+)$/, handle: ([id]) => handleDocumentDelete(id) },
    { test: /^\/api\/survey-instances\/([^/]+)$/, handle: ([id]) => handleSurveyInstanceDelete(id) },
  ],
}

const route = async (method: HttpMethod, url: string, body?: any) => {
  const path = parseUrl(url)
  const matchRoute = routes[method].find((routeEntry) => routeEntry.test.test(path))
  if (!matchRoute) {
    throw { status: 404, message: 'Not found' }
  }
  const groups = match(path, matchRoute.test) ?? []
  return matchRoute.handle(groups, body)
}

const respond = async <T>(handler: () => Promise<T> | T) => {
  try {
    return await handler()
  } catch (error: any) {
    return Promise.reject({
      status: error?.status ?? 500,
      message: error?.message ?? 'Server error',
    })
  }
}

export const api = {
  get: (url: string) => respond(() => route('GET', url)),
  post: (url: string, body?: any) => respond(() => route('POST', url, body)),
  patch: (url: string, body?: any) =>
    respond(() =>
      body?._method === 'DELETE' ? route('DELETE', url) : route('PATCH', url, body)
    ),
}
