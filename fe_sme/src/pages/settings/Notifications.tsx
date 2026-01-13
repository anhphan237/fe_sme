import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

function Notifications() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Choose how you receive onboarding updates."
      />
      <Card>
        <div className="space-y-4">
          <label className="flex items-center justify-between text-sm">
            Email reminders
            <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between text-sm">
            In-app notifications
            <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between text-sm">
            Weekly summary
            <input type="checkbox" />
          </label>
        </div>
        <div className="mt-6">
          <Button>Save</Button>
        </div>
      </Card>
    </div>
  )
}

export default Notifications

