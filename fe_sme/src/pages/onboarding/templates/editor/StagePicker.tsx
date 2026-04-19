import { Modal } from "antd";
import { Check } from "lucide-react";
import { useLocale } from "@/i18n";
import {
  STAGE_ACCENTS,
  STAGE_META_ORDERED,
  getStageMeta,
  type StageMeta,
  type StageType,
} from "./constants";

export const StageChip = ({
  stage,
  size = "sm",
  showPhase = false,
  className = "",
}: {
  stage: string | undefined;
  size?: "xs" | "sm" | "md";
  showPhase?: boolean;
  className?: string;
}) => {
  const { t } = useLocale();
  const meta = getStageMeta(stage);
  const accent = STAGE_ACCENTS[meta.accent];

  const sizeCls =
    size === "xs"
      ? "text-[10px] px-1.5 py-0.5 gap-1"
      : size === "md"
        ? "text-xs px-2.5 py-1 gap-1.5"
        : "text-[11px] px-2 py-0.5 gap-1";

  return (
    <span
      className={`inline-flex items-center rounded-md border font-semibold uppercase tracking-wide ${accent.chip} ${sizeCls} ${className}`}>
      <span className="font-mono tracking-[0.08em]">{meta.code}</span>
      <span className="h-3 w-px bg-current opacity-30" />
      <span className="font-medium normal-case">{t(meta.dayRangeKey)}</span>
      {showPhase && (
        <>
          <span className="h-3 w-px bg-current opacity-30" />
          <span className="font-medium normal-case opacity-80">
            {t(meta.phaseKey)}
          </span>
        </>
      )}
    </span>
  );
};

export interface StagePickerModalProps {
  open: boolean;
  usedStages?: StageType[];
  onCancel: () => void;
  onPick: (meta: StageMeta) => void;
}

export const StagePickerModal = ({
  open,
  usedStages = [],
  onCancel,
  onPick,
}: StagePickerModalProps) => {
  const { t } = useLocale();

  const renderCard = (meta: StageMeta) => {
    const accent = STAGE_ACCENTS[meta.accent];
    const used = usedStages.includes(meta.value) && meta.value !== "CUSTOM";
    return (
      <button
        key={meta.value}
        type="button"
        onClick={() => onPick(meta)}
        className="group relative flex items-stretch gap-0 overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition hover:border-slate-300 hover:shadow-sm">
        {/* Thin vertical accent strip — replaces the emoji icon */}
        <span className={`w-1 shrink-0 ${accent.dot}`} />
        <div className="flex-1 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] ${accent.chip}`}>
              {meta.code}
            </span>
            {used && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                <Check className="h-3 w-3" />
                {t("onboarding.template.stage.picker.in_use")}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-ink">
            {t(meta.labelKey)}
          </p>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {t(meta.phaseKey)} · {t(meta.dayRangeKey)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {t(meta.descKey)}
          </p>
        </div>
      </button>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={720}
      title={
        <div>
          <p className="text-sm font-semibold text-ink">
            {t("onboarding.template.stage.picker.title")}
          </p>
          <p className="mt-0.5 text-xs font-normal text-muted">
            {t("onboarding.template.stage.picker.subtitle")}
          </p>
        </div>
      }>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {STAGE_META_ORDERED.map(renderCard)}
      </div>
    </Modal>
  );
};
