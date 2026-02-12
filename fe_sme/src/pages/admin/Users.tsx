import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { useInviteUser, useUserDetailQuery, useUsersQuery } from '../../hooks/queries'
import { ROLE_LABELS } from '../../shared/rbac'
import type { UserDetail } from '../../shared/types'

type RoleCatalogItem = {
  id: string
  name: string
  level: 'Platform-level' | 'Company-level'
  description: string
  workflows: string[]
  capabilities: string[]
}

const roleCatalog: RoleCatalogItem[] = [
  {
    id: 'platform-admin',
    name: 'Platform Admin',
    level: 'Platform-level',
    description: 'Owns SaaS governance, tenant management, and billing controls.',
    workflows: ['Workflow 5'],
    capabilities: [
      'Manage tenants: view companies and tenant profile details.',
      'Activate, suspend, or change tenant status.',
      'Configure tenant settings when enabled.',
      'Manage pricing plans: create, update, retire.',
      'Configure plan features per plan.',
      'Manage subscriptions by tenant.',
      'Track monthly usage and usage trends.',
      'Manage invoices and payment transactions.',
      'Handle dunning cases: retry, suspend, resolve.',
      'Monitor business logs: email delivery and dunning status.',
    ],
  },
  {
    id: 'platform-manager',
    name: 'Platform Manager',
    level: 'Platform-level',
    description: 'Monitors platform health, usage, and revenue performance.',
    workflows: ['Workflow 5'],
    capabilities: [
      'Dashboard usage by company and month.',
      'Analyze plan distribution and active subscriptions.',
      'Track invoice health: paid, failed, due.',
      'Track payment success and failure rates.',
      'Review open dunning cases and suspend status.',
      'Analyze product usage: onboarded employees per month.',
      'Estimate email volume and chatbot token usage.',
    ],
  },
  {
    id: 'platform-staff',
    name: 'Platform Staff',
    level: 'Platform-level',
    description: 'Supports billing and delivery troubleshooting.',
    workflows: ['Workflow 5'],
    capabilities: [
      'Lookup invoices and payments by tenant.',
      'Check subscription status and history.',
      'Review dunning retry and suspend status.',
      'Investigate email delivery logs and provider errors.',
      'Review automation rules in read-only mode.',
    ],
  },
  {
    id: 'company-admin',
    name: 'Company Admin',
    level: 'Company-level',
    description: 'Administers tenant settings, users, roles, and billing.',
    workflows: ['Workflow 1', 'Workflow 5'],
    capabilities: [
      'Update company profile and settings.',
      'Manage departments and org structure.',
      'Create, update, or lock users.',
      'Create or edit roles and permissions.',
      'Assign roles to users.',
      'View subscription plan and status.',
      'Review usage, invoices, and payments.',
      'Review subscription and billing status.',
      'Run usage and billing reports.',
      'Report on onboarding operations from runtime data.',
    ],
  },
  {
    id: 'hr',
    name: 'HR',
    level: 'Company-level',
    description: 'Owns onboarding workflows and employee experience.',
    workflows: ['Workflow 2', 'Workflow 3', 'Workflow 4'],
    capabilities: [
      'Create and update employee profiles, assign department and manager.',
      'Create and edit onboarding, checklist, and task templates.',
      'Start onboarding for employees and generate instances.',
      'Track onboarding progress and record onboarding events.',
      'Assign or reassign tasks; track comments and activity logs.',
      'Configure automation, email templates, and campaigns.',
      'Monitor email delivery logs and system notifications.',
      'Manage document categories, versions, and access rules.',
      'Track document acknowledgements.',
      'Create survey templates and questions.',
      'Launch surveys and review responses and answers.',
      'Manage knowledge base articles and tags.',
      'Monitor chatbot sessions and messages.',
    ],
  },
  {
    id: 'manager',
    name: 'Manager',
    level: 'Company-level',
    description: 'Guides team onboarding and completes assigned tasks.',
    workflows: ['Workflow 3', 'Workflow 4'],
    capabilities: [
      'View direct reports and their onboarding progress.',
      'View onboarding instances and team tasks.',
      'Update and complete assigned tasks.',
      'Comment on tasks and collaborate.',
      'Upload task attachments when needed.',
      'Respond to manager surveys.',
      'Access documents and acknowledge reading.',
      'Use the chatbot for Q&A.',
    ],
  },
  {
    id: 'employee',
    name: 'Employee (New Employee)',
    level: 'Company-level',
    description: 'Completes personal onboarding tasks and surveys.',
    workflows: ['Workflow 3', 'Workflow 4'],
    capabilities: [
      'View own profile and onboarding status.',
      'Review onboarding checklist and tasks.',
      'Update and complete assigned tasks.',
      'Upload task attachments.',
      'Comment on tasks when allowed.',
      'Receive and read notifications.',
      'Access documents and acknowledge reading.',
      'Respond to onboarding surveys.',
      'Use the chatbot for Q&A.',
    ],
  },
]

