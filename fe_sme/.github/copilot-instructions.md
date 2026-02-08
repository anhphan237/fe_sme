# SME Frontend - AI Coding Guide

## Architecture: React + TypeScript with Mock Backend Support

**CRITICAL**: This frontend can run **standalone with mock data** OR against real backend. Check environment variable `VITE_USE_IN_MEMORY_BACKEND`.

### Backend Communication Pattern

The backend uses a **Gateway API** with operation types, NOT traditional REST endpoints:

```typescript
// ✅ Correct - Gateway pattern
await axios.post("/api/v1/gateway", {
  operationType: "com.sme.company.create",
  tenantId: getCurrentTenant(),
  payload: { name: "Company A" },
});

// ❌ Wrong - Traditional REST (not used here)
await axios.post("/api/companies", { name: "Company A" });
```

### Project Structure (After Phase 2 Migration)

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (Button, Input, etc)
│   ├── common/          # Toast, Navigation, etc
│   └── core/            # DataTable, FileUpload, Modal, Form
├── hooks/               # usePrevious, useDebounce, useVisibleModal
├── i18n/                # react-intl for Vietnamese/English
├── pages/               # Page components (lazy loaded)
├── shared/
│   ├── api/             # API client + module-specific APIs
│   └── types.ts         # Shared types
├── signalR/             # Real-time communication with @microsoft/signalr
├── store/               # Zustand stores (global state)
├── types/               # TypeScript interfaces
└── utils/               # helpers, format-datetime, eventBus
```

## Critical Patterns

### 1. Dual API Client Mode

```typescript
// src/shared/api/client.ts switches between:
// - Mock backend (VITE_USE_IN_MEMORY_BACKEND=true) → uses src/mock-backend.ts
// - Real backend (false) → axios to actual API

// In development with mock:
VITE_USE_IN_MEMORY_BACKEND=true npm run dev

// Against real backend:
VITE_USE_IN_MEMORY_BACKEND=false npm run dev
```

### 2. Internationalization (i18n)

```typescript
import { useLocale } from '@/i18n/hooks'

function MyComponent() {
  const { t, locale, switchLocale } = useLocale()
  return <h1>{t('dashboard.title')}</h1>
}

// Language files: src/i18n/languages/vi-VN.json, en-US.json
```

### 3. State Management (Zustand)

```typescript
// src/store/global.store.ts
const { loading, setLoading, error, user } = useGlobalStore();
```

### 4. Real-time Updates (SignalR)

```typescript
import { useSignalR } from "@/signalR/hooks/useSignalR";

useSignalR({
  method: "hubs",
  channel: "ReceiveNotification",
  onMessage: (data) => toast.info(data.message),
});
```

### 5. Toast Notifications

```typescript
import { toast } from "@/components/common/Toast";

toast.success("Saved!");
toast.error("Failed to save");
toast.warning("Check your input");
```

## Core Components Usage

### DataTable

```typescript
import { DataTable } from '@/components/core/DataTable'

<DataTable
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' }
  ]}
  data={users}
  totalItems={100}
  currentPage={page}
  onPageChange={setPage}
  onSort={(key, dir) => handleSort(key, dir)}
/>
```

### Modal with Confirmation

```typescript
import { ConfirmModal, CONFIRM_CODE } from '@/components/core/Modal/ConfirmModal'

const confirmRef = useRef<ConfirmModalHandle>(null)

const handleDelete = async () => {
  const { code } = await confirmRef.current?.open({
    message: 'Delete this item?'
  })
  if (code === CONFIRM_CODE.CONFIRMED) {
    // proceed
  }
}

<ConfirmModal ref={confirmRef} />
```

### FileUpload

```typescript
import { FileUpload } from '@/components/core/FileUpload'

<FileUpload
  accept=".pdf,.doc,.docx"
  maxSize={10 * 1024 * 1024}
  multiple
  onUpload={async (file) => await uploadFile(file)}
/>
```

## Developer Workflows

### Quick Start

```bash
# Install dependencies
npm install

# Run with mock backend (no backend needed)
VITE_USE_IN_MEMORY_BACKEND=true npm run dev

# Run against real backend
VITE_USE_IN_MEMORY_BACKEND=false npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Environment Variables

```env
# .env.local
VITE_API_URL=http://localhost:8080
VITE_USE_IN_MEMORY_BACKEND=false  # true for mock, false for real API
```

### Adding a New Feature Module

1. **Create API client** in `src/shared/api/{module}.api.ts`:

```typescript
export async function createCompany(data: CreateCompanyRequest) {
  return axios.post("/api/v1/gateway", {
    operationType: "com.sme.company.create",
    tenantId: getCurrentTenant(),
    payload: data,
  });
}
```

2. **Create page** in `src/pages/{module}/`:

```typescript
// Lazy loaded in src/router.tsx
const CompanyList = lazy(() => import("./pages/company/List"));
```

3. **Add to router** in `src/router.tsx`:

```typescript
{
  path: '/companies',
  element: <RequireAuth><CompanyList /></RequireAuth>
}
```

4. **Add i18n keys** in language files:

```json
// src/i18n/languages/vi-VN.json
{
  "company": {
    "title": "Quản lý công ty",
    "create": "Tạo công ty mới"
  }
}
```

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** (fast dev server, HMR)
- **React Router 6** (lazy loaded routes)
- **TanStack Query** (data fetching, caching)
- **Zustand** (state management)
- **react-intl** (i18n)
- **react-hook-form** + **yup** (forms + validation)
- **Tailwind CSS** + **shadcn/ui** (styling)
- **axios** (HTTP client)
- **@microsoft/signalr** (real-time WebSocket)
- **MSW** (Mock Service Worker for testing)
- **Vitest** + **Testing Library** (testing)

## Common Gotchas

1. ❌ Don't use traditional REST endpoints - use gateway with operationType
2. ❌ Don't forget to switch `VITE_USE_IN_MEMORY_BACKEND` when testing against real backend
3. ✅ Always lazy load page components for code splitting
4. ✅ Use `useLocale()` for all user-facing text (no hardcoded strings)
5. ✅ Use toast notifications for user feedback
6. ✅ Wrap forms in ErrorBoundary component
7. ✅ Use DataTable component for lists (includes pagination, sort, loading states)

## Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

Mock data is in `src/mocks/` and uses MSW (Mock Service Worker).

## Path Aliases

Use `@/` prefix for imports:

```typescript
import { formatCurrency } from "@/utils/helpers";
import { useLocale } from "@/i18n/hooks";
import { DataTable } from "@/components/core/DataTable";
```

Configured in `vite.config.ts` and `tsconfig.app.json`.
