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
import { useInviteUser, useUsersQuery } from '../../hooks/queries'
import type { User } from '../../shared/types'

function AdminUsers() {
  const { data, isLoading, isError, refetch } = useUsersQuery()
  const inviteUser = useInviteUser()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    email: '',
    role: 'Employee',
    department: 'People Ops',
    manager: '',
  })

  const handleInvite = async () => {
    await inviteUser.mutateAsync({
      email: form.email,
      role: form.role as User['role'],
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
        <div className="grid gap-3 md:grid-cols-4">
          <input
            placeholder="Search"
            className="rounded-2xl border border-stroke px-4 py-2 text-sm"
          />
          <select className="rounded-2xl border border-stroke px-4 py-2 text-sm">
            <option>Role</option>
            <option>HR Admin</option>
            <option>Manager</option>
            <option>Employee</option>
          </select>
          <select className="rounded-2xl border border-stroke px-4 py-2 text-sm">
            <option>Department</option>
            <option>People Ops</option>
            <option>Engineering</option>
            <option>Sales</option>
            <option>Marketing</option>
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
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.department}</td>
                  <td className="px-4 py-3">
                    <Badge>{user.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{user.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
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
            Role
            <select
              className="rounded-2xl border border-stroke px-4 py-2"
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, role: event.target.value }))
              }
            >
              <option>HR Admin</option>
              <option>Manager</option>
              <option>Employee</option>
            </select>
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
              <option>People Ops</option>
              <option>Engineering</option>
              <option>Sales</option>
              <option>Marketing</option>
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

