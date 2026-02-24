import { useSearchParams } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

function InviteAccept() {
  const [params] = useSearchParams()
  const token = params.get('token')

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">Accept invite</h1>
        <p className="mt-2 text-sm text-muted">
          Confirm your invitation to join SME-Onboard.
        </p>
        <div className="mt-4 rounded-2xl border border-stroke bg-slate-50 p-4 text-sm">
          Token: <span className="font-semibold">{token ?? 'missing'}</span>
        </div>
        <Button className="mt-6 w-full">Accept and continue</Button>
      </Card>
    </div>
  )
}

export default InviteAccept

