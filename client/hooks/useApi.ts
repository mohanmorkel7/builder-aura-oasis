import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

// Auth hooks
export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiClient.login(email, password),
  });
}



// User hooks
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.getUsers(),
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => apiClient.getUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userData: any) => apiClient.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userData }: { id: number; userData: any }) =>
      apiClient.updateUser(id, userData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// Client hooks
export function useClients(salesRepId?: number) {
  return useQuery({
    queryKey: ["clients", salesRepId],
    queryFn: () => apiClient.getClients(salesRepId),
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: () => apiClient.getClient(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientData: any) => apiClient.createClient(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-stats"] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, clientData }: { id: number; clientData: any }) =>
      apiClient.updateClient(id, clientData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", id] });
      queryClient.invalidateQueries({ queryKey: ["client-stats"] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-stats"] });
    },
  });
}

export function useClientStats() {
  return useQuery({
    queryKey: ["client-stats"],
    queryFn: () => apiClient.getClientStats(),
  });
}

// Template hooks
export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: () => apiClient.getTemplates(),
  });
}

export function useTemplate(id: number) {
  return useQuery({
    queryKey: ["templates", id],
    queryFn: () => apiClient.getTemplate(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateData: any) => apiClient.createTemplate(templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateData }: { id: number; templateData: any }) =>
      apiClient.updateTemplate(id, templateData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["templates", id] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, createdBy }: { id: number; createdBy: number }) =>
      apiClient.duplicateTemplate(id, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

// Deployment hooks
export function useDeployments(assigneeId?: number) {
  return useQuery({
    queryKey: ["deployments", assigneeId],
    queryFn: () => apiClient.getDeployments(assigneeId),
  });
}

export function useDeployment(id: number) {
  return useQuery({
    queryKey: ["deployments", id],
    queryFn: () => apiClient.getDeployment(id),
    enabled: !!id,
  });
}

export function useCreateDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deploymentData: any) =>
      apiClient.createDeployment(deploymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      queryClient.invalidateQueries({ queryKey: ["deployment-stats"] });
    },
  });
}

export function useUpdateDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deploymentData }: { id: number; deploymentData: any }) =>
      apiClient.updateDeployment(id, deploymentData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      queryClient.invalidateQueries({ queryKey: ["deployments", id] });
      queryClient.invalidateQueries({ queryKey: ["deployment-stats"] });
    },
  });
}

export function useUpdateDeploymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.updateDeploymentStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      queryClient.invalidateQueries({ queryKey: ["deployments", id] });
      queryClient.invalidateQueries({ queryKey: ["deployment-stats"] });
    },
  });
}

export function useDeleteDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteDeployment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      queryClient.invalidateQueries({ queryKey: ["deployment-stats"] });
    },
  });
}

export function useDeploymentStats() {
  return useQuery({
    queryKey: ["deployment-stats"],
    queryFn: () => apiClient.getDeploymentStats(),
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => apiClient.getProducts(),
  });
}

// Onboarding hooks
export function useClientOnboardingSteps(clientId: number) {
  return useQuery({
    queryKey: ["onboarding-steps", clientId],
    queryFn: () => apiClient.getClientOnboardingSteps(clientId),
    enabled: !!clientId,
  });
}

export function useCreateOnboardingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, stepData }: { clientId: number; stepData: any }) =>
      apiClient.createOnboardingStep(clientId, stepData),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-steps", clientId],
      });
    },
  });
}

export function useUpdateOnboardingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, stepData }: { stepId: number; stepData: any }) =>
      apiClient.updateOnboardingStep(stepId, stepData),
    onSuccess: (data: any) => {
      if (data && data.client_id) {
        queryClient.invalidateQueries({
          queryKey: ["onboarding-steps", data.client_id],
        });
      }
      // Also invalidate the general query
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps"] });
    },
  });
}

export function useDeleteOnboardingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: number) => apiClient.deleteOnboardingStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-steps"] });
    },
  });
}

export function useReorderOnboardingSteps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clientId,
      stepOrders,
    }: {
      clientId: number;
      stepOrders: { id: number; order: number }[];
    }) => apiClient.reorderOnboardingSteps(clientId, stepOrders),
    onSuccess: (_, { clientId }) => {
      queryClient.invalidateQueries({
        queryKey: ["onboarding-steps", clientId],
      });
    },
  });
}

export function useStepDocuments(stepId: number) {
  return useQuery({
    queryKey: ["step-documents", stepId],
    queryFn: () => apiClient.getStepDocuments(stepId),
    enabled: !!stepId && stepId > 0,
  });
}

