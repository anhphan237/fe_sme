import { Checkbox, Radio, Input } from "antd";
import type {
  AnswerValue,
  SurveyAnswerQuestion,
} from "../types/survey-detail.types";

const { TextArea } = Input;

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
      <TextArea
        placeholder="Enter your answer"
        value={typeof value === "string" ? value : value == null ? "" : String(value)}
        disabled={disabled}
        autoSize={{ minRows: 5, maxRows: 8 }}
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
        value={typeof value === "string" ? value : undefined}
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
          value={Array.isArray(value) ? value : []}
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
    const numericValue =
      typeof value === "number"
        ? value
        : Number.isNaN(Number(value))
          ? undefined
          : Number(value);

    return (
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(
          (num) => {
            const active = numericValue === num;

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
    <TextArea
      placeholder="Enter your answer"
      value={typeof value === "string" ? value : value == null ? "" : String(value)}
      disabled={disabled}
      autoSize={{ minRows: 5, maxRows: 8 }}
      onChange={(e) => {
        if (disabled) return;
        onChange(e?.target?.value ?? "");
      }}
    />
  );
};

export default SurveyQuestionAnswerField;