import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getTenants,
  updateTenant,
} from '../shared/api/tenants'
import { getUsers, getUserDetail, inviteUser, createUser, updateUser } from '../shared/api/users'
import { getRoles, updateRole } from '../shared/api/roles'
import { getDepartments } from '../shared/api/departments'
import {
  getTemplates,
  getTemplate,
  getInstances,
  getInstance,
  startInstance,
  saveTemplate,
  deleteTemplate,
  saveEvaluation,
  getOnboardingTasksByInstance,
  updateOnboardingTaskStatus,
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
  getInvoice,
  getSubscription,
  createSubscription,
  updateSubscription,
  connectPayment,
  createPaymentIntent,
  getPaymentProviders,
  getPaymentStatus,
  getPaymentTransactions,
  trackUsage,
  getUsageSummary,
  generateInvoice,
  dunningRetry,
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
export const useUserDetailQuery = (userId: string | undefined) =>
  useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => getUserDetail(userId!),
    enabled: Boolean(userId),
  })
export const useInviteUser = () => useMutation({ mutationFn: inviteUser })
export const useCreateUser = () => useMutation({ mutationFn: createUser })
export const useUpdateUser = () =>
  useMutation({
    mutationFn: (v: { id: string; name?: string; phone?: string }) =>
      updateUser(v.id, { name: v.name, phone: v.phone } as Partial<import('../shared/types').User>),
  })

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
    enabled: Boolean(id) && id !== 'new',
  })
export const useSaveTemplate = () => useMutation({ mutationFn: saveTemplate })
export const useDeleteTemplate = () => useMutation({ mutationFn: deleteTemplate })

export const useInstancesQuery = (filters?: { employeeId?: string; status?: string }, enabled = true) =>
  useQuery({
    queryKey: ['instances', filters?.employeeId ?? '', filters?.status ?? 'ACTIVE'],
    queryFn: () => getInstances(filters?.employeeId, filters?.status ?? 'ACTIVE'),
    enabled,
  })
export const useInstanceQuery = (instanceId: string | undefined) =>
  useQuery({
    queryKey: ['instance', instanceId],
    queryFn: () => getInstance(instanceId!),
    enabled: Boolean(instanceId),
  })
export const useStartInstance = () => useMutation({ mutationFn: startInstance })
export const useSaveEvaluation = () => useMutation({ mutationFn: saveEvaluation })
export const useOnboardingTasksByInstanceQuery = (
  onboardingId: string | undefined,
  options?: import('../shared/api/onboarding').ListTasksByOnboardingOptions,
  enabled = true
) =>
  useQuery({
    queryKey: ['onboarding-tasks-by-instance', onboardingId ?? '', options],
    queryFn: () => getOnboardingTasksByInstance(onboardingId!, options),
    enabled: Boolean(enabled && onboardingId),
  })
export const useUpdateOnboardingTaskStatus = () =>
  useMutation({ mutationFn: ({ taskId, status }: { taskId: string; status: string }) => updateOnboardingTaskStatus(taskId, status) })

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

export const usePlansQuery = () => useQuery({ queryKey: ['plans'], queryFn: () => getPlans() })
export const useUsageQuery = (month?: string) =>
  useQuery({ queryKey: ['usage', month], queryFn: () => getUsage(month) })
export const useInvoicesQuery = () => useQuery({ queryKey: ['invoices'], queryFn: () => getInvoices() })
export const useInvoiceQuery = (invoiceId?: string) =>
  useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId!),
    enabled: Boolean(invoiceId),
  })
export const useSubscriptionQuery = () =>
  useQuery({ queryKey: ['subscription'], queryFn: () => getSubscription() })
export const useCreateSubscription = () =>
  useMutation({ mutationFn: (v: { companyId: string; planCode: string }) => createSubscription(v.companyId, v.planCode) })
export const useUpdateSubscription = () =>
  useMutation({ mutationFn: updateSubscription })
export const useConnectPayment = () => useMutation({ mutationFn: connectPayment })
export const useCreatePaymentIntent = () =>
  useMutation({ mutationFn: createPaymentIntent })
export const usePaymentProvidersQuery = () =>
  useQuery({ queryKey: ['payment-providers'], queryFn: getPaymentProviders })
export const usePaymentStatusQuery = (paymentIntentId: string | undefined, enabled = false) =>
  useQuery({
    queryKey: ['payment-status', paymentIntentId],
    queryFn: () => getPaymentStatus(paymentIntentId!),
    enabled: Boolean(paymentIntentId) && enabled,
    refetchInterval: enabled ? 3000 : false,
  })
export const usePaymentTransactionsQuery = () =>
  useQuery({ queryKey: ['payment-transactions'], queryFn: getPaymentTransactions })
export const useTrackUsage = () =>
  useMutation({ mutationFn: (v: { subscriptionId: string; usageType: string; quantity: number }) => trackUsage(v.subscriptionId, v.usageType, v.quantity) })
export const useUsageSummaryQuery = (subscriptionId?: string, month?: string) =>
  useQuery({
    queryKey: ['usage-summary', subscriptionId, month],
    queryFn: () => getUsageSummary(subscriptionId, month),
  })
export const useGenerateInvoice = () =>
  useMutation({ mutationFn: (v: { subscriptionId: string; periodStart: string; periodEnd: string }) => generateInvoice(v.subscriptionId, v.periodStart, v.periodEnd) })
export const useDunningRetry = () =>
  useMutation({ mutationFn: (v: { dunningCaseId?: string; subscriptionId?: string }) => dunningRetry(v.dunningCaseId, v.subscriptionId) })

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

