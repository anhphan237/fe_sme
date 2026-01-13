import { http, HttpResponse } from 'msw'
import {
  acknowledgments,
  conversations,
  discountCodes,
  documents,
  financeSnapshots,
  invoices,
  knowledgeBase,
  plans,
  roles,
  surveyInstances,
  surveyResponses,
  surveyTemplates,
  templates,
  tenants,
  usage,
  users,
  instances,
} from './seed'
import { demoCredentials } from './credentials'
import type {
  Acknowledgment,
  DiscountCode,
  Document,
  KnowledgeBaseArticle,
  OnboardingInstance,
  OnboardingTemplate,
  RoleDefinition,
  SurveyInstance,
  SurveyTemplate,
  User,
} from '../shared/types'

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
    const user =
      users.find((item) => item.role === match.role) ??
      users.find((item) => item.email === match.email) ??
      users[0]
    return HttpResponse.json({
      user: { ...user, role: match.role },
      token: 'mock-token',
    })
  }),
  http.post('/api/logout', () => HttpResponse.json({ ok: true })),
  http.get('/api/me', () => HttpResponse.json({ user: users[0] })),

  http.get('/api/tenants', () => HttpResponse.json(tenants)),
  http.patch('/api/tenants/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<typeof tenants[number]>
    const index = tenants.findIndex((tenant) => tenant.id === params.id)
    if (index >= 0) {
      tenants[index] = { ...tenants[index], ...body }
    }
    return HttpResponse.json(tenants[index])
  }),

  http.get('/api/users', () => HttpResponse.json(users)),
  http.post('/api/users/invite', async ({ request }) => {
    const body = (await request.json()) as Partial<User>
    const next: User = {
      id: `user-${users.length + 1}`,
      name: body.name ?? 'Invited User',
      email: body.email ?? 'invite@company.com',
      role: (body.role ?? 'Employee') as User['role'],
      department: body.department ?? 'People Ops',
      status: 'Invited',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    users.unshift(next)
    return HttpResponse.json(next)
  }),
  http.patch('/api/users/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<User>
    const index = users.findIndex((user) => user.id === params.id)
    if (index >= 0) {
      users[index] = { ...users[index], ...body }
    }
    return HttpResponse.json(users[index])
  }),

  http.get('/api/roles', () => HttpResponse.json(roles)),
  http.patch('/api/roles/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<RoleDefinition>
    const index = roles.findIndex((role) => role.id === params.id)
    if (index >= 0) {
      roles[index] = { ...roles[index], ...body }
    }
    return HttpResponse.json(roles[index])
  }),

  http.get('/api/onboarding/templates', () => HttpResponse.json(templates)),
  http.get('/api/onboarding/templates/:id', ({ params }) => {
    const template = templates.find((item) => item.id === params.id)
    return HttpResponse.json(template)
  }),
  http.post('/api/onboarding/templates', async ({ request }) => {
    const body = (await request.json()) as Partial<OnboardingTemplate>
    const next: OnboardingTemplate = {
      id: `template-${templates.length + 1}`,
      name: body.name ?? 'New Template',
      description: body.description ?? '',
      stages: body.stages ?? [],
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    templates.unshift(next)
    return HttpResponse.json(next)
  }),
  http.get('/api/onboarding/instances', () => HttpResponse.json(instances)),
  http.get('/api/onboarding/instances/:id', ({ params }) => {
    const instance = instances.find((item) => item.id === params.id)
    return HttpResponse.json(instance)
  }),
  http.post('/api/onboarding/instances', async ({ request }) => {
    const body = (await request.json()) as Partial<OnboardingInstance>
    const next: OnboardingInstance = {
      id: `instance-${instances.length + 1}`,
      employeeId: body.employeeId ?? users[2].id,
      templateId: body.templateId ?? templates[0].id,
      startDate: body.startDate ?? new Date().toISOString().slice(0, 10),
      progress: body.progress ?? 0,
      status: 'Active',
    }
    instances.unshift(next)
    return HttpResponse.json(next)
  }),
  http.get('/api/onboarding/tasks', () => HttpResponse.json([])),
  http.post('/api/onboarding/tasks', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(body)
  }),
  http.get('/api/onboarding/comments', () => HttpResponse.json([])),
  http.post('/api/onboarding/comments', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(body)
  }),
  http.post('/api/onboarding/evaluations', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(body)
  }),

  http.get('/api/documents', () => HttpResponse.json(documents)),
  http.get('/api/documents/:id', ({ params }) => {
    const doc = documents.find((item) => item.id === params.id)
    return HttpResponse.json(doc)
  }),
  http.post('/api/documents', async ({ request }) => {
    const body = (await request.json()) as Partial<Document>
    const next: Document = {
      id: `doc-${documents.length + 1}`,
      title: body.title ?? 'New Document',
      tags: body.tags ?? [],
      required: body.required ?? false,
      updatedAt: new Date().toISOString().slice(0, 10),
      folder: body.folder ?? 'Company',
    }
    documents.unshift(next)
    return HttpResponse.json(next)
  }),
  http.patch('/api/documents/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Document>
    const index = documents.findIndex((item) => item.id === params.id)
    if (index >= 0) {
      documents[index] = { ...documents[index], ...body }
    }
    return HttpResponse.json(documents[index])
  }),
  http.delete('/api/documents/:id', ({ params }) => {
    const index = documents.findIndex((item) => item.id === params.id)
    if (index >= 0) {
      documents.splice(index, 1)
    }
    return HttpResponse.json({ ok: true })
  }),
  http.get('/api/documents/acknowledgments', () =>
    HttpResponse.json(acknowledgments)
  ),
  http.post('/api/documents/:id/progress', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Acknowledgment>
    const ack = acknowledgments.find((item) => item.documentId === params.id)
    if (ack) {
      ack.progress = body.progress ?? ack.progress
    }
    return HttpResponse.json(ack)
  }),
  http.post('/api/documents/:id/ack', ({ params }) => {
    const ack = acknowledgments.find((item) => item.documentId === params.id)
    if (ack) {
      ack.acknowledged = true
      ack.timestamp = new Date().toISOString()
    }
    return HttpResponse.json(ack)
  }),

  http.get('/api/survey-templates', () => HttpResponse.json(surveyTemplates)),
  http.post('/api/survey-templates', async ({ request }) => {
    const body = (await request.json()) as Partial<SurveyTemplate>
    const next: SurveyTemplate = {
      id: `survey-template-${surveyTemplates.length + 1}`,
      name: body.name ?? 'New Survey',
      target: body.target ?? 'custom',
      questions: body.questions ?? [],
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    surveyTemplates.unshift(next)
    return HttpResponse.json(next)
  }),
  http.get('/api/survey-instances', () => HttpResponse.json(surveyInstances)),
  http.get('/api/survey-instances/:id', ({ params }) => {
    const instance = surveyInstances.find((item) => item.id === params.id)
    return HttpResponse.json(instance)
  }),
  http.post('/api/survey-instances', async ({ request }) => {
    const body = (await request.json()) as Partial<SurveyInstance>
    const next: SurveyInstance = {
      id: `survey-${surveyInstances.length + 1}`,
      employeeId: body.employeeId ?? users[2].id,
      templateId: body.templateId ?? surveyTemplates[0].id,
      dueDate: body.dueDate ?? new Date().toISOString().slice(0, 10),
      status: 'Pending',
    }
    surveyInstances.unshift(next)
    return HttpResponse.json(next)
  }),
  http.patch('/api/survey-instances/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<SurveyInstance>
    const index = surveyInstances.findIndex((item) => item.id === params.id)
    if (index >= 0) {
      surveyInstances[index] = { ...surveyInstances[index], ...body }
    }
    return HttpResponse.json(surveyInstances[index])
  }),
  http.delete('/api/survey-instances/:id', ({ params }) => {
    const index = surveyInstances.findIndex((item) => item.id === params.id)
    if (index >= 0) {
      surveyInstances.splice(index, 1)
    }
    return HttpResponse.json({ ok: true })
  }),
  http.post('/api/survey-responses', async ({ request }) => {
    const body = await request.json()
    surveyResponses.unshift(body)
    return HttpResponse.json(body)
  }),

  http.post('/api/chatbot/query', async ({ request }) => {
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

  http.get('/api/plans', () => HttpResponse.json(plans)),
  http.get('/api/subscription', () => HttpResponse.json({ planId: 'plan-pro' })),
  http.patch('/api/subscription', () => HttpResponse.json({ ok: true })),
  http.get('/api/usage', () => HttpResponse.json(usage)),
  http.get('/api/invoices', () => HttpResponse.json(invoices)),
  http.post('/api/payment/connect', () => HttpResponse.json({ ok: true })),

  http.get('/api/sa/tenants', () => HttpResponse.json(tenants)),
  http.get('/api/sa/finance', () => HttpResponse.json(financeSnapshots)),
  http.get('/api/sa/discount-codes', () => HttpResponse.json(discountCodes)),
  http.post('/api/sa/discount-codes', async ({ request }) => {
    const body = (await request.json()) as Partial<DiscountCode>
    const next: DiscountCode = {
      id: `disc-${discountCodes.length + 1}`,
      code: body.code ?? 'NEWCODE',
      amount: body.amount ?? '10%',
      status: body.status ?? 'Active',
    }
    discountCodes.unshift(next)
    return HttpResponse.json(next)
  }),
  http.patch('/api/sa/discount-codes/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<DiscountCode>
    const index = discountCodes.findIndex((item) => item.id === params.id)
    if (index >= 0) {
      discountCodes[index] = { ...discountCodes[index], ...body }
    }
    return HttpResponse.json(discountCodes[index])
  }),
  http.delete('/api/sa/discount-codes/:id', ({ params }) => {
    const index = discountCodes.findIndex((item) => item.id === params.id)
    if (index >= 0) {
      discountCodes.splice(index, 1)
    }
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/knowledge-base', () => HttpResponse.json(knowledgeBase)),
  http.post('/api/knowledge-base', async ({ request }) => {
    const body = (await request.json()) as Partial<KnowledgeBaseArticle>
    const next: KnowledgeBaseArticle = {
      id: `kb-${knowledgeBase.length + 1}`,
      title: body.title ?? 'New Article',
      content: body.content ?? '',
      tags: body.tags ?? [],
    }
    knowledgeBase.unshift(next)
    return HttpResponse.json(next)
  }),

  http.get('/api/chatbot/conversations', () => HttpResponse.json(conversations)),
]

