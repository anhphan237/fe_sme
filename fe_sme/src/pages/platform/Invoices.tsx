import { PlaceholderPage } from '../../components/common/PlaceholderPage'

function PlatformInvoices() {
  return (
    <PlaceholderPage
      title="Invoice Lookup"
      subtitle="Support tooling for invoice investigations."
      items={['Search invoices by tenant', 'Review paid/failed status', 'Export invoice history']}
    />
  )
}

export default PlatformInvoices
