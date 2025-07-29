import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

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
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => apiClient.getUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userData: any) => apiClient.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userData }: { id: number; userData: any }) =>
      apiClient.updateUser(id, userData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Client hooks
export function useClients(salesRepId?: number) {
  return useQuery({
    queryKey: ['clients', salesRepId],
    queryFn: () => apiClient.getClients(salesRepId),
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => apiClient.getClient(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (clientData: any) => apiClient.createClient(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-stats'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, clientData }: { id: number; clientData: any }) =>
      apiClient.updateClient(id, clientData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', id] });
      queryClient.invalidateQueries({ queryKey: ['client-stats'] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-stats'] });
    },
  });
}

export function useClientStats() {
  return useQuery({
    queryKey: ['client-stats'],
    queryFn: () => apiClient.getClientStats(),
  });
}

// Template hooks
export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.getTemplates(),
  });
}

export function useTemplate(id: number) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: () => apiClient.getTemplate(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateData: any) => apiClient.createTemplate(templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateData }: { id: number; templateData: any }) =>
      apiClient.updateTemplate(id, templateData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['templates', id] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, createdBy }: { id: number; createdBy: number }) =>
      apiClient.duplicateTemplate(id, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

// Deployment hooks
export function useDeployments(assigneeId?: number) {
  return useQuery({
    queryKey: ['deployments', assigneeId],
    queryFn: () => apiClient.getDeployments(assigneeId),
  });
}

export function useDeployment(id: number) {
  return useQuery({
    queryKey: ['deployments', id],
    queryFn: () => apiClient.getDeployment(id),
    enabled: !!id,
  });
}

export function useCreateDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deploymentData: any) => apiClient.createDeployment(deploymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['deployment-stats'] });
    },
  });
}

export function useUpdateDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, deploymentData }: { id: number; deploymentData: any }) =>
      apiClient.updateDeployment(id, deploymentData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['deployments', id] });
      queryClient.invalidateQueries({ queryKey: ['deployment-stats'] });
    },
  });
}

export function useUpdateDeploymentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.updateDeploymentStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['deployments', id] });
      queryClient.invalidateQueries({ queryKey: ['deployment-stats'] });
    },
  });
}

export function useDeleteDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteDeployment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['deployment-stats'] });
    },
  });
}

export function useDeploymentStats() {
  return useQuery({
    queryKey: ['deployment-stats'],
    queryFn: () => apiClient.getDeploymentStats(),
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => apiClient.getProducts(),
  });
}
