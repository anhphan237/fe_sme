import type { PropsWithChildren, ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { IntlProvider } from "react-intl";
import { App, ConfigProvider } from "antd";
import { localeConfig } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import type { Tenant, User } from "@/shared/types";

export interface RenderOptions {
  route?: string;
  locale?: "en_US" | "vi_VN";
  tenant?: Tenant;
  user?: Partial<User>;
}

const DEFAULT_TENANT: Tenant = {
  id: "1",
  name: "Test Company",
  industry: "SaaS",
  size: "10-50",
  plan: "Free",
};

export function renderWithProviders(
  ui: ReactElement,
  {
    route = "/",
    locale = "en_US",
    tenant = DEFAULT_TENANT,
    user,
  }: RenderOptions = {},
) {
  // Seed Zustand store so gateway calls include correct companyId/tenantId
  const store = useUserStore.getState();
  if (tenant) store.setTenant(tenant);
  if (user) {
    store.setUser({
      id: "test-user",
      name: "Test User",
      email: "test@example.com",
      roles: [],
      companyId: tenant?.id ?? "1",
      department: "Test",
      departmentId: null,
      status: "Active",
      ...user,
    } as User);
    store.setToken("mock-token");
  }

  const messages = localeConfig[locale] ?? localeConfig["en_US"];

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const Wrapper = ({ children }: PropsWithChildren) => (
    <IntlProvider
      locale={locale === "en_US" ? "en-US" : "vi-VN"}
      messages={messages}>
      <ConfigProvider>
        <App>
          <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </QueryClientProvider>
        </App>
      </ConfigProvider>
    </IntlProvider>
  );

  return render(ui, { wrapper: Wrapper });
}
