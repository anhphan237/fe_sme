import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useGlobalStore } from "@/stores/global.store";

interface BreadcrumbsProps {
  pathname: string;
}

export function Breadcrumbs({ pathname }: BreadcrumbsProps) {
  const breadcrumbs = useGlobalStore((s) => s.breadcrumbs);
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, index) => {
    const to = "/" + parts.slice(0, index + 1).join("/");
    const label =
      breadcrumbs[part] ??
      part
        .split("-")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" ");

    return { label, to };
  });

  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <Link to="/dashboard" className="font-medium text-ink">
        Home
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.to} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-ink">{crumb.label}</span>
        </span>
      ))}
    </div>
  );
}
