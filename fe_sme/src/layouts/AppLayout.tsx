import { ReactNode, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Banknote,
  Bot,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Gauge,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Menu,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { logout } from '../shared/api/auth'
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
  const location = useLocation()
  const navigate = useNavigate()
  const currentUser = useAppStore((state) => state.currentUser)
  const logoutStore = useAppStore((state) => state.logout)
  const userRoles = currentUser?.roles ?? []
  const pathname = location.pathname

  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>(() => ({}))
  const toggleSection = (title: string) => {
    setSectionOpen((prev) => ({ ...prev, [title]: !prev[title] }))
  }
  const isSectionOpen = (section: NavSection): boolean => {
    if (sectionOpen[section.title] !== undefined) return sectionOpen[section.title]
    const paths = section.to ? [section.to] : section.children?.map((c) => c.to) ?? []
    return paths.some((p) => pathname === p || pathname.startsWith(p + '/'))
  }

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
            requiredRoles: ['HR'],
          },
          {
            title: 'Users',
            to: '/admin/users',
            requiredRoles: ['HR'],
          },
          {
            title: 'Roles',
            to: '/admin/roles',
            requiredRoles: ['HR'],
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
            title: 'Onboarding Employee',
            to: '/onboarding/employees',
            requiredRoles: ['HR', 'MANAGER', 'EMPLOYEE'],
          },
          {
            title: 'Employees',
            to: '/onboarding/employees/new',
            requiredRoles: ['HR'],
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
          { title: 'Plan', to: '/billing/plan', requiredRoles: ['HR'] },
          { title: 'Usage', to: '/billing/usage', requiredRoles: ['HR'] },
          {
            title: 'Invoices',
            to: '/billing/invoices',
            requiredRoles: ['HR'],
          },
          {
            title: 'Payment',
            to: '/billing/payment',
            requiredRoles: ['HR'],
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
            requiredRoles: ['ADMIN'],
          },
          {
            title: 'Plans',
            to: '/platform/plans',
            requiredRoles: ['ADMIN'],
          },
          {
            title: 'Subscriptions',
            to: '/platform/subscriptions',
            requiredRoles: ['ADMIN'],
          },
          {
            title: 'Usage',
            to: '/platform/usage',
            requiredRoles: ['ADMIN'],
          },
          {
            title: 'Finance',
            to: '/platform/finance',
            requiredRoles: ['ADMIN'],
          },
          {
            title: 'Dunning',
            to: '/platform/dunning',
            requiredRoles: ['ADMIN'],
          },
          {
            title: 'Invoices',
            to: '/platform/invoices',
            requiredRoles: ['STAFF'],
          },
          {
            title: 'Payments',
            to: '/platform/payments',
            requiredRoles: ['STAFF'],
          },
          {
            title: 'Email Logs',
            to: '/platform/email-logs',
            requiredRoles: ['STAFF'],
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
            'fixed inset-y-0 left-0 z-30 flex w-64 flex-col -translate-x-full border-r border-[#e5e7eb] bg-[#fafafa] transition-transform duration-200 lg:static lg:translate-x-0',
            sidebarOpen && 'translate-x-0'
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-5">
            <span className="text-[15px] font-semibold tracking-tight text-[#111827]">
              SME Workspace
            </span>
            <button
              type="button"
              className="rounded-lg p-2 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {visibleSections.map((section) => {
              const hasChildren = section.children && section.children.length > 0
              const open = isSectionOpen(section)
              return (
                <div key={section.title} className="mb-4">
                  {section.to && !hasChildren ? (
                    <NavLink
                      to={section.to}
                      className={({ isActive }) =>
                        clsx(
                          'mb-1.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                          isActive
                            ? 'border-l-2 border-[#0071e3] bg-[#eff6ff] text-[#0071e3]'
                            : 'border-l-2 border-transparent text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827]'
                        )
                      }
                    >
                      <section.icon className="h-4 w-4 shrink-0 text-[#9ca3af]" />
                      {section.title}
                    </NavLink>
                  ) : hasChildren ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleSection(section.title)}
                        className="mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
                      >
                        <section.icon className="h-4 w-4 shrink-0 text-[#9ca3af]" />
                        <span className="flex-1">{section.title}</span>
                        {open ? (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        )}
                      </button>
                      {open && (
                        <div className="space-y-0.5 pl-1">
                          {section.children!.map((child) => (
                            <NavLink
                              key={child.title}
                              to={child.to}
                              className={({ isActive }) =>
                                clsx(
                                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                                  isActive
                                    ? 'border-l-2 border-[#0071e3] bg-[#eff6ff] text-[#0071e3]'
                                    : 'border-l-2 border-transparent text-[#4b5563] hover:bg-[#f3f4f6] hover:text-[#111827]'
                                )
                              }
                            >
                              {child.title}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              )
            })}
          </nav>

          <div className="shrink-0 border-t border-[#e5e7eb] bg-white px-3 py-3">
            <a
              href="/support"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
            >
              <LifeBuoy className="h-4 w-4" />
              Support
            </a>
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
              <button
                type="button"
                onClick={async () => {
                  try {
                    await logout()
                  } finally {
                    logoutStore()
                    navigate('/login', { replace: true })
                  }
                }}
                className="flex items-center gap-2 rounded-full border border-stroke px-3 py-2 text-sm text-muted transition hover:bg-slate-100 hover:text-ink"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </header>

          <main className="flex-1 space-y-6 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default AppLayout
