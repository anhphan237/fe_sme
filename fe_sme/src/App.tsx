import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { IntlProvider } from "react-intl";
import { ConfigProvider, Spin } from "antd";
import vi_VN from "antd/lib/locale/vi_VN";
import en_US from "antd/lib/locale/en_US";
import { router } from "./router";
import { ToastViewport } from "./components/ui/Toast";
import { AuthRehydrate } from "./components/auth/AuthRehydrate";
import { useAppStore } from "./store/useAppStore";
import { localeConfig } from "./i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

/** Inner component so it can read Zustand locale state */
function AppProviders() {
  const locale = useAppStore((s) => s.locale);
  const loading = useAppStore((s) => s.loading);

  const antdLocale = locale === "vi_VN" ? vi_VN : en_US;
  const intlMessages = localeConfig[locale] ?? localeConfig["vi_VN"];

  return (
    <IntlProvider
      locale={locale.replace("_", "-")}
      messages={intlMessages}
      defaultLocale="vi-VN">
      <ConfigProvider
        locale={antdLocale}
        theme={{
          token: {
            colorPrimary: "#2563eb",
            borderRadius: 6,
          },
        }}>
        {/* Global loading overlay (from PMS global.store pattern) */}
        {loading && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.5)",
            }}>
            <Spin size="large" />
          </div>
        )}
        <AuthRehydrate>
          <RouterProvider router={router} />
        </AuthRehydrate>
        <ToastViewport />
      </ConfigProvider>
    </IntlProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders />
    </QueryClientProvider>
  );
}

export default App;
