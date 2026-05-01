import { http, HttpResponse } from "msw";
import {
  acknowledgments,
  conversations,
  documents,
  financeSnapshots,
  invoices,
  knowledgeBase,
  paymentProviders,
  paymentTransactions,
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
} from "./seed";
import { demoCredentials } from "./credentials";
import { createMockToken, parseMockToken } from "./auth";
import type {
  Acknowledgment,
  Document,
  KnowledgeBaseArticle,
  OnboardingInstance,
  OnboardingTemplate,
  RoleDefinition,
  SurveyInstance,
  SurveyResponse,
  SurveyTemplate,
  User,
  Role,
  AuthTokenPayload,
} from "../shared/types";

// ── Gateway-format in-memory stores ─────────────────────────────────────────
// These mirror backend response shapes used by the gateway pattern.

export interface GwDepartment {
  departmentId: string;
  name: string;
  type: string | null;
  managerUserId: string | null;
}

export interface GwUser {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  departmentId: string | null;
  departmentName: string;
  status: "ACTIVE" | "INVITED" | "DISABLED";
  phone: string | null;
  managerUserId: string | null;
  jobTitle: string | null;
  workLocation: string | null;
  startDate: string | null;
  employeeId: string | null;
  employeeCode: string | null;
  employeeName: string | null;
  employeeEmail: string | null;
  employeePhone: string | null;
  employeeStatus: string | null;
  createdAt: string;
}

export const gwDepartments: GwDepartment[] = [
  {
    departmentId: "dept-hr",
    name: "Human Resources",
    type: "HR",
    managerUserId: "gw-user-kk",
  },
  {
    departmentId: "dept-eng",
    name: "Engineering",
    type: "IT",
    managerUserId: "gw-user-2",
  },
];

export const gwUsers: GwUser[] = [
  {
    userId: "gw-user-kk",
    email: "kk@gmail.com",
    fullName: "KK HR Manager",
    roles: ["HR"],
    departmentId: "dept-hr",
    departmentName: "Human Resources",
    status: "ACTIVE",
    phone: null,
    managerUserId: null,
    jobTitle: "HR Manager",
    workLocation: "Hanoi",
    startDate: "2024-01-01",
    employeeId: "emp-kk",
    employeeCode: "KK001",
    employeeName: "KK HR Manager",
    employeeEmail: "kk@gmail.com",
    employeePhone: null,
    employeeStatus: "ACTIVE",
    createdAt: "2024-01-01",
  },
  {
    userId: "gw-user-2",
    email: "john.doe@company.com",
    fullName: "John Doe",
    roles: ["MANAGER"],
    departmentId: "dept-eng",
    departmentName: "Engineering",
    status: "ACTIVE",
    phone: null,
    managerUserId: null,
    jobTitle: "Engineering Manager",
    workLocation: "HCM",
    startDate: "2024-02-01",
    employeeId: "emp-2",
    employeeCode: "ENG001",
    employeeName: "John Doe",
    employeeEmail: "john.doe@company.com",
    employeePhone: null,
    employeeStatus: "ACTIVE",
    createdAt: "2024-02-01",
  },
  {
    userId: "gw-user-3",
    email: "jane.smith@company.com",
    fullName: "Jane Smith",
    roles: ["EMPLOYEE"],
    departmentId: "dept-eng",
    departmentName: "Engineering",
    status: "ACTIVE",
    phone: null,
    managerUserId: "gw-user-2",
    jobTitle: "Software Engineer",
    workLocation: "HCM",
    startDate: "2024-03-01",
    employeeId: "emp-3",
    employeeCode: "ENG002",
    employeeName: "Jane Smith",
    employeeEmail: "jane.smith@company.com",
    employeePhone: null,
    employeeStatus: "ACTIVE",
    createdAt: "2024-03-01",
  },
  {
    userId: "gw-user-4",
    email: "bob.lee@company.com",
    fullName: "Bob Lee",
    roles: ["IT"],
    departmentId: "dept-eng",
    departmentName: "Engineering",
    status: "INVITED",
    phone: null,
    managerUserId: "gw-user-2",
    jobTitle: "IT Engineer",
    workLocation: "Hanoi",
    startDate: null,
    employeeId: "emp-4",
    employeeCode: "IT001",
    employeeName: "Bob Lee",
    employeeEmail: "bob.lee@company.com",
    employeePhone: null,
    employeeStatus: "INVITED",
    createdAt: "2024-04-01",
  },
];

