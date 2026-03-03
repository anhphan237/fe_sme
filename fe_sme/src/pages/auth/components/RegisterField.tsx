import type { ReactNode } from "react";

export const INPUT_CLS =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10";

export const SELECT_CLS =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 transition-all focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 appearance-none cursor-pointer";

export interface RegisterFieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function RegisterField({
  label,
  hint,
  error,
  children,
}: RegisterFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-semibold text-gray-700">
          {label}
        </label>
        {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
      </div>

      {children}

      {error && (
        <p className="flex items-center gap-1 text-[12px] text-red-500">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M8 5v4M8 11v.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
