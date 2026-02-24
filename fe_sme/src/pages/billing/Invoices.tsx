import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { useInvoicesQuery } from '../../hooks/queries'

function BillingInvoices() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useInvoicesQuery()

  const handleDownload = (id: string) => {
    const blob = new Blob([`Invoice ${id}`], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${id}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Track billing history and download invoices."
      />

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
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
              title="No invoices available"
              description="Invoices will appear once billing cycles start."
              actionLabel="View plan"
              onAction={() => navigate('/billing/plan')}
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((invoice) => (
                <tr key={invoice.id} className="border-t border-stroke hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{invoice.id}</td>
                  <td className="px-4 py-3 text-muted">{invoice.amount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        invoice.status === 'Paid'
                          ? 'inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700'
                          : invoice.status === 'Overdue'
                            ? 'inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700'
                            : 'inline-block rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700'
                      }
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{invoice.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {(invoice.status === 'Open' || invoice.status === 'Overdue') && (
                        <Button
                          onClick={() =>
                            navigate(
                              `/billing/checkout/${invoice.id}?amount=${encodeURIComponent(invoice.amount)}`
                            )
                          }
                        >
                          Pay Now
                        </Button>
                      )}
                      <Button variant="ghost" onClick={() => handleDownload(invoice.id)}>
                        Download
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}

export default BillingInvoices
