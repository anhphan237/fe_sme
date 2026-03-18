import { type FC, useState } from "react";
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from "lucide-react";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import BaseCheckbox from "@core/components/Checkbox";
import BaseTextArea from "@core/components/TextArea/BaseTextArea";
import { useLocale } from "@/i18n";

const QUESTION_TYPE_OPTIONS = [
  { value: "RATING", label: "Rating" },
  { value: "TEXT", label: "Text" },
  { value: "MULTIPLE_CHOICE", label: "Multiple choice" },
  { value: "SINGLE_CHOICE", label: "Single choice" },
];

const TYPE_COLOR: Record<string, string> = {
  RATING: "bg-blue-50 text-blue-600",
  TEXT: "bg-slate-100 text-slate-500",
  MULTIPLE_CHOICE: "bg-violet-50 text-violet-600",
  SINGLE_CHOICE: "bg-cyan-50 text-cyan-600",
};

export interface LocalQuestion {
  _uid: string;
  text: string;
  type: "RATING" | "TEXT" | "MULTIPLE_CHOICE" | "SINGLE_CHOICE";
  required: boolean;
  options: string;
}

interface Props {
  question: LocalQuestion;
  index: number;
  onChange: (uid: string, patch: Partial<LocalQuestion>) => void;
  onDelete: (uid: string) => void;
}

const QuestionCard: FC<Props> = ({ question, index, onChange, onDelete }) => {
  const { t } = useLocale();
  const [open, setOpen] = useState(true);

  return (
    <div className="group rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* drag handle visual */}
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-300 group-hover:text-slate-400" />

        {/* number badge */}
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#223A59] text-[10px] font-bold text-white">
          {index + 1}
        </span>

        {/* expand/collapse + title */}
        <button
          type="button"
          className="flex flex-1 items-center gap-2 overflow-hidden text-left"
          onClick={() => setOpen(!open)}>
          <span className="flex-1 truncate text-sm font-medium text-[#223A59]">
            {question.text || (
              <span className="italic text-slate-400">
                {t("survey.question.untitled")}
              </span>
            )}
          </span>
          {/* type badge */}
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              TYPE_COLOR[question.type] ?? "bg-slate-100 text-slate-500"
            }`}>
            {question.type.replace(/_/g, " ")}
          </span>
          {question.required && (
            <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-500">
              Required
            </span>
          )}
          <span className="shrink-0 text-slate-400">
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        </button>

        {/* delete */}
        <button
          type="button"
          className="shrink-0 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
          onClick={() => onDelete(question._uid)}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Body ── */}
      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          <BaseInput
            name={`q_text_${question._uid}`}
            label={t("survey.question.text")}
            value={question.text}
            onChange={(e) => onChange(question._uid, { text: e.target.value })}
          />
          {/* type + required in one row */}
          <div className="grid grid-cols-2 gap-3">
            <BaseSelect
              name={`q_type_${question._uid}`}
              label={t("survey.question.type")}
              options={QUESTION_TYPE_OPTIONS}
              value={question.type}
              onChange={(v) =>
                onChange(question._uid, { type: v as LocalQuestion["type"] })
              }
            />
            <div className="flex items-end pb-1">
              <BaseCheckbox
                name={`q_req_${question._uid}`}
                labelCheckbox={t("survey.question.required")}
                checked={question.required}
                onChange={(e) =>
                  onChange(question._uid, { required: e.target.checked })
                }
              />
            </div>
          </div>
          {(question.type === "MULTIPLE_CHOICE" ||
            question.type === "SINGLE_CHOICE") && (
            <BaseTextArea
              name={`q_opts_${question._uid}`}
              label={t("survey.question.options")}
              rows={3}
              placeholder="Option A, Option B, Option C"
              value={question.options}
              onChange={(e) =>
                onChange(question._uid, { options: e.target.value })
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
