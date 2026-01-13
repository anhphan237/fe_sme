import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

function Profile() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Update your personal details." />
      <Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="h-24 w-24 rounded-full border border-dashed border-stroke bg-slate-50" />
            <label className="grid gap-2 text-sm">
              Full name
              <input className="rounded-2xl border border-stroke px-4 py-2" />
            </label>
            <label className="grid gap-2 text-sm">
              Phone
              <input className="rounded-2xl border border-stroke px-4 py-2" />
            </label>
          </div>
          <div className="space-y-4">
            <label className="grid gap-2 text-sm">
              Job title
              <input className="rounded-2xl border border-stroke px-4 py-2" />
            </label>
            <label className="grid gap-2 text-sm">
              Department
              <input className="rounded-2xl border border-stroke px-4 py-2" />
            </label>
            <label className="grid gap-2 text-sm">
              Manager
              <input className="rounded-2xl border border-stroke px-4 py-2" />
            </label>
            <label className="grid gap-2 text-sm">
              Start date
              <input type="date" className="rounded-2xl border border-stroke px-4 py-2" />
            </label>
          </div>
        </div>
        <div className="mt-6">
          <Button>Save</Button>
        </div>
      </Card>
    </div>
  )
}

export default Profile

