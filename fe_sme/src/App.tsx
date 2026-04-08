import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { IntlProvider } from "react-intl";
import { App as AntdApp, ConfigProvider, Spin } from "antd";
import ToastMessage from "@/components/toast-message";
import vi_VN from "antd/lib/locale/vi_VN";
import en_US from "antd/lib/locale/en_US";
import { router } from "./routes";
import { AuthRehydrate } from "./components/auth/AuthRehydrate";
import { useUserStore } from "./stores/user.store";
import { useGlobalStore } from "./stores/global.store";
import { localeConfig } from "./i18n";
import { queryClient } from "./lib/queryClient";
// import { WebSocketProvider } from "./contexts/WebSocketContext";

/** Inner component so it can read Zustand locale state */
const AppProviders = () => {
  const locale = useUserStore((s) => s.locale);
  const loading = useGlobalStore((s) => s.loading);

  const antdLocale = locale === "vi_VN" ? vi_VN : en_US;
  const intlMessages = localeConfig[locale] ?? localeConfig["vi_VN"];

  return (
    <IntlProvider
      locale={locale.replace("_", "-")}
      messages={intlMessages}
      defaultLocale="vi-VN">
      <ConfigProvider
        locale={antdLocale}
        componentSize="middle"
        theme={{
          token: {
            colorPrimary: "#3684DB",
            colorLink: "#3684DB",
            colorSuccess: "#4CAF50",
            colorWarning: "#FFC107",
            colorError: "#FF6F61",
            borderRadius: 6,
            colorBgBase: "#ffffff",
            colorBgContainer: "#ffffff",
            colorBgLayout: "#ffffff",
            colorText: "#223A59",
            colorTextSecondary: "#758BA5",
            colorTextHeading: "#031930",
            colorBorder: "#B3D6F9",
            colorBorderBg: "#D1DDED",
          },
          components: {
            Table: {
              headerBg: "#D1DDED",
            },
          },
        }}>
        <AntdApp>
          {/* <WebSocketProvider> */}
          <ToastMessage />
          {loading && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.44)" }}>
              <Spin size="large" />
            </div>
          )}
          <AuthRehydrate>
            <RouterProvider router={router} />
          </AuthRehydrate>
          {/* </WebSocketProvider> */}
        </AntdApp>
      </ConfigProvider>
    </IntlProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders />
    </QueryClientProvider>
  );
};

export default App;
