import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// Auth hooks
export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiClient.login(email, password),
  });
}

// Mock data for fallback
const mockUsers = [
  { id: 1, first_name: 'John', last_name: 'Doe', email: 'admin@banani.com', role: 'admin', status: 'active', created_at: '2023-01-10T09:00:00Z' },
  { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'sales@banani.com', role: 'sales', status: 'active', created_at: '2023-02-15T09:00:00Z' },
  { id: 3, first_name: 'Mike', last_name: 'Johnson', email: 'product@banani.com', role: 'product', status: 'active', created_at: '2023-03-20T09:00:00Z' }
];

const mockClients = [
  { id: 1, client_name: 'Acme Corp', contact_person: 'Jane Doe', email: 'jane@acme.com', status: 'active', priority: 'high', created_at: '2023-10-26T09:00:00Z' },
  { id: 2, client_name: 'Globex Inc.', contact_person: 'Bob Wilson', email: 'bob@globex.com', status: 'onboarding', priority: 'medium', created_at: '2023-10-20T09:00:00Z' }
];

const mockTemplates = [
  { id: 1, name: 'Standard Client Onboarding', description: 'A comprehensive template for standard client onboarding', type: 'standard', step_count: 5, created_at: '2023-01-15T09:00:00Z' },
  { id: 2, name: 'Enterprise Client Onboarding', description: 'Tailored onboarding process for large enterprise clients', type: 'enterprise', step_count: 8, created_at: '2023-01-15T09:00:00Z' }
];

const mockDeployments = [
  { id: 1, product_name: 'Core App', version: 'v2.1.0', environment: 'production', status: 'completed', assigned_to_name: 'Mike Johnson', created_at: '2024-07-15T09:00:00Z' },
  { id: 2, product_name: 'Analytics Module', version: 'v1.5.2', environment: 'production', status: 'failed', assigned_to_name: 'Mike Johnson', created_at: '2024-07-16T09:00:00Z' }
];

// User hooks
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        return await apiClient.getUsers();
      } catch {
        return mockUsers;
      }
    },
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
    queryFn: async () => {
      try {
        return await apiClient.getClients(salesRepId);
      } catch {
        return mockClients;
      }
    },
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
    queryFn: async () => {
      try {
        return await apiClient.getClientStats();
      } catch {
        return { total: 4, active: 2, onboarding: 1, completed: 1 };
      }
    },
  });
}

// Template hooks
export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      try {
        return await apiClient.getTemplates();
      } catch {
        return mockTemplates;
      }
    },
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
    queryFn: async () => {
      try {
        return await apiClient.getDeployments(assigneeId);
      } catch {
        return mockDeployments;
      }
    },
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
