import { PlaceholderPage } from '../../components/common/PlaceholderPage'

function PlatformDunning() {
  return (
    <PlaceholderPage
      title="Dunning"
      subtitle="Handle retries, suspensions, and recovery workflows."
      items={['Review open dunning cases', 'Retry failed payments', 'Resolve suspended tenants']}
    />
  )
}

export default PlatformDunning
