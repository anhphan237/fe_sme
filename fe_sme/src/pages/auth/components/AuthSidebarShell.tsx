import type { ReactNode } from "react";

/**
 * Shared dark-gradient shell used by both Login and Register sidebars.
 * Renders the background (gradient + radial glows + grid overlay) and
 * wraps children in a full-height flex column with consistent padding.
 */
interface AuthSidebarShellProps {
  children: ReactNode;
  className?: string;
}

export const AuthSidebarShell = ({
  children,
  className = "",
}: AuthSidebarShellProps) => (
  <aside
    className={`hidden lg:flex flex-col w-[360px] xl:w-[420px] shrink-0 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden ${className}`}>
    {/* Radial glow accents */}
    <div
      className="absolute inset-0 opacity-20 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(circle at 30% 20%, #3b82f620 0%, transparent 60%),
                          radial-gradient(circle at 80% 80%, #7c3aed20 0%, transparent 60%)`,
      }}
    />
    {/* Subtle grid overlay */}
    <div
      className="absolute inset-0 opacity-[0.04] pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }}
    />

    <div className="relative flex flex-col h-full px-10 py-10">{children}</div>
  </aside>
);
