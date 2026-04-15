import { Modal } from "antd";
import { useRef } from "react";
import { useLocale } from "@/i18n";
import { notify } from "@/utils/notify";
import {
  parseExcelQuestionsFromFile,
  type ParsedExcelQuestion,
} from "../utils/survey-excel-import.utils";

type ImportMode = "APPEND" | "REPLACE_ALL";

type UseSurveyExcelImportParams = {
  onImportQuestions: (
    questions: ParsedExcelQuestion[],
    mode: ImportMode,
  ) => void;
  sampleTemplateUrl?: string;
};

export const useSurveyExcelImport = ({
  onImportQuestions,
  sampleTemplateUrl = "/files/survey_questions_template.xlsx",
}: UseSurveyExcelImportParams) => {
  const { t } = useLocale();
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadSample = () => {
    try {
      const link = document.createElement("a");
      link.href = sampleTemplateUrl;
      link.download = "survey_questions_template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      notify.error(
        t("survey.question.sample_download_failed") ||
          "Cannot download sample file",
      );
    }
  };

  const handleChooseImportFile = () => {
    importInputRef.current?.click();
  };

  const handleImportFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      notify.error(
        t("survey.question.import_invalid_file") ||
          "Please select a valid .xlsx file",
      );
      return;
    }

    try {
      const importedRows = await parseExcelQuestionsFromFile(file);

      if (!importedRows.length) {
        notify.error(
          t("survey.question.import_failed") || "Import questions failed",
        );
        return;
      }

      Modal.confirm({
        title:
          t("survey.question.import_dialog_title") ||
          "Import questions from Excel",
        content:
          t("survey.question.import_dialog_content") ||
          "Choose how to import questions into this survey template.",
        okText: t("survey.question.import_append") || "Append",
        cancelText: t("survey.question.import_replace_all") || "Replace all",
        onOk: async () => {
          onImportQuestions(importedRows, "APPEND");
          notify.success(
            t("survey.question.import_success") ||
              "Import questions successfully",
          );
        },
        onCancel: async () => {
          onImportQuestions(importedRows, "REPLACE_ALL");
          notify.success(
            t("survey.question.import_success") ||
              "Import questions successfully",
          );
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("survey.question.import_failed") || "Import questions failed";
      notify.error(message);
    }
  };

  return {
    importInputRef,
    handleDownloadSample,
    handleChooseImportFile,
    handleImportFileChange,
  };
};