import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";

interface BrandLogoProps {
  variant?: "compact" | "full";
  asLink?: boolean;
  to?: string;
}

const LogoSvg = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className}>
    <rect
      x="3"
      y="2"
      width="14"
      height="16"
      rx="2.5"
      stroke="white"
      strokeWidth="1.5"
    />
    <path
      d="M7 7h6M7 10.5h6M7 14h4"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const LogoSvgWithBadge = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className}>
    <rect
      x="3"
      y="2"
      width="14"
      height="16"
      rx="2.5"
      stroke="white"
      strokeWidth="1.5"
    />
    <path
      d="M7 7h6M7 10.5h6M7 14h4"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="15" cy="15" r="3.5" fill="white" />
    <path
      d="M13.5 15l1 1 2-1.5"
      stroke="#6C63FF"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Compact variant — small logo for top bar (mobile) */
const CompactLogo = () => (
  <div className="flex items-center gap-2">
    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand to-brandDark flex items-center justify-center">
      <LogoSvg className="w-3 h-3" />
    </div>
    <span className="text-[14px] font-bold text-gray-900">
      Onboard<span className="text-brand">IQ</span>
    </span>
  </div>
);

/** Full variant — large logo with subtitle for sidebar */
const FullLogo = () => {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-9 h-9">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand to-brandDark opacity-90 shadow-md shadow-brand/30" />
        <div className="relative flex items-center justify-center w-full h-full">
          <LogoSvgWithBadge className="w-[18px] h-[18px]" />
        </div>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[17px] font-bold text-white tracking-tight">
          Onboard<span className="text-brand">IQ</span>
        </span>
        <span className="text-[9px] font-semibold text-white/40 uppercase tracking-[0.2em]">
          {t("app.platform_subtitle", { defaultValue: "SME Platform" })}
        </span>
      </div>
    </div>
  );
};

const BrandLogo = ({
  variant = "compact",
  asLink = true,
  to = "/",
}: BrandLogoProps) => {
  const inner = variant === "full" ? <FullLogo /> : <CompactLogo />;

  if (!asLink) return <>{inner}</>;

  return (
    <Link to={to} className="group w-fit">
      {inner}
    </Link>
  );
};

export default BrandLogo;
