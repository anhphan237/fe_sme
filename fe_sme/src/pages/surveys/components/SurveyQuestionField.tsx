import type { FC } from "react";
import BaseSelect from "@core/components/Select/BaseSelect";
import BaseTextArea from "@core/components/TextArea/BaseTextArea";
import type { SurveyQuestion } from "@/interface/survey";

interface Props {
  question: SurveyQuestion & {
    content?: string;
    text?: string;
    options?: string[];
    scaleMin?: number;
    scaleMax?: number;
  };
}

const SurveyQuestionField: FC<Props> = ({ question }) => {
  const label = question.content || question.text || "";
  const rules = question.required ? [{ required: true }] : [];

  const scaleMin = Number.isInteger(question.scaleMin) ? question.scaleMin! : 1;
  const scaleMax = Number.isInteger(question.scaleMax) ? question.scaleMax! : 5;

  const ratingOptions = Array.from(
    { length: Math.max(scaleMax - scaleMin + 1, 1) },
    (_, index) => {
      const value = scaleMin + index;
      return {
        value: String(value),
        label: String(value),
      };
    },
  );

  if (question.type === "RATING") {
    return (
      <BaseSelect
        name={question.questionId}
        label={label}
        options={ratingOptions}
        placeholder="—"
        formItemProps={{ rules }}
      />
    );
  }

  if (
    question.type === "MULTIPLE_CHOICE" ||
    question.type === "SINGLE_CHOICE"
  ) {
    const options = (question.options ?? []).map((option) => ({
      value: option,
      label: option,
    }));

    return (
      <BaseSelect
        name={question.questionId}
        label={label}
        options={options}
        mode={question.type === "MULTIPLE_CHOICE" ? "multiple" : undefined}
        placeholder="—"
        formItemProps={{ rules }}
      />
    );
  }

  return (
    <BaseTextArea
      name={question.questionId}
      label={label}
      rows={3}
      formItemProps={{ rules }}
    />
  );
};

export default SurveyQuestionField;