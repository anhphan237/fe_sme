import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { useDocumentsQuery } from '../../hooks/queries'
import { Skeleton } from '../../components/ui/Skeleton'

const folders = ['Company', 'Department', 'Compliance', 'Security']
const tags = ['Required', 'Guide', 'Policy', 'Checklist']

function Documents() {
  const { data, isLoading, isError, refetch } = useDocumentsQuery()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle="Organize and distribute onboarding documentation."
        actionLabel="Upload Document"
        onAction={() => setOpen(true)}
        extra={
          <input
            placeholder="Search"
            className="rounded-2xl border border-stroke px-4 py-2 text-sm"
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold">Folders</h3>
          <div className="space-y-2 text-sm">
            {folders.map((folder) => (
              <button
                key={folder}
                className="flex w-full items-center justify-between rounded-2xl border border-stroke bg-slate-50 px-4 py-2"
              >
                {folder}
                <span className="text-muted">12</span>
              </button>
            ))}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-muted">Tags</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Library</h3>
            <div className="flex gap-2">
              <Button variant={view === 'grid' ? 'primary' : 'secondary'} onClick={() => setView('grid')}>
                Grid
              </Button>
              <Button variant={view === 'list' ? 'primary' : 'secondary'} onClick={() => setView('list')}>
                List
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : isError ? (
            <div className="mt-4 text-sm">
              Something went wrong.{' '}
              <button className="font-semibold" onClick={() => refetch()}>
                Retry
              </button>
            </div>
          ) : data && data.length === 0 ? (
            <EmptyState
              title="No documents yet"
              description="Upload a document to build the onboarding library."
              actionLabel="Upload Document"
              onAction={() => setOpen(true)}
            />
          ) : view === 'grid' ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {data?.map((doc) => (
                <Card key={doc.id} className="border border-stroke">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{doc.title}</h4>
                    {doc.required && <Badge>Required</Badge>}
                  </div>
                  <p className="mt-2 text-xs text-muted">Updated {doc.updatedAt}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {doc.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {data?.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-2xl border border-stroke bg-slate-50 px-4 py-3 text-sm"
                >
                  <span>{doc.title}</span>
                  <span className="text-muted">{doc.updatedAt}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal open={open} title="Upload document" onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <label className="grid gap-2 text-sm">
            Title
            <input className="rounded-2xl border border-stroke px-4 py-2" />
          </label>
          <label className="grid gap-2 text-sm">
            Folder
            <select className="rounded-2xl border border-stroke px-4 py-2">
              {folders.map((folder) => (
                <option key={folder}>{folder}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Tags
            <input className="rounded-2xl border border-stroke px-4 py-2" />
          </label>
          <label className="flex items-center justify-between text-sm">
            Required
            <input type="checkbox" />
          </label>
          <label className="grid gap-2 text-sm">
            Visibility
            <select className="rounded-2xl border border-stroke px-4 py-2">
              <option>All roles</option>
              <option>Departments</option>
            </select>
          </label>
          <Button>Upload</Button>
        </div>
      </Modal>
    </div>
  )
}

export default Documents

