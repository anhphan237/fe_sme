import { type FC, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Copy,
  Plus,
  Trash2,
} from "lucide-react";
import { Input, InputNumber, Select, Switch } from "antd";

import BaseButton from "@/components/button";
import { useLocale } from "@/i18n";

export type QuestionType =
  | "RATING"
  | "TEXT"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE";

export interface LocalQuestion {
  _uid: string;
  questionId?: string;
  content: string;
  type: QuestionType;
  required: boolean;
  sortOrder: number;
  options: string[];
  dimensionCode?: string;
  measurable: boolean;
  scaleMin?: number;
  scaleMax?: number;
  isNew?: boolean;
  isDirty?: boolean;
}

interface OptionItem {
  value: string;
  label: string;
}

interface Props {
  question: LocalQuestion;
  index: number;
  questionTypeOptions: OptionItem[];
  dimensionOptions: OptionItem[];
  onChange: (uid: string, patch: Partial<LocalQuestion>) => void;
  onDelete: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onMoveUp: (uid: string) => void;
  onMoveDown: (uid: string) => void;
  onAddOption: (uid: string) => void;
  onDeleteOption: (uid: string, optionIndex: number) => void;
  onUpdateOption: (uid: string, optionIndex: number, value: string) => void;
}

const TYPE_COLOR: Record<QuestionType, string> = {
  RATING: "bg-sky-100 text-sky-700",
  TEXT: "bg-slate-100 text-slate-600",
  SINGLE_CHOICE: "bg-cyan-100 text-cyan-700",
  MULTIPLE_CHOICE: "bg-violet-100 text-violet-700",
};

const TYPE_LABEL_FALLBACK: Record<QuestionType, string> = {
  RATING: "Rating",
  TEXT: "Text",
  SINGLE_CHOICE: "Single choice",
  MULTIPLE_CHOICE: "Multiple choice",
};

const QuestionCard: FC<Props> = ({
  question,
  index,
  questionTypeOptions,
  dimensionOptions,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onAddOption,
  onDeleteOption,
  onUpdateOption,
}) => {
  const { t } = useLocale();
  const [open, setOpen] = useState(true);

  const isChoiceType =
    question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE";
  const isRatingType = question.type === "RATING";

  const title =
    question.content?.trim() || `${t("survey.question.label") || "Question"} ${index + 1}`;

  const typeLabel = useMemo(() => {
    return (
      questionTypeOptions.find((item) => item.value === question.type)?.label ||
      TYPE_LABEL_FALLBACK[question.type]
    );
  }, [question.type, questionTypeOptions]);

  const normalizedOptions = Array.isArray(question.options) ? question.options : [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#223A59] text-xs font-semibold text-white">
            {index + 1}
          </span>

          <span className="truncate text-sm font-semibold text-slate-700">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_COLOR[question.type]}`}
          >
            {typeLabel}
          </span>

          {question.required && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-500">
              {t("survey.question.required") || "Required"}
            </span>
          )}

          <button
            type="button"
            className="rounded p-1 text-slate-400 hover:bg-slate-50"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            className="rounded p-1 text-slate-300 hover:bg-slate-50 hover:text-slate-500"
            onClick={() => onMoveUp(question._uid)}
          >
            <ArrowUp className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="rounded p-1 text-slate-300 hover:bg-slate-50 hover:text-slate-500"
            onClick={() => onMoveDown(question._uid)}
          >
            <ArrowDown className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="rounded p-1 text-slate-300 hover:bg-slate-50 hover:text-slate-500"
            onClick={() => onDuplicate(question._uid)}
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
            onClick={() => onDelete(question._uid)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("survey.question.content_label") || "Content"}:
            </label>
            <Input.TextArea
              value={question.content}
              rows={3}
              onChange={(e) =>
                onChange(question._uid, { content: e.target.value })
              }
              placeholder={
                t("survey.question.content_placeholder") ||
                "Enter question content"
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t("survey.question.type_label") || "Type"}:
              </label>
              <Select
                className="w-full"
                value={question.type}
                options={questionTypeOptions}
                onChange={(value) =>
                  onChange(question._uid, { type: value as QuestionType })
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {t("survey.question.dimension_label") || "Dimension"}:
              </label>
              <Select
                className="w-full"
                value={question.dimensionCode}
                options={dimensionOptions}
                onChange={(value) =>
                  onChange(question._uid, { dimensionCode: value })
                }
                placeholder={t("global.select") || "Select"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
            <Switch
              checked={question.required}
              onChange={(checked) =>
                onChange(question._uid, { required: checked })
              }
            />
            <span>{t("survey.question.required") || "Required"}</span>
          </div>

                      <div className="flex items-center gap-2">
            <Switch
              checked={question.measurable}
              disabled={question.type === "TEXT"}
              onChange={(checked) =>
                onChange(question._uid, { measurable: checked })
              }
            />
            <span>{t("survey.question.measurable") || "Measurable"}</span>
          </div>
          </div>

          {isRatingType && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t("survey.question.scale_min") || "Scale min"}
                </label>
                <InputNumber
                  className="w-full"
                  min={0}
                  value={question.scaleMin}
                  onChange={(value) =>
                    onChange(question._uid, {
                      scaleMin: typeof value === "number" ? value : 1,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {t("survey.question.scale_max") || "Scale max"}
                </label>
                <InputNumber
                  className="w-full"
                  min={1}
                  value={question.scaleMax}
                  onChange={(value) =>
                    onChange(question._uid, {
                      scaleMax: typeof value === "number" ? value : 5,
                    })
                  }
                />
              </div>
            </div>
          )}

          {isChoiceType && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  {t("survey.question.options_label") || "Options"}
                </label>

                <BaseButton
                  size="small"
                  icon={<Plus className="h-4 w-4" />}
                  label="survey.question.add_option"
                  onClick={() => onAddOption(question._uid)}
                />
              </div>

              <div className="space-y-2">
                {normalizedOptions.map((option, optionIndex) => (
                  <div
                    key={`${question._uid}-${optionIndex}`}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={option}
                      onChange={(e) =>
                        onUpdateOption(
                          question._uid,
                          optionIndex,
                          e.target.value,
                        )
                      }
                      placeholder={`${
                        t("survey.question.option") || "Option"
                      } ${optionIndex + 1}`}
                    />

                    <button
                      type="button"
                      className="rounded p-2 text-slate-300 hover:bg-red-50 hover:text-red-500"
                      onClick={() =>
                        onDeleteOption(question._uid, optionIndex)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-slate-400">
            sortOrder: {question.sortOrder} • id: {question.questionId || "new"}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;