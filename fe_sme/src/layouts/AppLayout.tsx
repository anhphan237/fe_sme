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

interface AppLayoutProps {
  children: ReactNode
}

function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const role = useAppStore((state) => state.role)
  const location = useLocation()

  const navSections = useMemo(
    () => [
      {
        title: 'Dashboard',
        icon: Gauge,
        to: '/dashboard',
      },
      {
        title: 'Onboarding',
        icon: ClipboardCheck,
        children: [
          { title: 'Templates', to: '/onboarding/templates' },
          { title: 'Employees', to: '/onboarding/employees' },
        ],
      },
      {
        title: 'Documents',
        icon: FileText,
        children: [
          { title: 'Library', to: '/documents' },
          { title: 'Acknowledgments', to: '/documents/acknowledgments' },
        ],
      },
      {
        title: 'Surveys',
        icon: LayoutGrid,
        children: [
          { title: 'Templates', to: '/surveys/templates' },
          { title: 'Send', to: '/surveys/send' },
          { title: 'Inbox', to: '/surveys/inbox' },
          { title: 'Reports', to: '/surveys/reports' },
        ],
      },
      {
        title: 'Chatbot',
        icon: Bot,
        to: '/chatbot',
      },
      {
        title: 'Billing',
        icon: Banknote,
        children: [
          { title: 'Plan', to: '/billing/plan' },
          { title: 'Usage', to: '/billing/usage' },
          { title: 'Invoices', to: '/billing/invoices' },
          { title: 'Payment', to: '/billing/payment' },
        ],
      },
      {
        title: 'Admin',
        icon: Shield,
        children: [
          { title: 'Users', to: '/admin/users' },
          { title: 'Roles', to: '/admin/roles' },
          { title: 'Knowledge Base', to: '/admin/knowledge-base' },
        ],
      },
      {
        title: 'Super Admin',
        icon: Briefcase,
        to: '/super-admin',
        hidden: role !== 'Super Admin',
      },
    ],
    [role]
  )

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
            {navSections
              .filter((section) => !section.hidden)
              .map((section) => (
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

