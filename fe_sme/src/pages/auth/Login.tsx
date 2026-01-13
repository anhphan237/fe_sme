import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { useAppStore } from '../../store/useAppStore'
import { login } from '../../shared/api/auth'
import { mswReady } from '../../mocks/ready'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type LoginForm = z.infer<typeof schema>

function Login() {
  const navigate = useNavigate()
  const toast = useToast()
  const setUser = useAppStore((state) => state.setUser)
  const setRole = useAppStore((state) => state.setRole)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      setSubmitError(null)
      const isMswReady = await mswReady
      if (!isMswReady) {
        console.warn('MSW not ready, falling back to local mock.')
      }
      const response = await login(data)
      setUser(response.user)
      setRole(response.user.role)
      toast('Welcome back!')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      setSubmitError(message)
      toast('Login failed. Please try again.')
      console.error('Login failed', error)
    }
  }

  const onError = () => {
    setSubmitError('Please check the form fields.')
  }


  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          Optimize onboarding across every team and tenant.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit(onSubmit, onError)}
          noValidate
        >
          {submitError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
              {submitError}
            </div>
          )}
          <label className="grid gap-2 text-sm">
            Email
            <input
              className="rounded-2xl border border-stroke px-4 py-2"
              placeholder="name@company.com"
              {...register('email')}
            />
            {errors.email && (
              <span className="text-xs text-red-500">{errors.email.message}</span>
            )}
          </label>
          <label className="grid gap-2 text-sm">
            Password
            <input
              type="password"
              className="rounded-2xl border border-stroke px-4 py-2"
              placeholder=""
              {...register('password')}
            />
            {errors.password && (
              <span className="text-xs text-red-500">
                {errors.password.message}
              </span>
            )}
          </label>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            Sign in
          </Button>
        </form>
        <div className="mt-4 rounded-2xl border border-stroke bg-slate-50 px-4 py-3 text-xs text-muted">
          <p className="font-semibold text-ink">Demo accounts</p>
          <p className="mt-1">hr@demo.com / password123</p>
          <p>manager@demo.com / password123</p>
          <p>employee@demo.com / password123</p>
          <p>super@demo.com / password123</p>
        </div>
        <div className="mt-6 space-y-2 text-sm text-muted">
          <button
            className="text-sm font-semibold text-brand"
            onClick={() => navigate('/register-company')}
          >
            Register company (HR)
          </button>
          <p>
            Accept invite? Use the link you received or open
            <span className="font-semibold text-ink"> /invite/accept?token=</span>.
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Login
