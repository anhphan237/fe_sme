import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Stepper } from '../../components/ui/Stepper'
import { Button } from '../../components/ui/Button'
import { useAppStore } from '../../store/useAppStore'
import type { Tenant, User } from '../../shared/types'
import { createMockToken } from '../../mocks/auth'

const schema = z.object({
  companyName: z.string().min(2),
  industry: z.string().min(2),
  size: z.string().min(1),
  hrName: z.string().min(2),
  hrEmail: z.string().email(),
  hrPassword: z.string().min(6),
})

type RegisterForm = z.infer<typeof schema>

const steps = ['Company Info', 'HR Account', 'Confirm']

function RegisterCompany() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const { setTenant, setUser, setToken } = useAppStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      size: '50-100',
    },
  })

  const onSubmit = (data: RegisterForm) => {
    const tenant: Tenant = {
      id: 'company-new',
      name: data.companyName,
      industry: data.industry,
      size: data.size,
      plan: 'Pro',
    }
    const user: User = {
      id: 'user-new',
      name: data.hrName,
      email: data.hrEmail,
      roles: ['COMPANY_ADMIN'],
      companyId: tenant.id,
      department: 'HR',
      status: 'Active',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setTenant(tenant)
    setUser(user)
    const token = createMockToken({
      user_id: user.id,
      company_id: tenant.id,
      roles: user.roles,
    })
    setToken(token)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('auth_token', token)
    }
    navigate('/dashboard')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Stepper steps={steps} current={step} />
      <Card>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Company name
                <input
                  className="rounded-2xl border border-stroke px-4 py-2"
                  {...register('companyName')}
                />
                {errors.companyName && (
                  <span className="text-xs text-red-500">
                    {errors.companyName.message}
                  </span>
                )}
              </label>
              <label className="grid gap-2 text-sm">
                Industry
                <input
                  className="rounded-2xl border border-stroke px-4 py-2"
                  {...register('industry')}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Company size
                <select
                  className="rounded-2xl border border-stroke px-4 py-2"
                  {...register('size')}
                >
                  <option value="1-25">1-25</option>
                  <option value="25-50">25-50</option>
                  <option value="50-100">50-100</option>
                  <option value="100-250">100-250</option>
                  <option value="250-500">250-500</option>
                </select>
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                HR name
                <input
                  className="rounded-2xl border border-stroke px-4 py-2"
                  {...register('hrName')}
                />
              </label>
              <label className="grid gap-2 text-sm">
                HR email
                <input
                  className="rounded-2xl border border-stroke px-4 py-2"
                  {...register('hrEmail')}
                />
              </label>
              <label className="grid gap-2 text-sm">
                Password
                <input
                  type="password"
                  className="rounded-2xl border border-stroke px-4 py-2"
                  {...register('hrPassword')}
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="md:col-span-2">
                <h3 className="text-lg font-semibold">Summary</h3>
                <div className="mt-3 space-y-2 text-sm text-muted">
                  <p>Company: {getValues('companyName')}</p>
                  <p>Industry: {getValues('industry')}</p>
                  <p>Size: {getValues('size')}</p>
                  <p>HR: {getValues('hrName')}</p>
                  <p>Email: {getValues('hrEmail')}</p>
                </div>
              </Card>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < 2 ? (
              <Button type="button" onClick={() => setStep((prev) => prev + 1)}>
                Continue
              </Button>
            ) : (
              <Button type="submit">Create account</Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}

export default RegisterCompany

