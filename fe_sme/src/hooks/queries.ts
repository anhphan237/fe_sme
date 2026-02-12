import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getTenants,
  updateTenant,
} from '../shared/api/tenants'
import { getUsers, inviteUser, updateUser } from '../shared/api/users'
import { getRoles, updateRole } from '../shared/api/roles'
import { getDepartments } from '../shared/api/departments'
import {
  getTemplates,
  getTemplate,
  getInstances,
  startInstance,
  saveTemplate,
  saveEvaluation,
} from '../shared/api/onboarding'
import {
  getDocuments,
  getDocument,
  getAcknowledgments,
  saveDocument,
  acknowledgeDocument,
} from '../shared/api/documents'
import {
  getSurveyTemplates,
  getSurveyInstances,
  saveSurveyTemplate,
  saveSurveyResponse,
  getSurveyInstance,
} from '../shared/api/surveys'
import {
  getPlans,
  getUsage,
  getInvoices,
  getSubscription,
  updateSubscription,
  connectPayment,
} from '../shared/api/billing'
import {
  getSaTenants,
  getSaFinance,
  getPlatformSubscriptionMetrics,
} from '../shared/api/superAdmin'
import { chatbotQuery } from '../shared/api/chatbot'

export const useTenantsQuery = (enabled = true) =>
  useQuery({ queryKey: ['tenants'], queryFn: getTenants, enabled })
export const useUpdateTenant = () => useMutation({ mutationFn: updateTenant })

export const useUsersQuery = () => useQuery({ queryKey: ['users'], queryFn: getUsers })
export const useInviteUser = () => useMutation({ mutationFn: inviteUser })
export const useUpdateUser = () => useMutation({ mutationFn: updateUser })

export const useRolesQuery = () => useQuery({ queryKey: ['roles'], queryFn: getRoles })
export const useUpdateRole = () => useMutation({ mutationFn: updateRole })

export const useDepartmentsQuery = () =>
  useQuery({ queryKey: ['departments'], queryFn: getDepartments })

export const useTemplatesQuery = () =>
  useQuery({ queryKey: ['templates'], queryFn: getTemplates })
export const useTemplateQuery = (id?: string) =>
  useQuery({
    queryKey: ['template', id],
    queryFn: () => getTemplate(id ?? ''),
    enabled: Boolean(id),
  })
export const useSaveTemplate = () => useMutation({ mutationFn: saveTemplate })

export const useInstancesQuery = (enabled = true) =>
  useQuery({ queryKey: ['instances'], queryFn: getInstances, enabled })
export const useStartInstance = () => useMutation({ mutationFn: startInstance })
export const useSaveEvaluation = () => useMutation({ mutationFn: saveEvaluation })

export const useDocumentsQuery = (enabled = true) =>
  useQuery({ queryKey: ['documents'], queryFn: getDocuments, enabled })
export const useDocumentQuery = (id?: string) =>
  useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocument(id ?? ''),
    enabled: Boolean(id),
  })
export const useSaveDocument = () => useMutation({ mutationFn: saveDocument })
export const useAcknowledgmentsQuery = () =>
  useQuery({ queryKey: ['acknowledgments'], queryFn: getAcknowledgments })
export const useAcknowledgeDocument = () =>
  useMutation({ mutationFn: acknowledgeDocument })

export const useSurveyTemplatesQuery = () =>
  useQuery({ queryKey: ['survey-templates'], queryFn: getSurveyTemplates })
export const useSaveSurveyTemplate = () =>
  useMutation({ mutationFn: saveSurveyTemplate })
export const useSurveyInstancesQuery = () =>
  useQuery({ queryKey: ['survey-instances'], queryFn: getSurveyInstances })
export const useSurveyInstanceQuery = (id?: string) =>
  useQuery({
    queryKey: ['survey-instance', id],
    queryFn: () => getSurveyInstance(id ?? ''),
    enabled: Boolean(id),
  })
export const useSaveSurveyResponse = () =>
  useMutation({ mutationFn: saveSurveyResponse })

export const useChatbotQuery = () => useMutation({ mutationFn: chatbotQuery })

export const usePlansQuery = () => useQuery({ queryKey: ['plans'], queryFn: getPlans })
export const useUsageQuery = () => useQuery({ queryKey: ['usage'], queryFn: getUsage })
export const useInvoicesQuery = () => useQuery({ queryKey: ['invoices'], queryFn: getInvoices })
export const useSubscriptionQuery = () =>
  useQuery({ queryKey: ['subscription'], queryFn: getSubscription })
export const useUpdateSubscription = () =>
  useMutation({ mutationFn: updateSubscription })
export const useConnectPayment = () => useMutation({ mutationFn: connectPayment })

export const useSaTenantsQuery = () =>
  useQuery({ queryKey: ['sa-tenants'], queryFn: getSaTenants })
export const useSaFinanceQuery = () =>
  useQuery({ queryKey: ['sa-finance'], queryFn: getSaFinance })
export const usePlatformSubscriptionMetrics = (startDate: string, endDate: string, enabled = true) =>
  useQuery({
    queryKey: ['platform-subscription-metrics', startDate, endDate],
    queryFn: () => getPlatformSubscriptionMetrics({ startDate, endDate }),
    enabled: Boolean(startDate && endDate && enabled),
  })

