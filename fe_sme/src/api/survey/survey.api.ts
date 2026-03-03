import { gatewayRequest } from "../core/gateway";
import type {
  SurveyInstanceListRequest,
  SurveySatisfactionReportRequest,
} from "@/interface/survey";

/** com.sme.survey.instance.list */
export const apiGetSurveyInstances = (filters?: SurveyInstanceListRequest) =>
  gatewayRequest("com.sme.survey.instance.list", filters ?? {});

/** com.sme.survey.report.satisfaction */
export const apiGetSatisfactionReport = (
  payload: SurveySatisfactionReportRequest,
) => gatewayRequest("com.sme.survey.report.satisfaction", payload);
