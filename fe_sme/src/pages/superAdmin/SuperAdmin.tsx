import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Tabs } from '../../components/ui/Tabs'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Table } from '../../components/ui/Table'
import { useCreateDiscountCode, useDiscountCodesQuery, useSaFinanceQuery, useSaTenantsQuery } from '../../hooks/queries'
import { Skeleton } from '../../components/ui/Skeleton'
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
} from 'recharts'

function SuperAdmin() {
  const [tab, setTab] = useState('tenants')
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState({ code: '', amount: '10%' })
  const { data: tenants, isLoading } = useSaTenantsQuery()
  const { data: finance } = useSaFinanceQuery()
  const { data: discounts } = useDiscountCodesQuery()
  const createDiscount = useCreateDiscountCode()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin"
        subtitle="Multi-tenant oversight and finance insights."
      />

      <Tabs
        items={[
          { label: 'Tenants', value: 'tenants' },
          { label: 'Subscriptions', value: 'subscriptions' },
          { label: 'Finance', value: 'finance' },
          { label: 'Discount Codes', value: 'discounts' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'tenants' && (
        <Card className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-6" />
            </div>
          ) : (
            <Table>
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
            </Table>
          )}
        </Card>
      )}

      {tab === 'subscriptions' && (
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

      {tab === 'finance' && (
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

      {tab === 'discounts' && (
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Discount codes</h3>
            <Button onClick={() => setOpen(true)}>Create</Button>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {discounts?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-stroke bg-slate-50 px-4 py-3"
              >
                <span>{item.code}</span>
                <span className="text-muted">{item.amount}</span>
                <span className="text-muted">{item.status}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={open} title="Create discount code" onClose={() => setOpen(false)}>
        <div className="grid gap-3 text-sm">
          <label className="grid gap-2">
            Code
            <input
              className="rounded-2xl border border-stroke px-4 py-2"
              value={code.code}
              onChange={(event) => setCode((prev) => ({ ...prev, code: event.target.value }))}
            />
          </label>
          <label className="grid gap-2">
            Amount
            <input
              className="rounded-2xl border border-stroke px-4 py-2"
              value={code.amount}
              onChange={(event) => setCode((prev) => ({ ...prev, amount: event.target.value }))}
            />
          </label>
          <Button
            onClick={async () => {
              await createDiscount.mutateAsync({ code: code.code, amount: code.amount })
              setOpen(false)
            }}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default SuperAdmin

