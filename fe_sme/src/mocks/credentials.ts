import type { Role } from '../shared/types'

export type DemoCredential = {
  email: string
  password: string
  role: Role
}

export const demoCredentials: DemoCredential[] = [
  { email: 'hr@demo.com', password: 'password123', role: 'HR Admin' },
  { email: 'manager@demo.com', password: 'password123', role: 'Manager' },
  { email: 'employee@demo.com', password: 'password123', role: 'Employee' },
  { email: 'super@demo.com', password: 'password123', role: 'Super Admin' },
]
