import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSurveyInstanceQuery, useSurveyTemplatesQuery, useSaveSurveyResponse } from '../../hooks/queries'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'

function SurveyDetail() {
  const { surveyId } = useParams()
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const saveResponse = useSaveSurveyResponse()
  const {
    data: instance,
    isLoading,
    isError,
    refetch,
  } = useSurveyInstanceQuery(surveyId ?? '')
  const { data: templates } = useSurveyTemplatesQuery()

  const template = templates?.find((item) => item.id === instance?.templateId)

  if (isLoading) {
    return <Skeleton className="h-64" />
  }

  if (isError) {
    return (
      <Card>
        <p className="text-sm">
          Something went wrong.{' '}
          <button className="font-semibold" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      </Card>
    )
  }

  if (submitted) {
    return (
      <Card>
        <h1 className="text-2xl font-semibold">Thanks for your feedback</h1>
        <p className="mt-2 text-sm text-muted">Your survey has been submitted.</p>
        <Button className="mt-6" onClick={() => navigate('/surveys/inbox')}>
          Back to inbox
        </Button>
      </Card>
    )
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold">Survey</h1>
      <p className="text-sm text-muted">{template?.name}</p>
      <div className="mt-6 space-y-4">
        {template?.questions.map((question) => (
          <div key={question.id} className="space-y-2">
            <p className="text-sm font-semibold">{question.label}</p>
            {question.type === 'rating' && (
              <select className="rounded-2xl border border-stroke px-4 py-2">
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
              </select>
            )}
            {question.type === 'multiple' && (
              <select className="rounded-2xl border border-stroke px-4 py-2">
                {question.options?.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            )}
            {question.type === 'text' && (
              <textarea className="rounded-2xl border border-stroke px-4 py-2" rows={3} />
            )}
          </div>
        ))}
      </div>
      <Button
        className="mt-6"
        onClick={async () => {
          await saveResponse.mutateAsync({
            surveyId: surveyId ?? '',
            answers: { q1: 4 },
          })
          setSubmitted(true)
        }}
      >
        Submit
      </Button>
    </Card>
  )
}

export default SurveyDetail

