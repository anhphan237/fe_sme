import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { useSaveTemplate, useTemplateQuery } from '../../hooks/queries'
import { useToast } from '../../components/ui/Toast'

function TemplateEditor() {
  const { templateId } = useParams()
  const toast = useToast()
  const { data, isLoading } = useTemplateQuery(templateId)
  const saveTemplate = useSaveTemplate()
  const [activeStage, setActiveStage] = useState(0)

  const template = useMemo(
    () => data ?? {
      name: '',
      description: '',
      stages: [
        {
          id: 'stage-new',
          name: 'New stage',
          tasks: [
            {
              id: 'task-new',
              title: 'New task',
              ownerRole: 'Employee',
              dueOffset: 'Day 1',
              required: false,
            },
          ],
        },
      ],
    },
    [data]
  )

  const currentStage = template.stages[activeStage]

  const handleSave = async () => {
    await saveTemplate.mutateAsync(template)
    toast('Template saved.')
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title={templateId ? 'Template details' : 'New Template'}
        subtitle="Design the onboarding flow and tasks per stage."
      />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-4">
            <div className="space-y-2">
              <label className="grid gap-2 text-sm">
                Template name
                <input
                  className="rounded-2xl border border-stroke px-4 py-2"
                  defaultValue={template.name}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Description
                <textarea
                  className="rounded-2xl border border-stroke px-4 py-2"
                  rows={4}
                  defaultValue={template.description}
                />
              </label>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted">Stages</h3>
              <div className="mt-3 space-y-2">
                {template.stages.map((stage, index) => (
                  <button
                    key={stage.id}
                    className={`w-full rounded-2xl border px-4 py-2 text-left text-sm font-medium ${
                      index === activeStage
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-stroke text-muted'
                    }`}
                    onClick={() => setActiveStage(index)}
                  >
                    {stage.name}
                  </button>
                ))}
                <Button variant="secondary" className="w-full">
                  Add stage
                </Button>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Stage editor</h3>
                <p className="text-sm text-muted">{currentStage?.name}</p>
              </div>
              <Button variant="secondary">Add task</Button>
            </div>
            <Table>
              <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Owner role</th>
                  <th className="px-4 py-3">Due offset</th>
                  <th className="px-4 py-3">Required</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStage?.tasks.map((task) => (
                  <tr key={task.id} className="border-t border-stroke">
                    <td className="px-4 py-3 font-medium">{task.title}</td>
                    <td className="px-4 py-3 text-muted">{task.ownerRole}</td>
                    <td className="px-4 py-3 text-muted">{task.dueOffset}</td>
                    <td className="px-4 py-3 text-muted">
                      {task.required ? 'Yes' : 'No'}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stroke bg-white/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-sm text-muted">Unsaved changes</p>
          <Button onClick={handleSave}>Save template</Button>
        </div>
      </div>
    </div>
  )
}

export default TemplateEditor

