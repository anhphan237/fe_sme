import { PlaceholderPage } from '../../components/common/PlaceholderPage'

function PlatformEmailLogs() {
  return (
    <PlaceholderPage
      title="Email Logs"
      subtitle="Investigate delivery success and failures."
      items={['Search by tenant', 'Inspect provider errors', 'Retry or resend messages']}
    />
  )
}

export default PlatformEmailLogs
