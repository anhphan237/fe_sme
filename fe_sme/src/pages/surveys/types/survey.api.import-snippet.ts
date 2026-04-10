import { gatewayRequest } from "@/api/core/gateway";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function apiImportSurveyQuestions(params: {
  templateId: string;
  mode?: "APPEND" | "REPLACE_ALL";
  file: File;
}) {
  const fileBase64 = await fileToBase64(params.file);

  return gatewayRequest({
    operationType: "com.sme.survey.question.import",
    payload: {
      templateId: params.templateId,
      mode: params.mode ?? "APPEND",
      fileName: params.file.name,
      fileBase64,
    },
  });
}
