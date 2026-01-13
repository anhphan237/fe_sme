import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

interface RequireAuthProps {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const currentUser = useAppStore((state) => state.currentUser)

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

