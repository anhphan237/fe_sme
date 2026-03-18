import { useState } from "react";
import { Card, Skeleton, Tabs } from "antd";
import { useQuery } from "@tanstack/react-query";

/** @deprecated stub — no gateway operation yet */
const useSaTenantsQuery = () =>
  useQuery({ queryKey: ["sa-tenants"], queryFn: () => Promise.resolve([]) });
const useSaFinanceQuery = () =>
  useQuery({ queryKey: ["sa-finance"], queryFn: () => Promise.resolve([]) });
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";

const SuperAdmin = () => {
  const [tab, setTab] = useState("tenants");
  const { data: tenants, isLoading } = useSaTenantsQuery();
  const { data: finance } = useSaFinanceQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Super Admin</h1>
        <p className="mt-1 text-sm text-slate-600">
          Multi-tenant oversight and finance insights.
        </p>
      </div>

      <Tabs
        items={[
          { label: "Tenants", key: "tenants" },
          { label: "Subscriptions", key: "subscriptions" },
          { label: "Finance", key: "finance" },
        ]}
        activeKey={tab}
        onChange={(key) => setTab(key)}
      />

      {tab === "tenants" && (
        <Card className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-6" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Industry</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Plan</th>
                </tr>
              </thead>
              <tbody>
                {tenants?.map((tenant) => (
                  <tr key={tenant.id} className="border-t border-stroke">
                    <td className="px-4 py-3 font-medium">{tenant.name}</td>
                    <td className="px-4 py-3 text-muted">{tenant.industry}</td>
                    <td className="px-4 py-3 text-muted">{tenant.size}</td>
                    <td className="px-4 py-3 text-muted">{tenant.plan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === "subscriptions" && (
        <Card>
          <h3 className="text-lg font-semibold">Subscription status</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Active tenants</span>
              <span>34</span>
            </div>
            <div className="flex justify-between">
              <span>Churn risk</span>
              <span>3</span>
            </div>
            <div className="flex justify-between">
              <span>Trials</span>
              <span>5</span>
            </div>
          </div>
        </Card>
      )}

      {tab === "finance" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-lg font-semibold">MRR</h3>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={finance ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="mrr" stroke="#1d4ed8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold">Churn</h3>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finance ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="churn" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;
