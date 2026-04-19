import { Spin } from "antd";

export const AppLoading = () => (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
    <Spin size="large" />
  </div>
);
