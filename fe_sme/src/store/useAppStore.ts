import { create } from 'zustand'
import type { Tenant, User } from '../shared/types'

interface AppState {
  currentTenant: Tenant | null
  currentUser: User | null
  token: string | null
  setTenant: (tenant: Tenant | null) => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentTenant: null,
  currentUser: null,
  token: null,
  setTenant: (tenant) => set({ currentTenant: tenant }),
  setUser: (user) => set({ currentUser: user }),
  setToken: (token) => set({ token }),
  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth_token')
    }
    set({
      currentTenant: null,
      currentUser: null,
      token: null,
    })
  },
}))

