import { http, HttpResponse } from 'msw'
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
} from './seed'
import { demoCredentials } from './credentials'
import { createMockToken, parseMockToken } from './auth'
import type {
  Acknowledgment,
  Document,
  KnowledgeBaseArticle,
  OnboardingInstance,
  OnboardingTemplate,
  RoleDefinition,
  SurveyInstance,
  SurveyTemplate,
  User,
  Role,
  AuthTokenPayload,
} from '../shared/types'

const hasAnyRole = (rolesList: Role[], required?: Role[]) => {
  if (!required || required.length === 0) {
    return true
  }
  return required.some((role) => rolesList.includes(role))
}

const authorize = (
  request: Request,
  requiredRoles?: Role[]
): AuthTokenPayload | HttpResponse => {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? null
  const payload = parseMockToken(token)
  if (!payload) {
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  if (!hasAnyRole(payload.roles, requiredRoles)) {
    return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
  }
  return payload
}

const requireCompany = (payload: AuthTokenPayload): string | HttpResponse => {
  if (!payload.company_id) {
    return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
  }
  return payload.company_id
}

const filterByCompany = <T extends { companyId?: string | null }>(
  items: T[],
  companyId: string
) => items.filter((item) => item.companyId === companyId)

export const handlers = [
  http.post('/api/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    const match = demoCredentials.find(
      (item) => item.email === body.email && item.password === body.password
    )
    if (!match) {
      return HttpResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }
    const user = users.find((item) => item.email === match.email) ?? users[0]
    const token = createMockToken({
      user_id: user.id,
      company_id: user.companyId,
      roles: user.roles,
    })
    return HttpResponse.json({
      user,
      token,
    })
  }),
  http.post('/api/logout', () => HttpResponse.json({ ok: true })),
  http.get('/api/me', ({ request }) => {
    const auth = authorize(request)
    if (auth instanceof HttpResponse) {
      return auth
    }
    const user = users.find((item) => item.id === auth.user_id) ?? null
    return HttpResponse.json({ user })
  }),

  http.get('/api/tenants', ({ request }) => {
    const auth = authorize(request)
    if (auth instanceof HttpResponse) {
      return auth
    }
    if (hasAnyRole(auth.roles, ['PLATFORM_ADMIN', 'PLATFORM_MANAGER'])) {
      return HttpResponse.json(tenants)
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    return HttpResponse.json(tenants.filter((tenant) => tenant.id === companyId))
  }),
  http.patch('/api/tenants/:id', async ({ params, request }) => {
    const auth = authorize(request, ['PLATFORM_ADMIN'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const body = (await request.json()) as Partial<typeof tenants[number]>
    const index = tenants.findIndex((tenant) => tenant.id === params.id)
    if (index >= 0) {
      tenants[index] = { ...tenants[index], ...body }
    }
    return HttpResponse.json(tenants[index])
  }),

  http.get('/api/users', ({ request }) => {
    const auth = authorize(request, ['COMPANY_ADMIN', 'HR', 'MANAGER'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    return HttpResponse.json(filterByCompany(users, companyId))
  }),
  http.post('/api/users/invite', async ({ request }) => {
    const auth = authorize(request, ['COMPANY_ADMIN'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const body = (await request.json()) as Partial<User>
    const next: User = {
      id: `user-${users.length + 1}`,
      name: body.name ?? 'Invited User',
      email: body.email ?? 'invite@company.com',
      roles: body.roles ?? ['EMPLOYEE'],
      companyId,
      department: body.department ?? 'HR',
      status: 'Invited',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    users.unshift(next)
    return HttpResponse.json(next)
  }),
  http.patch('/api/users/:id', async ({ params, request }) => {
    const auth = authorize(request, ['COMPANY_ADMIN'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const body = (await request.json()) as Partial<User>
    const index = users.findIndex((user) => user.id === params.id)
    if (index >= 0) {
      const next = { ...users[index], ...body }
      if (next.companyId !== companyId) {
        return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
      users[index] = next
    }
    return HttpResponse.json(users[index])
  }),

  http.get('/api/roles', ({ request }) => {
    const auth = authorize(request, ['COMPANY_ADMIN'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    return HttpResponse.json(roles.filter((role) => !role.name.startsWith('PLATFORM_')))
  }),
  http.patch('/api/roles/:id', async ({ params, request }) => {
    const auth = authorize(request, ['COMPANY_ADMIN'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const body = (await request.json()) as Partial<RoleDefinition>
    const index = roles.findIndex((role) => role.id === params.id)
    if (index >= 0) {
      roles[index] = { ...roles[index], ...body }
    }
    return HttpResponse.json(roles[index])
  }),

  http.get('/api/onboarding/templates', ({ request }) => {
    const auth = authorize(request, ['HR', 'MANAGER'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    return HttpResponse.json(filterByCompany(templates, companyId))
  }),
  http.get('/api/onboarding/templates/:id', ({ params, request }) => {
    const auth = authorize(request, ['HR', 'MANAGER'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const template = templates.find(
      (item) => item.id === params.id && item.companyId === companyId
    )
    return HttpResponse.json(template)
  }),
  http.post('/api/onboarding/templates', async ({ request }) => {
    const auth = authorize(request, ['HR'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const body = (await request.json()) as Partial<OnboardingTemplate>
    const next: OnboardingTemplate = {
      id: `template-${templates.length + 1}`,
      name: body.name ?? 'New Template',
      description: body.description ?? '',
      stages: body.stages ?? [],
      updatedAt: new Date().toISOString().slice(0, 10),
      companyId,
    }
    templates.unshift(next)
    return HttpResponse.json(next)
  }),
  http.get('/api/onboarding/instances', ({ request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    return HttpResponse.json(filterByCompany(instances, companyId))
  }),
  http.get('/api/onboarding/instances/:id', ({ params, request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const instance = instances.find(
      (item) => item.id === params.id && item.companyId === companyId
    )
    return HttpResponse.json(instance)
  }),
  http.post('/api/onboarding/instances', async ({ request }) => {
    const auth = authorize(request, ['HR'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const body = (await request.json()) as Partial<OnboardingInstance>
    const next: OnboardingInstance = {
      id: `instance-${instances.length + 1}`,
      employeeId: body.employeeId ?? users[3].id,
      templateId: body.templateId ?? templates[0].id,
      startDate: body.startDate ?? new Date().toISOString().slice(0, 10),
      progress: body.progress ?? 0,
      status: 'Active',
      companyId,
    }
    instances.unshift(next)
    return HttpResponse.json(next)
  }),
  http.get('/api/onboarding/tasks', ({ request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    return HttpResponse.json(filterByCompany(taskInstances, companyId))
  }),
  http.post('/api/onboarding/tasks', async ({ request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const body = await request.json()
    return HttpResponse.json(body)
  }),
  http.get('/api/onboarding/comments', ({ request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    return HttpResponse.json([])
  }),
  http.post('/api/onboarding/comments', async ({ request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const body = await request.json()
    return HttpResponse.json(body)
  }),
  http.post('/api/onboarding/evaluations', async ({ request }) => {
    const auth = authorize(request, ['HR'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const body = await request.json()
    return HttpResponse.json(body)
  }),

  http.get('/api/documents', ({ request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    return HttpResponse.json(filterByCompany(documents, companyId))
  }),
  http.get('/api/documents/:id', ({ params, request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const doc = documents.find(
      (item) => item.id === params.id && item.companyId === companyId
    )
    return HttpResponse.json(doc)
  }),
  http.post('/api/documents', async ({ request }) => {
    const auth = authorize(request, ['HR'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const body = (await request.json()) as Partial<Document>
    const next: Document = {
      id: `doc-${documents.length + 1}`,
      title: body.title ?? 'New Document',
      tags: body.tags ?? [],
      required: body.required ?? false,
      updatedAt: new Date().toISOString().slice(0, 10),
      folder: body.folder ?? 'Company',
      companyId,
    }
    documents.unshift(next)
    return HttpResponse.json(next)
  }),
  http.patch('/api/documents/:id', async ({ params, request }) => {
    const auth = authorize(request, ['HR'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const body = (await request.json()) as Partial<Document>
    const index = documents.findIndex((item) => item.id === params.id)
    if (index >= 0) {
      documents[index] = { ...documents[index], ...body }
    }
    return HttpResponse.json(documents[index])
  }),
  http.delete('/api/documents/:id', ({ params, request }) => {
    const auth = authorize(request, ['HR'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const index = documents.findIndex((item) => item.id === params.id)
    if (index >= 0) {
      documents.splice(index, 1)
    }
    return HttpResponse.json({ ok: true })
  }),
  http.get('/api/documents/acknowledgments', ({ request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    return HttpResponse.json(filterByCompany(acknowledgments, companyId))
  }),
  http.post('/api/documents/:id/progress', async ({ params, request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const body = (await request.json()) as Partial<Acknowledgment>
    const ack = acknowledgments.find((item) => item.documentId === params.id)
    if (ack) {
      ack.progress = body.progress ?? ack.progress
    }
    return HttpResponse.json(ack)
  }),
  http.post('/api/documents/:id/ack', ({ params, request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const ack = acknowledgments.find((item) => item.documentId === params.id)
    if (ack) {
      ack.acknowledged = true
      ack.timestamp = new Date().toISOString()
    }
    return HttpResponse.json(ack)
  }),

  http.get('/api/survey-templates', ({ request }) => {
    const auth = authorize(request, ['HR'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    return HttpResponse.json(filterByCompany(surveyTemplates, companyId))
  }),
  http.post('/api/survey-templates', async ({ request }) => {
    const auth = authorize(request, ['HR'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const body = (await request.json()) as Partial<SurveyTemplate>
    const next: SurveyTemplate = {
      id: `survey-template-${surveyTemplates.length + 1}`,
      name: body.name ?? 'New Survey',
      target: body.target ?? 'custom',
      questions: body.questions ?? [],
      updatedAt: new Date().toISOString().slice(0, 10),
      companyId,
    }
    surveyTemplates.unshift(next)
    return HttpResponse.json(next)
  }),
  http.get('/api/survey-instances', ({ request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    return HttpResponse.json(filterByCompany(surveyInstances, companyId))
  }),
  http.get('/api/survey-instances/:id', ({ params, request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const instance = surveyInstances.find(
      (item) => item.id === params.id && item.companyId === companyId
    )
    return HttpResponse.json(instance)
  }),
  http.post('/api/survey-instances', async ({ request }) => {
    const auth = authorize(request, ['HR'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const body = (await request.json()) as Partial<SurveyInstance>
    const next: SurveyInstance = {
      id: `survey-${surveyInstances.length + 1}`,
      employeeId: body.employeeId ?? users[3].id,
      templateId: body.templateId ?? surveyTemplates[0].id,
      dueDate: body.dueDate ?? new Date().toISOString().slice(0, 10),
      status: 'Pending',
      companyId,
    }
    surveyInstances.unshift(next)
    return HttpResponse.json(next)
  }),
  http.patch('/api/survey-instances/:id', async ({ params, request }) => {
    const auth = authorize(request, ['HR'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const body = (await request.json()) as Partial<SurveyInstance>
    const index = surveyInstances.findIndex(
      (item) => item.id === params.id && item.companyId === companyId
    )
    if (index >= 0) {
      surveyInstances[index] = { ...surveyInstances[index], ...body }
    }
    return HttpResponse.json(surveyInstances[index])
  }),
  http.delete('/api/survey-instances/:id', ({ params, request }) => {
    const auth = authorize(request, ['HR'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const index = surveyInstances.findIndex(
      (item) => item.id === params.id && item.companyId === companyId
    )
    if (index >= 0) {
      surveyInstances.splice(index, 1)
    }
    return HttpResponse.json({ ok: true })
  }),
  http.post('/api/survey-responses', async ({ request }) => {
    const auth = authorize(request, ['MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const body = await request.json()
    surveyResponses.unshift(body)
    return HttpResponse.json(body)
  }),

  http.post('/api/chatbot/query', async ({ request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const body = (await request.json()) as { query: string }
    return HttpResponse.json({
      answer: `Here's what I found about "${body.query}": review the onboarding policy and employee handbook.`,
      sources: [
        {
          title: 'Employee Handbook',
          snippet: 'Guidance on access, benefits, and company policies.',
        },
        {
          title: 'Security & Access',
          snippet: 'Badge and device setup instructions.',
        },
        {
          title: 'Manager Checklist',
          snippet: 'Week one success steps for managers.',
        },
      ],
    })
  }),

  http.get('/api/plans', ({ request }) => {
    const auth = authorize(request, ['COMPANY_ADMIN'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    return HttpResponse.json(plans)
  }),
  http.get('/api/subscription', ({ request }) => {
    const auth = authorize(request, ['COMPANY_ADMIN'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    return HttpResponse.json({ planId: 'plan-pro' })
  }),
  http.patch('/api/subscription', ({ request }) => {
    const auth = authorize(request, ['COMPANY_ADMIN'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    return HttpResponse.json({ ok: true })
  }),
  http.get('/api/usage', ({ request }) => {
    const auth = authorize(request, ['COMPANY_ADMIN'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    return HttpResponse.json(usage)
  }),
  http.get('/api/invoices', ({ request }) => {
    const auth = authorize(request, ['COMPANY_ADMIN'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    return HttpResponse.json(filterByCompany(invoices, companyId))
  }),
  http.post('/api/payment/connect', ({ request }) => {
    const auth = authorize(request, ['COMPANY_ADMIN'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/sa/tenants', ({ request }) => {
    const auth = authorize(request, ['PLATFORM_ADMIN', 'PLATFORM_MANAGER'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    return HttpResponse.json(tenants)
  }),
  http.get('/api/sa/finance', ({ request }) => {
    const auth = authorize(request, ['PLATFORM_ADMIN', 'PLATFORM_MANAGER'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    return HttpResponse.json(financeSnapshots)
  }),

  http.get('/api/knowledge-base', ({ request }) => {
    const auth = authorize(request, ['HR'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    return HttpResponse.json(filterByCompany(knowledgeBase, companyId))
  }),
  http.post('/api/knowledge-base', async ({ request }) => {
    const auth = authorize(request, ['HR'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    const companyId = requireCompany(auth)
    if (companyId instanceof HttpResponse) {
      return companyId
    }
    const body = (await request.json()) as Partial<KnowledgeBaseArticle>
    const next: KnowledgeBaseArticle = {
      id: `kb-${knowledgeBase.length + 1}`,
      title: body.title ?? 'New Article',
      content: body.content ?? '',
      tags: body.tags ?? [],
      companyId,
    }
    knowledgeBase.unshift(next)
    return HttpResponse.json(next)
  }),

  http.get('/api/chatbot/conversations', ({ request }) => {
    const auth = authorize(request, ['HR', 'MANAGER', 'EMPLOYEE'])
    if (auth instanceof HttpResponse) {
      return auth
    }
    return HttpResponse.json(conversations)
  }),
]