export function useUploadStepDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      stepId,
      documentData,
    }: {
      stepId: number;
      documentData: any;
    }) => apiClient.uploadStepDocument(stepId, documentData),
    onSuccess: (_, { stepId }) => {
      queryClient.invalidateQueries({ queryKey: ["step-documents", stepId] });
    },
  });
}

export function useDeleteStepDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: number) =>
      apiClient.deleteStepDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["step-documents"] });
    },
  });
}

export function useStepComments(stepId: number) {
  return useQuery({
    queryKey: ["step-comments", stepId],
    queryFn: () => apiClient.getStepComments(stepId),
    enabled: !!stepId && stepId > 0,
  });
}

export function useCreateStepComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      stepId,
      commentData,
    }: {
      stepId: number;
      commentData: any;
    }) => apiClient.createStepComment(stepId, commentData),
    onSuccess: (_, { stepId }) => {
      queryClient.invalidateQueries({ queryKey: ["step-comments", stepId] });
    },
  });
}

export function useDeleteStepComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => apiClient.deleteStepComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["step-comments"] });
    },
  });
}

// Lead hooks
export function useLeads(salesRepId?: number) {
  return useQuery({
    queryKey: ["leads", salesRepId],
    queryFn: () => apiClient.getLeads(salesRepId),
  });
}

export function useLead(id: number) {
  return useQuery({
    queryKey: ["leads", id],
    queryFn: () => apiClient.getLead(id),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leadData: any) => apiClient.createLead(leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, leadData }: { id: number; leadData: any }) =>
      apiClient.updateLead(id, leadData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", id] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
    },
    onError: (error) => {
      console.error("Lead update failed:", error);
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
    },
  });
}

export function useLeadStats(salesRepId?: number) {
  return useQuery({
    queryKey: ["lead-stats", salesRepId],
    queryFn: () => apiClient.getLeadStats(salesRepId),
  });
}

// Lead steps hooks
export function useLeadSteps(leadId: number) {
  return useQuery({
    queryKey: ["lead-steps", leadId],
    queryFn: () => apiClient.getLeadSteps(leadId),
    enabled: !!leadId && leadId > 0,
  });
}

export function useCreateLeadStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, stepData }: { leadId: number; stepData: any }) =>
      apiClient.createLeadStep(leadId, stepData),
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ["lead-steps", leadId] });
    },
  });
}

export function useUpdateLeadStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, stepData }: { stepId: number; stepData: any }) =>
      apiClient.updateLeadStep(stepId, stepData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-steps"] });
    },
  });
}

export function useDeleteLeadStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: number) => apiClient.deleteLeadStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-steps"] });
    },
  });
}

export function useReorderLeadSteps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      stepOrders,
    }: {
      leadId: number;
      stepOrders: { id: number; order: number }[];
    }) => apiClient.reorderLeadSteps(leadId, stepOrders),
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ["lead-steps", leadId] });
    },
  });
}

// Lead chat hooks
export function useStepChats(stepId: number) {
  return useQuery({
    queryKey: ["step-chats", stepId],
    queryFn: () => apiClient.getStepChats(stepId),
    enabled: !!stepId && stepId > 0,
  });
}

export function useCreateStepChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, chatData }: { stepId: number; chatData: any }) =>
      apiClient.createStepChat(stepId, chatData),
    onSuccess: (_, { stepId }) => {
      queryClient.invalidateQueries({ queryKey: ["step-chats", stepId] });
    },
  });
}

export function useDeleteStepChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: number) => apiClient.deleteStepChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["step-chats"] });
    },
  });
}

// Follow-up hooks
export function useFollowUps(params?: {
  userId?: string;
  userRole?: string;
  status?: string;
  assigned_to?: string;
}) {
  return useQuery({
    queryKey: ["follow-ups", params],
    queryFn: () => apiClient.getAllFollowUps(params),
  });
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followUpData: any) => apiClient.createFollowUp(followUpData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    },
  });
}

export function useClientFollowUps(clientId: number) {
  return useQuery({
    queryKey: ["follow-ups", "client", clientId],
    queryFn: () => apiClient.getClientFollowUps(clientId),
    enabled: !!clientId && clientId > 0,
  });
}

export function useLeadFollowUps(leadId: number) {
  return useQuery({
    queryKey: ["follow-ups", "lead", leadId],
    queryFn: () => apiClient.getLeadFollowUps(leadId),
    enabled: !!leadId && leadId > 0,
  });
}
