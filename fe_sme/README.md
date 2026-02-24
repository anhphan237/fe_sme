# SME-Onboard Platform (UI Demo)

A production-grade UI demo for a multi-tenant onboarding optimization SaaS. This project uses React 18 + TypeScript + Vite with TailwindCSS, React Router, TanStack Query, Zustand, MSW, and a typed mock API.

## Install & Run

```bash
npm install
npm run dev
```

## Tests

```bash
npm run test
```

## Demo Script (click-through)

1. Open `/login` and sign in as HR Admin.
2. Visit `/dashboard` to see role-based KPIs and charts.
3. Go to `/onboarding/templates` and open a template, then save.
4. Go to `/onboarding/employees` and start onboarding to jump to detail.
5. Visit `/documents` and open a document, acknowledge it.
6. Use `/surveys/send`, then `/surveys/inbox` and submit a survey.
7. Open `/chatbot`, ask a question, and inspect sources.
8. Navigate to `/billing/plan` and open the upgrade modal.
9. Switch role in the topbar to “Super Admin” and visit `/super-admin`.

## Notes
- All data is mocked via MSW (see `src/mocks`).
- Global state (current tenant, user, role) lives in Zustand.
- All models are defined in `src/shared/types`.

