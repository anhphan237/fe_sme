import { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="min-h-screen px-6 py-12">{children}</div>
    </div>
  )
}

export default AuthLayout

