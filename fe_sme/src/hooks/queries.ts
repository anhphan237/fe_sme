import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getTenants,
  updateTenant,
} from '../shared/api/tenants'
import { getUsers, inviteUser, updateUser } from '../shared/api/users'
import { getRoles, updateRole } from '../shared/api/roles'
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
  getDiscountCodes,
  createDiscountCode,
} from '../shared/api/superAdmin'
import { chatbotQuery } from '../shared/api/chatbot'

export const useTenantsQuery = () => useQuery({ queryKey: ['tenants'], queryFn: getTenants })
export const useUpdateTenant = () => useMutation({ mutationFn: updateTenant })

export const useUsersQuery = () => useQuery({ queryKey: ['users'], queryFn: getUsers })
export const useInviteUser = () => useMutation({ mutationFn: inviteUser })
export const useUpdateUser = () => useMutation({ mutationFn: updateUser })

export const useRolesQuery = () => useQuery({ queryKey: ['roles'], queryFn: getRoles })
export const useUpdateRole = () => useMutation({ mutationFn: updateRole })

export const useTemplatesQuery = () =>
  useQuery({ queryKey: ['templates'], queryFn: getTemplates })
export const useTemplateQuery = (id?: string) =>
  useQuery({
    queryKey: ['template', id],
    queryFn: () => getTemplate(id ?? ''),
    enabled: Boolean(id),
  })
export const useSaveTemplate = () => useMutation({ mutationFn: saveTemplate })

export const useInstancesQuery = () =>
  useQuery({ queryKey: ['instances'], queryFn: getInstances })
export const useStartInstance = () => useMutation({ mutationFn: startInstance })
export const useSaveEvaluation = () => useMutation({ mutationFn: saveEvaluation })

export const useDocumentsQuery = () =>
  useQuery({ queryKey: ['documents'], queryFn: getDocuments })
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
export const useDiscountCodesQuery = () =>
  useQuery({ queryKey: ['sa-discounts'], queryFn: getDiscountCodes })
export const useCreateDiscountCode = () =>
  useMutation({ mutationFn: createDiscountCode })

