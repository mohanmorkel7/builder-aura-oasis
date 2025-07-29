const API_BASE_URL = '/api';

export class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // Handle specific status codes
        if (response.status === 401) {
          throw new Error('Invalid credentials');
        }

        let errorText: string = '';
        try {
          // Clone the response to avoid consuming the stream
          const clonedResponse = response.clone();
          errorText = await clonedResponse.text();
        } catch (textError) {
          // If we can't read the response body, provide a generic error
          throw new Error(`Authentication failed (${response.status})`);
        }

        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          } catch {
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      // Handle no content responses
      if (response.status === 204) {
        return {} as T;
      }

      try {
        return await response.json();
      } catch (jsonError) {
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('body stream')) {
        throw new Error('Network error: Please try again');
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request('/users/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // User methods
  async getUsers() {
    return this.request('/users');
  }

  async getUser(id: number) {
    return this.request(`/users/${id}`);
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: number, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Client methods
  async getClients(salesRepId?: number) {
    const params = salesRepId ? `?salesRep=${salesRepId}` : '';
    return this.request(`/clients${params}`);
  }

  async getClient(id: number) {
    return this.request(`/clients/${id}`);
  }

  async createClient(clientData: any) {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async updateClient(id: number, clientData: any) {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  }

  async deleteClient(id: number) {
    return this.request(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  async getClientStats() {
    return this.request('/clients/stats');
  }

  // Template methods
  async getTemplates() {
    return this.request('/templates');
  }

  async getTemplate(id: number) {
    return this.request(`/templates/${id}`);
  }

  async createTemplate(templateData: any) {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async updateTemplate(id: number, templateData: any) {
    return this.request(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  async deleteTemplate(id: number) {
    return this.request(`/templates/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateTemplate(id: number, createdBy: number) {
    return this.request(`/templates/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ created_by: createdBy }),
    });
  }

  // Deployment methods
  async getDeployments(assigneeId?: number) {
    const params = assigneeId ? `?assignee=${assigneeId}` : '';
    return this.request(`/deployments${params}`);
  }

  async getDeployment(id: number) {
    return this.request(`/deployments/${id}`);
  }

  async createDeployment(deploymentData: any) {
    return this.request('/deployments', {
      method: 'POST',
      body: JSON.stringify(deploymentData),
    });
  }

  async updateDeployment(id: number, deploymentData: any) {
    return this.request(`/deployments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(deploymentData),
    });
  }

  async updateDeploymentStatus(id: number, status: string) {
    return this.request(`/deployments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteDeployment(id: number) {
    return this.request(`/deployments/${id}`, {
      method: 'DELETE',
    });
  }

  async getDeploymentStats() {
    return this.request('/deployments/stats');
  }

  async getProducts() {
    return this.request('/deployments/products/list');
  }
}

export const apiClient = new ApiClient();
