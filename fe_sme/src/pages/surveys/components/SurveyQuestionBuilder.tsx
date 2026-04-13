import { Download, Plus, Upload } from "lucide-react";
import type { RefObject } from "react";

import BaseButton from "@/components/button";
import QuestionCard from "@/pages/surveys/components/QuestionCard";
import type { LocalQuestion } from "../types/survey-template-editor.types";

type OptionItem = {
  value: string;
  label: string;
};

type Props = {
  t: (key: string) => string;
  localQuestions: LocalQuestion[];
  validationErrors: string[];
  questionTypeOptions: OptionItem[];
  dimensionOptions: OptionItem[];
  importInputRef: RefObject<HTMLInputElement>;
  onChooseImportFile: () => void;
  onImportFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadSample: () => void;
  onAddQuestion: () => void;
  onUpdateQuestion: (
    uid: string,
    patch: Partial<LocalQuestion>,
  ) => void;
  onDeleteQuestion: (uid: string) => void;
  onDuplicateQuestion: (uid: string) => void;
  onMoveQuestion: (uid: string, direction: "up" | "down") => void;
  onAddOption: (uid: string) => void;
  onDeleteOption: (uid: string, optionIndex: number) => void;
  onUpdateOption: (
    uid: string,
    optionIndex: number,
    value: string,
  ) => void;
};

const SurveyQuestionBuilder = ({
  t,
  localQuestions,
  validationErrors,
  questionTypeOptions,
  dimensionOptions,
  importInputRef,
  onChooseImportFile,
  onImportFileChange,
  onDownloadSample,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onMoveQuestion,
  onAddOption,
  onDeleteOption,
  onUpdateOption,
}: Props) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            {t("survey.question.section_title") || "Questions"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {localQuestions.length}{" "}
            {localQuestions.length === 1
              ? t("survey.question.count_singular") || "question"
              : t("survey.question.count_plural") || "questions"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={onImportFileChange}
          />

          <BaseButton
            size="small"
            icon={<Download className="h-4 w-4" />}
            label="survey.question.download_sample"
            onClick={onDownloadSample}
          />

          <BaseButton
            size="small"
            icon={<Upload className="h-4 w-4" />}
            label="survey.question.import_excel"
            onClick={onChooseImportFile}
          />

          <BaseButton
            size="small"
            type="primary"
            icon={<Plus className="h-4 w-4" />}
            label="survey.question.add"
            onClick={onAddQuestion}
          />
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <div className="font-medium">
            {t("survey.template.validation.fix_before_save") ||
              "Please fix these issues before saving:"}
          </div>
          <ul className="mt-2 list-disc pl-5">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {localQuestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Plus className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-400">
            {t("survey.question.empty_hint") || "No questions yet."}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {t("survey.question.empty_hint_import") ||
              "You can add questions manually or quickly import from Excel."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {localQuestions.map((question, index) => (
            <QuestionCard
              key={question._uid}
              question={question}
              index={index}
              questionTypeOptions={questionTypeOptions}
              dimensionOptions={dimensionOptions}
              onChange={onUpdateQuestion}
              onDelete={onDeleteQuestion}
              onDuplicate={onDuplicateQuestion}
              onMoveUp={(uid) => onMoveQuestion(uid, "up")}
              onMoveDown={(uid) => onMoveQuestion(uid, "down")}
              onAddOption={onAddOption}
              onDeleteOption={onDeleteOption}
              onUpdateOption={onUpdateOption}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SurveyQuestionBuilder;