const hasAnyRole = (rolesList: Role[], required?: Role[]) => {
  if (!required || required.length === 0) {
    return true;
  }
  return required.some((role) => rolesList.includes(role));
};

const authorize = (
  request: Request,
  requiredRoles?: Role[],
): AuthTokenPayload | HttpResponse<{ message: string }> => {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "") ?? null;
  const payload = parseMockToken(token);
  if (!payload) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!hasAnyRole(payload.roles, requiredRoles)) {
    return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return payload;
};

const requireCompany = (
  payload: AuthTokenPayload,
): string | HttpResponse<{ message: string }> => {
  if (!payload.company_id) {
    return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  return payload.company_id;
};

const filterByCompany = <T extends { companyId?: string | null }>(
  items: T[],
  companyId: string,
) => items.filter((item) => item.companyId === companyId);

export const handlers = [
  http.post("/api/login", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const match = demoCredentials.find(
      (item) => item.email === body.email && item.password === body.password,
    );
    if (!match) {
      return HttpResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }
    const user = users.find((item) => item.email === match.email) ?? users[0];
    const token = createMockToken({
      user_id: user.id,
      company_id: user.companyId,
      roles: user.roles,
    });
    return HttpResponse.json({
      user,
      token,
    });
  }),
  http.post("/api/logout", () => HttpResponse.json({ ok: true })),
  http.get("/api/me", ({ request }) => {
    const auth = authorize(request);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const user = users.find((item) => item.id === auth.user_id) ?? null;
    return HttpResponse.json({ user });
  }),

  http.get("/api/tenants", ({ request }) => {
    const auth = authorize(request);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    if (hasAnyRole(auth.roles, ["ADMIN"])) {
      return HttpResponse.json(tenants);
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    return HttpResponse.json(
      tenants.filter((tenant) => tenant.id === companyId),
    );
  }),
  http.patch("/api/tenants/:id", async ({ params, request }) => {
    const auth = authorize(request, ["ADMIN"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const body = (await request.json()) as Partial<(typeof tenants)[number]>;
    const index = tenants.findIndex((tenant) => tenant.id === params.id);
    if (index >= 0) {
      tenants[index] = { ...tenants[index], ...body };
    }
    return HttpResponse.json(tenants[index]);
  }),

  http.get("/api/users", ({ request }) => {
    const auth = authorize(request, ["HR", "IT", "MANAGER"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    return HttpResponse.json(filterByCompany(users, companyId));
  }),
  http.post("/api/users/invite", async ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const body = (await request.json()) as Partial<User>;
    const next: User = {
      id: `user-${users.length + 1}`,
      name: body.name ?? "Invited User",
      email: body.email ?? "invite@company.com",
      roles: body.roles ?? ["EMPLOYEE"],
      companyId,
      department: body.department ?? "HR",
      departmentId: null,
      status: "Invited",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    users.unshift(next);
    return HttpResponse.json(next);
  }),
  http.patch("/api/users/:id", async ({ params, request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const body = (await request.json()) as Partial<User>;
    const index = users.findIndex((user) => user.id === params.id);
    if (index >= 0) {
      const next = { ...users[index], ...body };
      if (next.companyId !== companyId) {
        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      users[index] = next;
    }
    return HttpResponse.json(users[index]);
  }),

  http.get("/api/roles", ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    return HttpResponse.json(
      roles.filter((role) => role.name !== "ADMIN" && role.name !== "STAFF"),
    );
  }),
  http.patch("/api/roles/:id", async ({ params, request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const body = (await request.json()) as Partial<RoleDefinition>;
    const index = roles.findIndex((role) => role.id === params.id);
    if (index >= 0) {
      roles[index] = { ...roles[index], ...body };
    }
    return HttpResponse.json(roles[index]);
  }),

  http.get("/api/onboarding/templates", ({ request }) => {
    const auth = authorize(request, ["HR", "MANAGER"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    return HttpResponse.json(filterByCompany(templates, companyId));
  }),
  http.get("/api/onboarding/templates/:id", ({ params, request }) => {
    const auth = authorize(request, ["HR", "MANAGER"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const id = params.id as string;
    const template = templates.find(
      (item) => item.id === id && item.companyId === companyId,
    );
    if (!template) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 });
    }
    return HttpResponse.json(template);
  }),
  http.post("/api/onboarding/templates", async ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const body = (await request.json()) as Partial<OnboardingTemplate> & {
      templateId?: string;
      checklists?: Array<{
        id?: string;
        name: string;
        stage?: string;
        tasks?: Array<{
          id?: string;
          title: string;
          ownerRefId?: string;
          dueDaysOffset?: number;
          requireAck?: boolean;
        }>;
      }>;
    };
    const templateId = body.templateId ?? body.id;
    const bodyStages =
      body.stages ??
      (body.checklists ?? []).map((c, i: number) => ({
        id: c.id ?? `stage-${i}`,
        name: c.name ?? "",
        tasks: (c.tasks ?? []).map((t, j: number) => ({
          id: t.id ?? `task-${j}`,
          title: t.title ?? "",
          ownerRole: (t.ownerRefId ?? "HR") as Role,
          dueOffset: String(t.dueDaysOffset ?? 0),
          required: t.requireAck ?? false,
        })),
      }));
    if (templateId && templateId !== "new") {
      const index = templates.findIndex(
        (t) => t.id === templateId && t.companyId === companyId,
      );
      if (index >= 0) {
        const updated: OnboardingTemplate = {
          ...templates[index],
          name: body.name ?? templates[index].name,
          description: body.description ?? templates[index].description,
          stages: bodyStages.length ? bodyStages : templates[index].stages,
          updatedAt: new Date().toISOString().slice(0, 10),
        };
        templates[index] = updated;
        return HttpResponse.json(updated);
      }
    }
    const next: OnboardingTemplate = {
      id: `template-${templates.length + 1}`,
      name: body.name ?? "New Template",
      description: body.description ?? "",
      stages: body.stages ?? [],
      updatedAt: new Date().toISOString().slice(0, 10),
      companyId,
    };
    templates.unshift(next);
    return HttpResponse.json(next);
  }),
  http.delete("/api/onboarding/templates/:id", ({ params, request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const id = params.id as string;
    const index = templates.findIndex(
      (t) => t.id === id && t.companyId === companyId,
    );
    if (index < 0) {
      return HttpResponse.json({ message: "Not found" }, { status: 404 });
    }
    templates.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get("/api/onboarding/instances", ({ request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    return HttpResponse.json(filterByCompany(instances, companyId));
  }),
  http.get("/api/onboarding/instances/:id", ({ params, request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const instance = instances.find(
      (item) => item.id === params.id && item.companyId === companyId,
    );
    return HttpResponse.json(instance);
  }),
  http.post("/api/onboarding/instances", async ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const body = (await request.json()) as Partial<OnboardingInstance>;
    const next: OnboardingInstance = {
      id: `instance-${instances.length + 1}`,
      employeeId: body.employeeId ?? users[3].id,
      templateId: body.templateId ?? templates[0].id,
      startDate: body.startDate ?? new Date().toISOString().slice(0, 10),
      progress: body.progress ?? 0,
      status: "ACTIVE",
      companyId,
    };
    instances.unshift(next);
    return HttpResponse.json(next);
  }),
  http.get("/api/onboarding/tasks", ({ request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    return HttpResponse.json(filterByCompany(taskInstances, companyId));
  }),
  http.post("/api/onboarding/tasks", async ({ request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const body = await request.json();
    return HttpResponse.json(body);
  }),
  http.get("/api/onboarding/comments", ({ request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    return HttpResponse.json([]);
  }),
  http.post("/api/onboarding/comments", async ({ request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const body = await request.json();
    return HttpResponse.json(body);
  }),
  http.post("/api/onboarding/evaluations", async ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const body = await request.json();
    return HttpResponse.json(body);
  }),

  http.get("/api/documents", ({ request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    return HttpResponse.json(filterByCompany(documents, companyId));
  }),
  http.get("/api/documents/:id", ({ params, request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const doc = documents.find(
      (item) => item.id === params.id && item.companyId === companyId,
    );
    return HttpResponse.json(doc);
  }),
  http.post("/api/documents", async ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const body = (await request.json()) as Partial<Document>;
    const next: Document = {
      id: `doc-${documents.length + 1}`,
      title: body.title ?? "New Document",
      tags: body.tags ?? [],
      required: body.required ?? false,
      updatedAt: new Date().toISOString().slice(0, 10),
      folder: body.folder ?? "Company",
      companyId,
    };
    documents.unshift(next);
    return HttpResponse.json(next);
  }),
  http.patch("/api/documents/:id", async ({ params, request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const body = (await request.json()) as Partial<Document>;
    const index = documents.findIndex((item) => item.id === params.id);
    if (index >= 0) {
      documents[index] = { ...documents[index], ...body };
    }
    return HttpResponse.json(documents[index]);
  }),
  http.delete("/api/documents/:id", ({ params, request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const index = documents.findIndex((item) => item.id === params.id);
    if (index >= 0) {
      documents.splice(index, 1);
    }
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/documents/acknowledgments", ({ request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    return HttpResponse.json(filterByCompany(acknowledgments, companyId));
  }),
  http.post("/api/documents/:id/progress", async ({ params, request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const body = (await request.json()) as Partial<Acknowledgment>;
    const ack = acknowledgments.find((item) => item.documentId === params.id);
    if (ack) {
      ack.progress = body.progress ?? ack.progress;
    }
    return HttpResponse.json(ack);
  }),
  http.post("/api/documents/:id/ack", ({ params, request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const ack = acknowledgments.find((item) => item.documentId === params.id);
    if (ack) {
      ack.acknowledged = true;
      ack.timestamp = new Date().toISOString();
    }
    return HttpResponse.json(ack);
  }),

  http.get("/api/survey-templates", ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    return HttpResponse.json(filterByCompany(surveyTemplates, companyId));
  }),
  http.post("/api/survey-templates", async ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const body = (await request.json()) as Partial<SurveyTemplate>;
    const next: SurveyTemplate = {
      id: `survey-template-${surveyTemplates.length + 1}`,
      name: body.name ?? "New Survey",
      target: body.target ?? "custom",
      questions: body.questions ?? [],
      updatedAt: new Date().toISOString().slice(0, 10),
      companyId,
    };
    surveyTemplates.unshift(next);
    return HttpResponse.json(next);
  }),
  http.get("/api/survey-instances", ({ request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    return HttpResponse.json(filterByCompany(surveyInstances, companyId));
  }),
  http.get("/api/survey-instances/:id", ({ params, request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const instance = surveyInstances.find(
      (item) => item.id === params.id && item.companyId === companyId,
    );
    return HttpResponse.json(instance);
  }),
  http.post("/api/survey-instances", async ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const body = (await request.json()) as Partial<SurveyInstance>;
    const next: SurveyInstance = {
      id: `survey-${surveyInstances.length + 1}`,
      employeeId: body.employeeId ?? users[3].id,
      templateId: body.templateId ?? surveyTemplates[0].id,
      dueDate: body.dueDate ?? new Date().toISOString().slice(0, 10),
      status: "Pending",
      companyId,
    };
    surveyInstances.unshift(next);
    return HttpResponse.json(next);
  }),
  http.patch("/api/survey-instances/:id", async ({ params, request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const body = (await request.json()) as Partial<SurveyInstance>;
    const index = surveyInstances.findIndex(
      (item) => item.id === params.id && item.companyId === companyId,
    );
    if (index >= 0) {
      surveyInstances[index] = { ...surveyInstances[index], ...body };
    }
    return HttpResponse.json(surveyInstances[index]);
  }),
  http.delete("/api/survey-instances/:id", ({ params, request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const index = surveyInstances.findIndex(
      (item) => item.id === params.id && item.companyId === companyId,
    );
    if (index >= 0) {
      surveyInstances.splice(index, 1);
    }
    return HttpResponse.json({ ok: true });
  }),
  http.post("/api/survey-responses", async ({ request }) => {
    const auth = authorize(request, ["MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const body = await request.json();
    surveyResponses.unshift(body as SurveyResponse);
    return HttpResponse.json(body);
  }),

  http.post("/api/chatbot/query", async ({ request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const body = (await request.json()) as { query: string };
    return HttpResponse.json({
      answer: `Here's what I found about "${body.query}": review the onboarding policy and employee handbook.`,
      sources: [
        {
          title: "Employee Handbook",
          snippet: "Guidance on access, benefits, and company policies.",
        },
        {
          title: "Security & Access",
          snippet: "Badge and device setup instructions.",
        },
        {
          title: "Manager Checklist",
          snippet: "Week one success steps for managers.",
        },
      ],
    });
  }),

  http.get("/api/plans", ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    return HttpResponse.json(plans);
  }),
  http.get("/api/subscription", ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    return HttpResponse.json({ planId: "plan-pro" });
  }),
  http.patch("/api/subscription", ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/usage", ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    return HttpResponse.json(usage);
  }),
  http.get("/api/invoices", ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    return HttpResponse.json(filterByCompany(invoices, companyId));
  }),
  http.post("/api/payment/connect", ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    return HttpResponse.json({ ok: true });
  }),
  http.get("/api/payment/providers", ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    return HttpResponse.json(paymentProviders);
  }),
  http.post("/api/payment/create-intent", async ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const body = (await request.json()) as { invoiceId: string };
    const invoice = invoices.find((inv) => inv.id === body.invoiceId);
    const amount = invoice
      ? parseFloat(invoice.amount.replace(/[^0-9.]/g, "")) * 100
      : 12900;
    return HttpResponse.json({
      id: `pi_mock_${Date.now()}`,
      clientSecret: `pi_mock_${Date.now()}_secret_mock`,
      amount,
      currency: "usd",
      status: "requires_payment_method",
      invoiceId: body.invoiceId,
    });
  }),
  http.get("/api/payment/status/:id", ({ params, request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    return HttpResponse.json({
      id: params.id,
      clientSecret: "",
      amount: 12900,
      currency: "usd",
      status: "succeeded",
      invoiceId: "INV-2025-102",
    });
  }),
  http.get("/api/payment/transactions", ({ request }) => {
    const auth = authorize(request, ["STAFF", "ADMIN"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    return HttpResponse.json(paymentTransactions);
  }),

  http.get("/api/sa/tenants", ({ request }) => {
    const auth = authorize(request, ["ADMIN"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    return HttpResponse.json(tenants);
  }),
  http.get("/api/sa/finance", ({ request }) => {
    const auth = authorize(request, ["ADMIN"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    return HttpResponse.json(financeSnapshots);
  }),

  http.get("/api/knowledge-base", ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    return HttpResponse.json(filterByCompany(knowledgeBase, companyId));
  }),
  http.post("/api/knowledge-base", async ({ request }) => {
    const auth = authorize(request, ["HR"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    const companyId = requireCompany(auth);
    if (companyId instanceof HttpResponse) {
      return companyId;
    }
    const body = (await request.json()) as Partial<KnowledgeBaseArticle>;
    const next: KnowledgeBaseArticle = {
      id: `kb-${knowledgeBase.length + 1}`,
      title: body.title ?? "New Article",
      content: body.content ?? "",
      tags: body.tags ?? [],
      companyId,
    };
    knowledgeBase.unshift(next);
    return HttpResponse.json(next);
  }),

  http.get("/api/chatbot/conversations", ({ request }) => {
    const auth = authorize(request, ["HR", "MANAGER", "EMPLOYEE"]);
    if (auth instanceof HttpResponse) {
      return auth;
    }
    return HttpResponse.json(conversations);
  }),

  // ── Gateway (com.sme.*) ─────────────────────────────────────────────────────
  // Catch-all handler for the gateway endpoint. Routes by operationType.
  http.post("/api/v1/gateway", async ({ request }) => {
    const body = (await request.json()) as {
      operationType?: string;
      payload?: Record<string, unknown>;
      [key: string]: unknown;
    };
    const op = body.operationType;
    const payload = (body.payload ?? body) as Record<string, unknown>;

    // ── Billing ──────────────────────────────────────────────────────────────
    if (op === "com.sme.billing.payment.status") {
      return HttpResponse.json({
        data: { status: "PAID", invoiceId: payload?.invoiceId },
      });
    }

    // ── Auth: login ──────────────────────────────────────────────────────────
    if (op === "com.sme.identity.auth.login") {
      const { email, password } = payload as {
        email?: string;
        password?: string;
      };
      const match = demoCredentials.find(
        (c) => c.email === email && c.password === password,
      );
      if (!match) {
        return HttpResponse.json(
          { message: "Invalid credentials" },
          { status: 401 },
        );
      }
      const gwUser = gwUsers.find((u) => u.email === email);
      const roleCode = gwUser?.roles[0] ?? "EMPLOYEE";
      const token = createMockToken({
        user_id: gwUser?.userId ?? "gw-user-kk",
        company_id: "1",
        roles: (gwUser?.roles ?? ["HR"]) as Role[],
      });
      return HttpResponse.json({
        data: {
          accessToken: token,
          tokenType: "Bearer",
          expiresInSeconds: 3600,
          user: {
            id: gwUser?.userId ?? "gw-user-kk",
            fullName: gwUser?.fullName ?? email,
            email,
            roleCode,
            tenantId: "1",
          },
        },
      });
    }

    // ── Department: list ─────────────────────────────────────────────────────
    if (op === "com.sme.company.department.list") {
      return HttpResponse.json({ data: { items: gwDepartments } });
    }

    // ── Department: create ────────────────────────────────────────────────────
    if (op === "com.sme.company.department.create") {
      const { name, type, managerId } = payload as {
        name?: string;
        type?: string;
        managerId?: string;
      };
      const newDept: GwDepartment = {
        departmentId: `dept-${Date.now()}`,
        name: name ?? "New Department",
        type: type ?? null,
        managerUserId: managerId ?? null,
      };
      gwDepartments.push(newDept);
      return HttpResponse.json({
        data: { departmentId: newDept.departmentId, name: newDept.name },
      });
    }

    // ── Department: update (org) ──────────────────────────────────────────────
    if (
      op === "com.sme.org.department.update" ||
      op === "com.sme.company.department.update"
    ) {
      const { departmentId, name, type, managerUserId } = payload as {
        departmentId?: string;
        name?: string;
        type?: string;
        managerUserId?: string;
      };
      const idx = gwDepartments.findIndex(
        (d) => d.departmentId === departmentId,
      );
      if (idx >= 0) {
        if (name !== undefined) gwDepartments[idx].name = name;
        if (type !== undefined) gwDepartments[idx].type = type;
        if (managerUserId !== undefined)
          gwDepartments[idx].managerUserId = managerUserId ?? null;
      }
      const dept = gwDepartments[idx];
      return HttpResponse.json({
        data: { departmentId: dept?.departmentId, name: dept?.name },
      });
    }

    // ── User: list ────────────────────────────────────────────────────────────
    if (op === "com.sme.identity.user.list") {
      return HttpResponse.json({ data: { users: gwUsers } });
    }

    // ── User: get by id ───────────────────────────────────────────────────────
    if (op === "com.sme.identity.user.get") {
      const { userId } = payload as { userId?: string };
      const user = gwUsers.find((u) => u.userId === userId);
      if (!user) {
        return HttpResponse.json(
          { message: "User not found" },
          { status: 404 },
        );
      }
      return HttpResponse.json({ data: user });
    }

    // ── User: create (invite) ─────────────────────────────────────────────────
    if (op === "com.sme.identity.user.create") {
      const { email, fullName, roleCode, departmentId, managerUserId } =
        payload as {
          email?: string;
          fullName?: string;
          roleCode?: string;
          departmentId?: string;
          managerUserId?: string;
        };
      const dept = gwDepartments.find((d) => d.departmentId === departmentId);
      const newUser: GwUser = {
        userId: `gw-user-${Date.now()}`,
        email: email ?? "",
        fullName: fullName ?? "",
        roles: [roleCode ?? "EMPLOYEE"],
        departmentId: departmentId ?? null,
        departmentName: dept?.name ?? "",
        status: "INVITED",
        phone: null,
        managerUserId: managerUserId ?? null,
        jobTitle: null,
        workLocation: null,
        startDate: null,
        employeeId: null,
        employeeCode: null,
        employeeName: fullName ?? null,
        employeeEmail: email ?? null,
        employeePhone: null,
        employeeStatus: "INVITED",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      gwUsers.push(newUser);
      return HttpResponse.json({
        data: {
          userId: newUser.userId,
          email: newUser.email,
          fullName: newUser.fullName,
        },
      });
    }

    // ── User: update ──────────────────────────────────────────────────────────
    if (op === "com.sme.identity.user.update") {
      const {
        userId,
        fullName,
        departmentId,
        managerUserId,
        status,
        phone,
        jobTitle,
        workLocation,
        startDate,
      } = payload as {
        userId?: string;
        fullName?: string;
        departmentId?: string;
        managerUserId?: string;
        status?: string;
        phone?: string;
        jobTitle?: string;
        workLocation?: string;
        startDate?: string;
      };
      const idx = gwUsers.findIndex((u) => u.userId === userId);
      if (idx >= 0) {
        if (fullName) gwUsers[idx].fullName = fullName;
        if (departmentId !== undefined) {
          gwUsers[idx].departmentId = departmentId ?? null;
          const dept = gwDepartments.find(
            (d) => d.departmentId === departmentId,
          );
          gwUsers[idx].departmentName = dept?.name ?? "";
        }
        if (managerUserId !== undefined)
          gwUsers[idx].managerUserId = managerUserId ?? null;
        if (status === "ACTIVE") gwUsers[idx].status = "ACTIVE";
        if (phone !== undefined) gwUsers[idx].phone = phone ?? null;
        if (jobTitle !== undefined) gwUsers[idx].jobTitle = jobTitle ?? null;
        if (workLocation !== undefined)
          gwUsers[idx].workLocation = workLocation ?? null;
        if (startDate !== undefined) gwUsers[idx].startDate = startDate ?? null;
      }
      return HttpResponse.json({ data: {} });
    }

    // ── User: disable ─────────────────────────────────────────────────────────
    if (op === "com.sme.identity.user.disable") {
      const { userId } = payload as { userId?: string };
      const idx = gwUsers.findIndex((u) => u.userId === userId);
      if (idx >= 0) gwUsers[idx].status = "DISABLED";
      return HttpResponse.json({ data: {} });
    }

    // ── Role: assign ──────────────────────────────────────────────────────────
    if (op === "com.sme.identity.role.assign") {
      const { userId, roleCode } = payload as {
        userId?: string;
        roleCode?: string;
      };
      const idx = gwUsers.findIndex((u) => u.userId === userId);
      if (idx >= 0 && roleCode) {
        if (!gwUsers[idx].roles.includes(roleCode)) {
          gwUsers[idx].roles = [...gwUsers[idx].roles, roleCode];
        }
      }
      return HttpResponse.json({ data: {} });
    }

    // ── Role: revoke ──────────────────────────────────────────────────────────
    if (op === "com.sme.identity.role.revoke") {
      const { userId, roleCode } = payload as {
        userId?: string;
        roleCode?: string;
      };
      const idx = gwUsers.findIndex((u) => u.userId === userId);
      if (idx >= 0 && roleCode) {
        gwUsers[idx].roles = gwUsers[idx].roles.filter((r) => r !== roleCode);
        if (gwUsers[idx].roles.length === 0) gwUsers[idx].roles = ["EMPLOYEE"];
      }
      return HttpResponse.json({ data: {} });
    }

    // ── User: bulk create ─────────────────────────────────────────────────────
    if (
      op === "com.sme.identity.user.bulkCreate" ||
      op === "com.sme.identity.user.bulk_create"
    ) {
      const { users: rows } = payload as {
        users?: Array<{
          email?: string;
          fullName?: string;
          roleCode?: string;
          departmentId?: string;
        }>;
      };
      const results = (rows ?? []).map((row, index) => {
        if (!row.email || !row.fullName) {
          return {
            index,
            success: false,
            message: "email and fullName are required",
          };
        }
        const dept = gwDepartments.find(
          (d) => d.departmentId === row.departmentId,
        );
        const newUser: GwUser = {
          userId: `gw-bulk-${Date.now()}-${index}`,
          email: row.email,
          fullName: row.fullName,
          roles: [row.roleCode ?? "EMPLOYEE"],
          departmentId: row.departmentId ?? null,
          departmentName: dept?.name ?? "",
          status: "INVITED",
          phone: null,
          managerUserId: null,
          jobTitle: null,
          workLocation: null,
          startDate: null,
          employeeId: null,
          employeeCode: null,
          employeeName: row.fullName,
          employeeEmail: row.email,
          employeePhone: null,
          employeeStatus: "INVITED",
          createdAt: new Date().toISOString().slice(0, 10),
        };
        gwUsers.push(newUser);
        return { index, success: true, userId: newUser.userId };
      });
      const successCount = results.filter((r) => r.success).length;
      return HttpResponse.json({
        data: {
          results,
          successCount,
          failedCount: results.length - successCount,
        },
      });
    }

    // ── Onboarding Template: list ──────────────────────────────────────────
    if (op === "com.sme.onboarding.template.list") {
      const { status, search, level } = payload as {
        status?: string;
        search?: string;
        level?: "TENANT" | "PLATFORM";
      };
      let result = [...templates];
      const normalizedLevel = (level ?? "TENANT").toUpperCase();
      if (normalizedLevel === "TENANT" || normalizedLevel === "PLATFORM") {
        result = result.filter(
          (t) => ((t.level ?? "TENANT").toUpperCase()) === normalizedLevel,
        );
      }
      if (status) {
        result = result.filter(
          (t) => (t.status ?? "ACTIVE").toUpperCase() === status.toUpperCase(),
        );
      }
      if (search) {
        const q = search.toLowerCase();
        result = result.filter((t) => t.name.toLowerCase().includes(q));
      }
      return HttpResponse.json({
        data: {
          templates: result.map((template) => ({
            ...template,
            checklistCount: template.checklistCount ?? template.stages.length,
            taskCount:
              template.taskCount ??
              template.stages.reduce(
                (sum, stage) => sum + (stage.tasks?.length ?? 0),
                0,
              ),
            level: template.level ?? "TENANT",
            templateKind: template.templateKind ?? "ONBOARDING",
          })),
        },
      });
    }

    // ── Onboarding Template: get ───────────────────────────────────────────
    if (op === "com.sme.onboarding.template.get") {
      const { templateId } = payload as { templateId?: string };
      const tmpl = templates.find((t) => t.id === templateId);
      if (!tmpl) {
        return HttpResponse.json(
          { message: "Template not found" },
          { status: 404 },
        );
      }
      return HttpResponse.json({ data: tmpl });
    }

    // ── Onboarding Template: create ────────────────────────────────────────
    if (op === "com.sme.onboarding.template.create") {
      const { name, description, checklists } = payload as {
        name?: string;
        description?: string;
        checklists?: Array<{ name: string; stage?: string; tasks?: unknown[] }>;
      };
      const newTemplate: OnboardingTemplate = {
        id: `template-${Date.now()}`,
        name: name ?? "New Template",
        description: description ?? "",
        stages: (checklists ?? []).map((c, i) => ({
          id: `stage-${i}`,
          name: c.name ?? "",
          tasks: [],
        })),
        status: "ACTIVE",
        level: "TENANT",
        templateKind: "ONBOARDING",
        updatedAt: new Date().toISOString().slice(0, 10),
        companyId: "1",
      };
      templates.unshift(newTemplate);
      return HttpResponse.json({
        data: { templateId: newTemplate.id, name: newTemplate.name },
      });
    }

    // ── Onboarding Template: update ────────────────────────────────────────
    if (op === "com.sme.onboarding.template.update") {
      const { templateId, name, description, status } = payload as {
        templateId?: string;
        name?: string;
        description?: string;
        status?: string;
      };
      const idx = templates.findIndex((t) => t.id === templateId);
      if (idx >= 0) {
        if (name !== undefined) templates[idx].name = name;
        if (description !== undefined) templates[idx].description = description;
        if (status !== undefined)
          templates[idx].status = status as "ACTIVE" | "INACTIVE";
        templates[idx].updatedAt = new Date().toISOString().slice(0, 10);
      }
      return HttpResponse.json({ data: { templateId } });
    }

    // ── Onboarding Template: AI generate ──────────────────────────────────
    if (op === "com.sme.onboarding.template.ai.generate") {
      const { industry, companySize, jobRole } = payload as {
        industry?: string;
        companySize?: string;
        jobRole?: string;
      };
      const generatedTemplate: OnboardingTemplate = {
        id: `template-ai-${Date.now()}`,
        name: `${jobRole ?? "New Role"} Onboarding`,
        description: `AI-generated onboarding for ${jobRole ?? "new role"} in the ${industry ?? "industry"} sector.`,
        stages: [
          {
            id: "ai-stage-pre",
            name: "Pre-boarding",
            stageType: "PRE_BOARDING",
            tasks: [
              {
                id: "ai-task-1",
                title: "Send welcome package",
                ownerRole: "HR",
                dueOffset: "0",
                required: true,
              },
            ],
          },
          {
            id: "ai-stage-day1",
            name: "Day 1",
            stageType: "DAY_1",
            tasks: [
              {
                id: "ai-task-2",
                title: "Team introduction meeting",
                ownerRole: "MANAGER",
                dueOffset: "1",
                required: true,
              },
              {
                id: "ai-task-3",
                title: "Setup workstation",
                ownerRole: "IT",
                dueOffset: "1",
                required: true,
              },
            ],
          },
          {
            id: "ai-stage-week1",
            name: "Week 1",
            stageType: "DAY_7",
            tasks: [
              {
                id: "ai-task-4",
                title: "Complete role-specific training",
                ownerRole: "EMPLOYEE",
                dueOffset: "7",
                required: true,
              },
            ],
          },
        ],
        status: "ACTIVE",
        level: "TENANT",
        templateKind: "ONBOARDING",
        updatedAt: new Date().toISOString().slice(0, 10),
        companyId: "1",
      };
      templates.unshift(generatedTemplate);
      return HttpResponse.json({
        data: {
          templateId: generatedTemplate.id,
          name: generatedTemplate.name,
          totalChecklists: generatedTemplate.stages.length,
          totalTasks: generatedTemplate.stages.reduce(
            (sum, s) => sum + (s.tasks?.length ?? 0),
            0,
          ),
          companySize,
        },
      });
    }

    // Default: return empty success for unknown operations
    return HttpResponse.json({ data: {} });
  }),
];
