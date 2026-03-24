import { Checkbox, Radio } from "antd";
import BaseTextArea from "@core/components/TextArea/BaseTextArea";
import type {
  AnswerValue,
  SurveyAnswerQuestion,
} from "../types/survey-detail.types";

type Props = {
  question: SurveyAnswerQuestion;
  value?: AnswerValue;
  disabled?: boolean;
  onChange: (value: AnswerValue) => void;
};

const SurveyQuestionAnswerField = ({
  question,
  value,
  disabled = false,
  onChange,
}: Props) => {
  const type = String(question.type || "").toUpperCase();
  const options = question.options ?? [];

  if (type === "TEXT") {
    return (
      <BaseTextArea
        name={question.questionId}
        placeholder="Enter your answer"
        value={(value as string) ?? ""}
        disabled={disabled}
        onChange={(e) => {
          if (disabled) return;
          onChange(e?.target?.value ?? "");
        }}
      />
    );
  }

  if (type === "CHOICE" || type === "SINGLE_CHOICE" || type === "RADIO") {
    return (
      <Radio.Group
        className="flex flex-col gap-3"
        value={(value as string) ?? undefined}
        disabled={disabled}
        onChange={(e) => {
          if (disabled) return;
          onChange(e.target.value);
        }}
      >
        {options.map((option) => (
          <Radio key={option} value={option}>
            {option}
          </Radio>
        ))}
      </Radio.Group>
    );
  }

  if (
    type === "MULTIPLE_CHOICE" ||
    type === "MULTI_CHOICE" ||
    type === "CHECKBOX"
  ) {
    return (
      <div className="flex flex-col gap-3">
        <Checkbox.Group
          value={(value as string[]) ?? []}
          disabled={disabled}
          onChange={(vals) => {
            if (disabled) return;
            onChange(vals as string[]);
          }}
          className="flex flex-col gap-3"
        >
          {options.map((option) => (
            <div
              key={option}
              className={`rounded-xl border px-4 py-3 transition ${
                disabled
                  ? "border-slate-200 bg-slate-50"
                  : "border-slate-200 hover:border-[#3684DB]"
              }`}
            >
              <Checkbox value={option}>{option}</Checkbox>
            </div>
          ))}
        </Checkbox.Group>
      </div>
    );
  }

  if (type === "RATING") {
    const min = question.scaleMin ?? 1;
    const max = question.scaleMax ?? 5;

    return (
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(
          (num) => {
            const active = value === num;

            return (
              <button
                key={num}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  onChange(num);
                }}
                className={`h-12 w-12 rounded-xl border text-sm font-semibold transition ${
                  active
                    ? "border-[#3684DB] bg-[#3684DB] text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600"
                } ${
                  disabled
                    ? "cursor-not-allowed opacity-70"
                    : "hover:border-[#3684DB]"
                }`}
              >
                {num}
              </button>
            );
          },
        )}
      </div>
    );
  }

  return (
    <BaseTextArea
      name={question.questionId}
      placeholder="Enter your answer"
      value={(value as string) ?? ""}
      disabled={disabled}
      onChange={(e) => {
        if (disabled) return;
        onChange(e?.target?.value ?? "");
      }}
    />
  );
};

export default SurveyQuestionAnswerField;