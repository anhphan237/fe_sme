import { PlaceholderPage } from '../../components/common/PlaceholderPage'

function PlatformTenants() {
  return (
    <PlaceholderPage
      title="Tenants"
      subtitle="Manage tenant lifecycle and status."
      items={['View tenant list', 'Activate or suspend tenants', 'Review tenant settings']}
    />
  )
}

export default PlatformTenants
