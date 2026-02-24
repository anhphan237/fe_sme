export type DemoCredential = {
  email: string
  password: string
}

export const demoCredentials: DemoCredential[] = [
  { email: 'admin@acme.com', password: '123' },
  { email: 'hr@acme.com', password: '123' },
  { email: 'manager@acme.com', password: '123' },
  { email: 'employee@acme.com', password: '123' },
  { email: 'platform_admin@demo.com', password: '123' },
  { email: 'platform_manager@demo.com', password: '123' },
  { email: 'platform_staff@demo.com', password: '123' },
]
