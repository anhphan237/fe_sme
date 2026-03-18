import type { FC } from "react";
import BaseSelect from "@core/components/Select/BaseSelect";
import BaseTextArea from "@core/components/TextArea/BaseTextArea";
import type { SurveyQuestion } from "@/interface/survey";

const RATING_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: String(n),
}));

interface Props {
  question: SurveyQuestion;
}

const SurveyQuestionField: FC<Props> = ({ question: q }) => {
  const rules = q.required ? [{ required: true }] : [];

  if (q.type === "RATING") {
    return (
      <BaseSelect
        name={q.questionId}
        label={q.text}
        options={RATING_OPTIONS}
        placeholder="—"
        formItemProps={{ rules }}
      />
    );
  }

  if (q.type === "MULTIPLE_CHOICE" || q.type === "SINGLE_CHOICE") {
    return (
      <BaseSelect
        name={q.questionId}
        label={q.text}
        options={(q.options ?? []).map((o) => ({ value: o, label: o }))}
        mode={q.type === "MULTIPLE_CHOICE" ? "multiple" : undefined}
        placeholder="—"
        formItemProps={{ rules }}
      />
    );
  }

  return (
    <BaseTextArea
      name={q.questionId}
      label={q.text}
      rows={3}
      formItemProps={{ rules }}
    />
  );
};

export default SurveyQuestionField;