function UserDetailContent({ detail }: { detail: UserDetail }) {
  const rows: { label: string; value: string | null }[] = [
    { label: 'Full name', value: detail.fullName },
    { label: 'Email', value: detail.email },
    { label: 'Phone', value: detail.phone },
    { label: 'Status', value: detail.status },
    { label: 'Employee ID', value: detail.employeeId },
    { label: 'Department ID', value: detail.departmentId },
    { label: 'Employee code', value: detail.employeeCode },
    { label: 'Job title', value: detail.jobTitle },
    { label: 'Manager user ID', value: detail.managerUserId },
    { label: 'Start date', value: detail.startDate },
    { label: 'Work location', value: detail.workLocation },
  ]
  return (
    <div className="grid gap-3 text-sm">
      {rows.map(
        (row) =>
          row.value != null && (
            <div key={row.label} className="flex justify-between gap-4 border-b border-stroke pb-2">
              <span className="text-muted">{row.label}</span>
              <span className="font-medium text-ink">{row.value}</span>
            </div>
          )
      )}
    </div>
  )
}

function AdminUsers() {
  const { data, isLoading, isError, refetch } = useUsersQuery()
  const inviteUser = useInviteUser()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [detailUserId, setDetailUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    email: '',
    department: 'HR',
    manager: '',
  })
  const { data: userDetail, isLoading: detailLoading } = useUserDetailQuery(detailUserId ?? undefined)

  const handleInvite = async () => {
    await inviteUser.mutateAsync({
      email: form.email,
      roles: ['EMPLOYEE'],
      department: form.department,
      manager: form.manager,
    })
    toast('Invite sent.')
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="Invite and manage access across tenants."
        actionLabel="Invite User"
        onAction={() => setOpen(true)}
      />

      <Card>
        <div className="space-y-4 p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Role catalog</p>
            <h2 className="text-lg font-semibold">Role capabilities by scope</h2>
            <p className="text-sm text-muted">
              Mock data for platform and company roles, with the capabilities each role can access.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {roleCatalog.map((role) => (
              <div key={role.id} className="rounded-2xl border border-stroke p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold">{role.name}</h3>
                  <Badge>{role.level}</Badge>
                  {role.workflows.map((workflow) => (
                    <Badge key={workflow}>{workflow}</Badge>
                  ))}
                </div>
                <p className="mt-1 text-sm text-muted">{role.description}</p>
                <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                  {role.capabilities.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            placeholder="Search"
            className="rounded-2xl border border-stroke px-4 py-2 text-sm"
          />
          <select className="rounded-2xl border border-stroke px-4 py-2 text-sm">
            <option>Department</option>
            <option>HR</option>
            <option>Engineering</option>
          </select>
          <select className="rounded-2xl border border-stroke px-4 py-2 text-sm">
            <option>Status</option>
            <option>Active</option>
            <option>Invited</option>
            <option>Inactive</option>
          </select>
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm">
            Something went wrong.{' '}
            <button className="font-semibold" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : data && data.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No users found"
              description="Invite your first teammate to get started."
              actionLabel="Invite User"
              onAction={() => setOpen(true)}
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((user) => (
                <tr key={user.id} className="border-t border-stroke hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.roles.map((role) => ROLE_LABELS[role]).join(', ')}
                  </td>
                  <td className="px-4 py-3">{user.department}</td>
                  <td className="px-4 py-3">
                    <Badge>{user.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{user.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setDetailUserId(user.id)}>
                        View
                      </Button>
                      <Button variant="ghost">Edit</Button>
                      <Button variant="ghost">Deactivate</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={Boolean(detailUserId)}
        title="User detail"
        onClose={() => setDetailUserId(null)}
      >
        {detailLoading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : userDetail && 'userId' in userDetail ? (
          <UserDetailContent detail={userDetail as UserDetail} />
        ) : (
          <p className="text-sm text-muted">Could not load user detail.</p>
        )}
      </Modal>

      <Modal open={open} title="Invite user" onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            Email
            <input
              className="rounded-2xl border border-stroke px-4 py-2"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
            />
          </label>
          <label className="grid gap-1 text-sm">
            Department
            <select
              className="rounded-2xl border border-stroke px-4 py-2"
              value={form.department}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, department: event.target.value }))
              }
            >
              <option>HR</option>
              <option>Engineering</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Manager (optional)
            <input
              className="rounded-2xl border border-stroke px-4 py-2"
              value={form.manager}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, manager: event.target.value }))
              }
            />
          </label>
          <Button onClick={handleInvite}>Send invite</Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminUsers

