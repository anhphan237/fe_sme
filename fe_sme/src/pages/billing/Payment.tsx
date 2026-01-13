import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useConnectPayment } from '../../hooks/queries'

const providers = [
  { name: 'Stripe', status: 'Connected', lastSync: '2025-01-20 09:00' },
  { name: 'MoMo', status: 'Disconnected', lastSync: '—' },
  { name: 'ZaloPay', status: 'Disconnected', lastSync: '—' },
  { name: 'VNPay', status: 'Connected', lastSync: '2025-01-18 15:30' },
]

function BillingPayment() {
  const connectPayment = useConnectPayment()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment"
        subtitle="Connect payment providers for billing."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {providers.map((provider) => (
          <Card key={provider.name}>
            <h3 className="text-lg font-semibold">{provider.name}</h3>
            <p className="text-sm text-muted">Status: {provider.status}</p>
            <p className="text-sm text-muted">Last sync: {provider.lastSync}</p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => connectPayment.mutate({ provider: provider.name })}
              >
                {provider.status === 'Connected' ? 'Disconnect' : 'Connect'}
              </Button>
              <Button variant="ghost">Test charge</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default BillingPayment

