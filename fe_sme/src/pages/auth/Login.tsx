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
import loginHero from '../../assets/login-hero.svg'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof schema>

function Login() {
  const navigate = useNavigate()
  const toast = useToast()
  const setUser = useAppStore((state) => state.setUser)
  const setToken = useAppStore((state) => state.setToken)
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
      const response = await login(data)
      setUser(response.user)
      setToken(response.token)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('auth_token', response.token)
      }
      toast('Welcome back!')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const raw = error instanceof Error ? error.message : 'Login failed'
      const message = raw.length > 200 ? `${raw.slice(0, 200)}…` : raw
      setSubmitError(message)
      toast('Login failed. Please try again.')
      console.error('Login failed', error)
    }
  }

  const onError = () => {
    setSubmitError('Please check the form fields.')
  }

  return (
    <div className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-slate-200/70 blur-3xl" />
        <div className="absolute bottom-0 right-12 h-56 w-56 rounded-full bg-slate-300/50 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.06),transparent_55%)]" />
      </div>
      <Card className="w-full max-w-md border border-stroke/80 bg-white/80 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.45)] backdrop-blur">
        <div className="px-6 py-8 sm:px-8">
          <div className="mb-6 overflow-hidden rounded-2xl border border-stroke/70 bg-white/70">
            <img
              src={loginHero}
              alt="Minimal workspace illustration"
              className="h-32 w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="inline-flex items-center rounded-full border border-stroke bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
            Workspace access
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-ink">
            Sign in to continue
          </h1>
          <p className="mt-2 text-sm text-muted">
            A clean, secure entry to your onboarding workspace.
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
            <label className="grid gap-2 text-sm text-ink">
              Email
              <input
                className="rounded-2xl border border-stroke bg-white/70 px-4 py-2 text-sm text-ink shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200/60"
                placeholder="name@company.com"
                {...register('email')}
              />
              {errors.email && (
                <span className="text-xs text-red-500">
                  {errors.email.message}
                </span>
              )}
            </label>
            <label className="grid gap-2 text-sm text-ink">
              Password
              <input
                type="password"
                className="rounded-2xl border border-stroke bg-white/70 px-4 py-2 text-sm text-ink shadow-sm transition focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-200/60"
                placeholder="********"
                {...register('password')}
              />
              {errors.password && (
                <span className="text-xs text-red-500">
                  {errors.password.message}
                </span>
              )}
            </label>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full"
            >
              Sign in
            </Button>
          </form>
          <div className="mt-4 rounded-2xl border border-stroke bg-white/70 px-4 py-3 text-xs text-muted">
            <p className="font-semibold text-ink">Demo accounts</p>
            <div className="mt-2 grid gap-1">
              <p>admin@acme.com / 123</p>
              <p>hr@acme.com / 123</p>
              <p>manager@acme.com / 123</p>
              <p>employee@acme.com / 123</p>
              <p>platform_admin@demo.com / 123</p>
              <p>platform_manager@demo.com / 123</p>
              <p>platform_staff@demo.com / 123</p>
            </div>
          </div>
          <div className="mt-6 space-y-2 text-sm text-muted">
            <button
              className="text-sm font-semibold text-ink underline-offset-4 transition hover:underline"
              onClick={() => navigate('/register-company')}
            >
              Register company (HR)
            </button>
            <p>
              Accept invite? Use the link you received or open
              <span className="font-semibold text-ink">
                {' '}
                /invite/accept?token=
              </span>
              .
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Login
