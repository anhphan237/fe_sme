import { Link } from "react-router-dom";
import { Card } from "@core/components/ui/Card";

const Forbidden = () => {
  return (
    <div className="relative mx-auto flex min-h-[80vh] max-w-5xl items-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 left-10 h-56 w-56 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="absolute bottom-0 right-8 h-64 w-64 rounded-full bg-emerald-200/60 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.06),transparent_55%)]" />
      </div>
      <Card className="w-full overflow-hidden">
        <div className="grid gap-8 px-8 py-10 sm:grid-cols-[1.2fr_0.8fr] sm:px-10">
          <div>
            <div className="inline-flex items-center rounded-full border border-stroke bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Access restricted
            </div>
            <h1 className="mt-5 text-3xl font-semibold text-ink sm:text-4xl">
              403 - Access denied
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
              You do not have permission to view this page. If you believe this
              is a mistake, contact your company admin to request access.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:translate-y-[-1px] hover:bg-ink/90">
                Back to dashboard
              </Link>
              <span className="text-xs text-muted">
                Your role does not include this feature.
              </span>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl border border-stroke/70 bg-white/70" />
            <div className="relative flex flex-col items-center gap-4 px-6 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <span className="text-lg font-semibold">403</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">
                  Secure workspace
                </p>
                <p className="mt-1 text-xs text-muted">
                  Access is managed by your organization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Forbidden;
