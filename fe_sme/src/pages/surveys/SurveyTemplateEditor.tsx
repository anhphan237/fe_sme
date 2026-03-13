import { useState } from "react";
import { useParams } from "react-router-dom";
import { PageHeader } from "@core/components/PageHeader";
import { Card } from "@core/components/ui/Card";
import { Button } from "@core/components/ui/Button";
import { Tabs } from "@core/components/ui/Tabs";

const SurveyTemplateEditor = () => {
  const { templateId } = useParams();
  const [activeQuestion, setActiveQuestion] = useState(0);
  const questions = [
    { label: "How supported do you feel?", type: "rating" },
    { label: "Most helpful resource", type: "multiple" },
    { label: "What can we improve?", type: "text" },
  ];

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title={templateId ? "Survey Template" : "New Survey Template"}
        subtitle="Build targeted surveys for key milestones."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold">Question list</h3>
          <div className="mt-4 space-y-2">
            {questions.map((question, index) => (
              <button
                key={question.label}
                className={`w-full rounded-2xl border px-4 py-2 text-left text-sm ${
                  index === activeQuestion
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-stroke text-muted"
                }`}
                onClick={() => setActiveQuestion(index)}>
                {question.label}
              </button>
            ))}
            <Button variant="secondary" className="w-full">
              Add question
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Question editor</h3>
          <div className="mt-4 space-y-4">
            <label className="grid gap-2 text-sm">
              Question
              <input
                className="rounded-2xl border border-stroke px-4 py-2"
                defaultValue={questions[activeQuestion].label}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Type
              <select className="rounded-2xl border border-stroke px-4 py-2">
                <option>rating</option>
                <option>multiple</option>
                <option>text</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              Options
              <input className="rounded-2xl border border-stroke px-4 py-2" />
            </label>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Preview</h3>
          <Tabs
            items={[
              { label: "Mobile", value: "mobile" },
              { label: "Desktop", value: "desktop" },
            ]}
            value="mobile"
            onChange={() => {}}
          />
        </div>
        <div className="mt-4 max-w-xs rounded-2xl border border-stroke bg-slate-50 p-4">
          <p className="text-sm font-semibold">
            {questions[activeQuestion].label}
          </p>
          <div className="mt-3 h-8 rounded-2xl border border-dashed border-stroke" />
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stroke bg-white/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <p className="text-sm text-muted">Unsaved changes</p>
          <Button>Save survey template</Button>
        </div>
      </div>
    </div>
  );
};

export default SurveyTemplateEditor;
