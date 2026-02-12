import { ReactNode, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Banknote,
  Bot,
  Briefcase,
  ClipboardCheck,
  FileText,
  Gauge,
  LayoutGrid,
  LifeBuoy,
  Menu,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { RoleTenantSwitcher } from '../components/common/RoleTenantSwitcher'
import { Breadcrumbs } from '../components/ui/Breadcrumb'
import { clsx } from 'clsx'
import type { Role } from '../shared/types'
import { hasRequiredRole } from '../shared/rbac'

interface AppLayoutProps {
  children: ReactNode
}

type NavItem = {
  title: string
  to: string
  requiredRoles?: Role[]
}

type NavSection = {
  title: string
  icon: typeof Gauge
  to?: string
  requiredRoles?: Role[]
  children?: NavItem[]
}

function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const currentUser = useAppStore((state) => state.currentUser)
  const location = useLocation()
  const userRoles = currentUser?.roles ?? []

  const navSections = useMemo<NavSection[]>(
    () => [
      {
        title: 'Dashboard',
        icon: Gauge,
        to: '/dashboard',
      },
      {
        title: 'Organization',
        icon: Shield,
        children: [
          {
            title: 'Departments',
            to: '/admin/departments',
            requiredRoles: ['COMPANY_ADMIN'],
          },
          {
            title: 'Users',
            to: '/admin/users',
            requiredRoles: ['COMPANY_ADMIN'],
          },
          {
            title: 'Roles',
            to: '/admin/roles',
            requiredRoles: ['COMPANY_ADMIN'],
          },
        ],
      },
      {
        title: 'Onboarding',
        icon: ClipboardCheck,
        children: [
          {
            title: 'Templates',
            to: '/onboarding/templates',
            requiredRoles: ['HR'],
          },
          {
            title: 'Employees',
            to: '/onboarding/employees',
            requiredRoles: ['HR', 'MANAGER'],
          },
          {
            title: 'Tasks',
            to: '/onboarding/tasks',
            requiredRoles: ['HR', 'MANAGER', 'EMPLOYEE'],
          },
          {
            title: 'Automation',
            to: '/onboarding/automation',
            requiredRoles: ['HR'],
          },
          {
            title: 'Knowledge Base',
            to: '/admin/knowledge-base',
            requiredRoles: ['HR'],
          },
        ],
      },
      {
        title: 'Documents',
        icon: FileText,
        children: [
          {
            title: 'Library',
            to: '/documents',
            requiredRoles: ['HR', 'MANAGER', 'EMPLOYEE'],
          },
          {
            title: 'Acknowledgments',
            to: '/documents/acknowledgments',
            requiredRoles: ['HR', 'MANAGER', 'EMPLOYEE'],
          },
        ],
      },
      {
        title: 'Surveys',
        icon: LayoutGrid,
        children: [
          {
            title: 'Templates',
            to: '/surveys/templates',
            requiredRoles: ['HR'],
          },
          {
            title: 'Send',
            to: '/surveys/send',
            requiredRoles: ['HR'],
          },
          {
            title: 'Inbox',
            to: '/surveys/inbox',
            requiredRoles: ['HR', 'MANAGER', 'EMPLOYEE'],
          },
          {
            title: 'Reports',
            to: '/surveys/reports',
            requiredRoles: ['HR'],
          },
        ],
      },
      {
        title: 'Chatbot',
        icon: Bot,
        to: '/chatbot',
        requiredRoles: ['HR', 'MANAGER', 'EMPLOYEE'],
      },
      {
        title: 'Billing (Company)',
        icon: Banknote,
        children: [
          { title: 'Plan', to: '/billing/plan', requiredRoles: ['COMPANY_ADMIN'] },
          { title: 'Usage', to: '/billing/usage', requiredRoles: ['COMPANY_ADMIN'] },
          {
            title: 'Invoices',
            to: '/billing/invoices',
            requiredRoles: ['COMPANY_ADMIN'],
          },
          {
            title: 'Payment',
            to: '/billing/payment',
            requiredRoles: ['COMPANY_ADMIN'],
          },
        ],
      },
      {
        title: 'Platform',
        icon: Briefcase,
        children: [
          {
            title: 'Tenants',
            to: '/platform/tenants',
            requiredRoles: ['PLATFORM_ADMIN', 'PLATFORM_MANAGER'],
          },
          {
            title: 'Plans',
            to: '/platform/plans',
            requiredRoles: ['PLATFORM_ADMIN'],
          },
          {
            title: 'Subscriptions',
            to: '/platform/subscriptions',
            requiredRoles: ['PLATFORM_ADMIN'],
          },
          {
            title: 'Usage',
            to: '/platform/usage',
            requiredRoles: ['PLATFORM_ADMIN', 'PLATFORM_MANAGER'],
          },
          {
            title: 'Finance',
            to: '/platform/finance',
            requiredRoles: ['PLATFORM_ADMIN', 'PLATFORM_MANAGER'],
          },
          {
            title: 'Dunning',
            to: '/platform/dunning',
            requiredRoles: ['PLATFORM_ADMIN'],
          },
          {
            title: 'Invoices',
            to: '/platform/invoices',
            requiredRoles: ['PLATFORM_STAFF'],
          },
          {
            title: 'Payments',
            to: '/platform/payments',
            requiredRoles: ['PLATFORM_STAFF'],
          },
          {
            title: 'Email Logs',
            to: '/platform/email-logs',
            requiredRoles: ['PLATFORM_STAFF'],
          },
        ],
      },
    ],
    []
  )

  const visibleSections = useMemo(() => {
    return navSections
      .map((section) => {
        const sectionAllowed = hasRequiredRole(userRoles, section.requiredRoles)
        const children = section.children?.filter((child) =>
          hasRequiredRole(userRoles, child.requiredRoles)
        )

        if (section.to) {
          return sectionAllowed ? { ...section } : null
        }

        if (children && children.length > 0) {
          return { ...section, children }
        }

        return null
      })
      .filter(Boolean) as NavSection[]
  }, [navSections, userRoles])

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <div className="flex">
        <aside
          className={clsx(
            'fixed inset-y-0 left-0 z-30 w-72 -translate-x-full border-r border-stroke bg-white/95 p-6 shadow-soft transition-transform lg:static lg:translate-x-0',
            sidebarOpen && 'translate-x-0'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                SME-Onboard
              </p>
              <p className="text-lg font-semibold">Platform</p>
            </div>
            <button
              className="rounded-full border border-stroke p-2 text-muted lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          <nav className="mt-8 space-y-6">
            {visibleSections.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                  <section.icon className="h-4 w-4" />
                  {section.title}
                </div>
                <div className="mt-3 space-y-2">
                  {section.to && (
                    <NavLink
                      to={section.to}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition',
                          isActive
                            ? 'bg-slate-900 text-white'
                            : 'text-muted hover:bg-slate-100'
                        )
                      }
                    >
                      {section.title}
                    </NavLink>
                  )}
                  {section.children?.map((child) => (
                    <NavLink
                      key={child.title}
                      to={child.to}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition',
                          isActive
                            ? 'bg-slate-900 text-white'
                            : 'text-muted hover:bg-slate-100'
                        )
                      }
                    >
                      {child.title}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-stroke bg-slate-50 p-4 text-sm">
            <p className="font-semibold">Need help?</p>
            <p className="mt-1 text-muted">
              Visit the support hub or chat with our onboarding concierge.
            </p>
            <button className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand">
              <LifeBuoy className="h-4 w-4" />
              Support Center
            </button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col lg:ml-0">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-stroke bg-white/90 px-6 py-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                className="rounded-full border border-stroke p-2 text-muted lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-4 w-4" />
              </button>
              <Breadcrumbs pathname={location.pathname} />
            </div>
            <div className="flex items-center gap-4">
              <RoleTenantSwitcher />
              <NavLink
                to="/profile"
                className="flex items-center gap-2 rounded-full border border-stroke px-3 py-2 text-sm"
              >
                <Users className="h-4 w-4 text-muted" />
                Profile
              </NavLink>
              <NavLink
                to="/settings/notifications"
                className="flex items-center gap-2 rounded-full border border-stroke px-3 py-2 text-sm"
              >
                <Settings className="h-4 w-4 text-muted" />
                Settings
              </NavLink>
            </div>
          </header>

          <main className="flex-1 space-y-6 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
