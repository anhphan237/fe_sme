import { create } from 'zustand'
import type { Role, Tenant, User } from '../shared/types'

interface AppState {
  currentTenant: Tenant | null
  currentUser: User | null
  role: Role
  setTenant: (tenant: Tenant) => void
  setUser: (user: User | null) => void
  setRole: (role: Role) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentTenant: null,
  currentUser: null,
  role: 'HR Admin',
  setTenant: (tenant) => set({ currentTenant: tenant }),
  setUser: (user) => set({ currentUser: user }),
  setRole: (role) => set({ role }),
  logout: () =>
    set({
      currentTenant: null,
      currentUser: null,
      role: 'HR Admin',
    }),
}))

