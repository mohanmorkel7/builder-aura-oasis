const API_BASE_URL = "/api";

export class ApiClient {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

  // Method to reset circuit breaker (for development/demo mode)
  public resetCircuitBreaker() {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    console.log("Circuit breaker reset");
  }
  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<T> {
    // Circuit breaker check
    const now = Date.now();
    if (
      this.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD &&
      now - this.lastFailureTime < this.CIRCUIT_BREAKER_TIMEOUT
    ) {
      throw new Error(
        "Circuit breaker: Too many failures, please wait before retrying",
      );
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log("Making API request to:", url);
      console.log("Request config:", JSON.stringify(config, null, 2));

      let response: Response;

      try {
        // Store original fetch in case it gets overridden by third-party scripts
        const originalFetch = window.fetch.bind(window);
        response = await originalFetch(url, config);
      } catch (fetchError) {
        console.error(
          "Primary fetch failed for URL:",
          url,
          "Error:",
          fetchError,
        );

        // Check if it's a network connectivity issue
        if (
          fetchError instanceof TypeError &&
          fetchError.message.includes("Failed to fetch")
        ) {
          console.error("Network connectivity issue detected");
        }

        // Try native fetch one more time before XMLHttpRequest fallback
        try {
          console.log("Attempting second fetch...");
          response = await fetch(url, config);
        } catch (secondFetchError) {
          console.error(
            "Second fetch attempt failed, using XMLHttpRequest:",
            secondFetchError,
          );
          // Fallback to XMLHttpRequest if fetch is blocked or intercepted
          response = await this.xmlHttpRequestFallback(url, config);
        }
      }

      if (!response.ok) {
        console.log(
          "API Response not OK. Status:",
          response.status,
          "StatusText:",
          response.statusText,
        );

        // Handle specific status codes
        if (response.status === 401) {
          throw new Error("Invalid credentials");
        }

        let errorText: string = "";
        try {
          // Read the response text directly (no cloning needed for error cases)
          errorText = await response.text();
          console.log("Server error response:", errorText);
        } catch (textError) {
          console.error("Could not read error response body:", textError);
          // If we can't read the response body, provide a status-specific error
          if (response.status === 400) {
            throw new Error(
              `Bad Request (${response.status}): Invalid data provided`,
            );
          } else if (response.status === 403) {
            throw new Error(`Forbidden (${response.status}): Access denied`);
          } else if (response.status === 404) {
            throw new Error(
              `Not Found (${response.status}): Resource not found`,
            );
          } else if (response.status >= 500) {
            throw new Error(
              `Server Error (${response.status}): Internal server error`,
            );
          } else {
            throw new Error(`HTTP Error (${response.status}): Request failed`);
          }
        }

        if (errorText) {
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(
              errorData.error || `HTTP error! status: ${response.status}`,
            );
          } catch {
            throw new Error(
              `HTTP error! status: ${response.status} - ${errorText}`,
            );
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      // Handle no content responses
      if (response.status === 204) {
        return {} as T;
      }

      // Read response as text first to avoid "body already used" errors
      let responseText: string;
      try {
        responseText = await response.text();
      } catch (textError) {
        console.error("Could not read response body:", textError);
        throw new Error(`Could not read response from server URL: ${url}`);
      }

      // Check if response is HTML instead of JSON (indicates routing issue)
      if (
        responseText.trim().startsWith("<!doctype") ||
        responseText.trim().startsWith("<!DOCTYPE") ||
        responseText.trim().startsWith("<html")
      ) {
        console.error(
          "Received HTML response instead of JSON for API endpoint:",
          url,
        );
        console.error(
          "This indicates the API request is not being routed to the backend server.",
        );
        console.error(
          "Response content:",
          responseText.substring(0, 200) + "...",
        );

        // Check if server might be down or misconfigured
        throw new Error(
          `Server routing error: API endpoint ${endpoint} returned HTML instead of JSON. This usually means the backend server is not running or API routes are not properly configured.`,
        );
      }

      // Try to parse as JSON
      try {
        const result = JSON.parse(responseText);
        // Reset failure count on successful request
        this.failureCount = 0;
        return result;
      } catch (jsonError) {
        console.error(
          "Invalid JSON response body:",
          responseText.substring(0, 500),
        ); // Log first 500 chars
        console.error("JSON parse error:", jsonError);
        throw new Error(`Invalid JSON response from server URL: ${url}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("API request failed:", errorMessage, "URL:", url);

      // Only track actual network failures for circuit breaker, not server responses
      const isNetworkError =
        error instanceof TypeError &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("Network error") ||
          error.message.includes("body stream"));

      if (isNetworkError) {
        // Track failure for circuit breaker only for network errors
        this.failureCount++;
        this.lastFailureTime = Date.now();
      }

      // Retry logic for network errors
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch") &&
        retryCount < 2
      ) {
        console.log(`Retrying request ${retryCount + 1}/2 for ${url}`);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1)),
        ); // Exponential backoff
        return this.request(endpoint, options, retryCount + 1);
      }

      if (error instanceof TypeError) {
        if (error.message.includes("Failed to fetch")) {
          console.error("Network fetch failure details:", {
            url,
            config: JSON.stringify(config, null, 2),
            error: error.message,
            timestamp: new Date().toISOString(),
            retryCount,
          });
          throw new Error(
            `Network error: Cannot connect to server at ${url}. Please check your internet connection or server status.`,
          );
        }
        if (error.message.includes("body stream")) {
          console.error("Body stream error for URL:", url);
          throw new Error(
            `Network error: Connection interrupted for ${url}. Please try again.`,
          );
        }
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  private xmlHttpRequestFallback(
    url: string,
    config: RequestInit,
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.timeout = 45000; // 45 second timeout

      xhr.open(config.method || "GET", url);

      // Set headers
      if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]) => {
          try {
            xhr.setRequestHeader(key, value as string);
          } catch (headerError) {
            console.log(`Could not set header ${key}:`, headerError);
          }
        });
      }

      xhr.onload = () => {
        try {
          // Parse response headers
          const headers = new Headers();
          const headerLines = xhr.getAllResponseHeaders().split("\r\n");
          headerLines.forEach((line) => {
            const parts = line.split(": ");
            if (parts.length === 2) {
              headers.append(parts[0], parts[1]);
            }
          });

          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: headers,
          });
          resolve(response);
        } catch (responseError) {
          console.error("Error creating response from XHR:", responseError);
          reject(new Error("Failed to process XMLHttpRequest response"));
        }
      };

      xhr.onerror = () => {
        reject(new Error("XMLHttpRequest network error"));
      };

      xhr.ontimeout = () => {
        reject(new Error("XMLHttpRequest timeout"));
      };

      xhr.onabort = () => {
        reject(new Error("XMLHttpRequest aborted"));
      };

      try {
        xhr.send((config.body as string) || null);
      } catch (sendError) {
        reject(
          new Error(`Failed to send XMLHttpRequest: ${sendError.message}`),
        );
      }
    });
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request("/users/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // User methods
  async getUsers() {
    return this.request("/users");
  }

  async getUser(id: number) {
    return this.request(`/users/${id}`);
  }

  async createUser(userData: any) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: number, userData: any) {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number) {
    return this.request(`/users/${id}`, {
      method: "DELETE",
    });
  }

  // Client methods
  async getClients(salesRepId?: number) {
    const params = salesRepId ? `?salesRep=${salesRepId}` : "";
    return this.request(`/clients${params}`);
  }

  async getClient(id: number) {
    return this.request(`/clients/${id}`);
  }

  async createClient(clientData: any) {
    return this.request("/clients", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
  }

  async updateClient(id: number, clientData: any) {
    return this.request(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    });
  }

  async deleteClient(id: number) {
    return this.request(`/clients/${id}`, {
      method: "DELETE",
    });
  }

  async getClientStats() {
    return this.request("/clients/stats");
  }

  // Template methods
  async getTemplates() {
    return this.request("/templates");
  }

  async getTemplate(id: number) {
    return this.request(`/templates/${id}`);
  }

  async createTemplate(templateData: any) {
    return this.request("/templates", {
      method: "POST",
      body: JSON.stringify(templateData),
    });
  }

  async updateTemplate(id: number, templateData: any) {
    return this.request(`/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(templateData),
    });
  }

  async deleteTemplate(id: number) {
    return this.request(`/templates/${id}`, {
      method: "DELETE",
    });
  }

  async duplicateTemplate(templateId: number, createdBy?: number) {
    return this.request(`/templates/${templateId}/duplicate`, {
      method: "POST",
      body: JSON.stringify({ created_by: createdBy || 1 }),
    });
  }

  // Deployment methods
  async getDeployments(assigneeId?: number) {
    const params = assigneeId ? `?assignee=${assigneeId}` : "";
    return this.request(`/deployments${params}`);
  }

  async getDeployment(id: number) {
    return this.request(`/deployments/${id}`);
  }

  async createDeployment(deploymentData: any) {
    return this.request("/deployments", {
      method: "POST",
      body: JSON.stringify(deploymentData),
    });
  }

  async updateDeployment(id: number, deploymentData: any) {
    return this.request(`/deployments/${id}`, {
      method: "PUT",
      body: JSON.stringify(deploymentData),
    });
  }

  async updateDeploymentStatus(id: number, status: string) {
    return this.request(`/deployments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async deleteDeployment(id: number) {
    return this.request(`/deployments/${id}`, {
      method: "DELETE",
    });
  }

  async getDeploymentStats() {
    return this.request("/deployments/stats");
  }

  async getProducts() {
    return this.request("/deployments/products/list");
  }

  // Onboarding methods
  async getClientOnboardingSteps(clientId: number) {
    return this.request(`/onboarding/clients/${clientId}/steps`);
  }

  async createOnboardingStep(clientId: number, stepData: any) {
    return this.request(`/onboarding/clients/${clientId}/steps`, {
      method: "POST",
      body: JSON.stringify(stepData),
    });
  }

  async updateOnboardingStep(stepId: number, stepData: any) {
    return this.request(`/onboarding/steps/${stepId}`, {
      method: "PUT",
      body: JSON.stringify(stepData),
    });
  }

  async deleteOnboardingStep(stepId: number) {
    return this.request(`/onboarding/steps/${stepId}`, {
      method: "DELETE",
    });
  }

  async reorderOnboardingSteps(
    clientId: number,
    stepOrders: { id: number; order: number }[],
  ) {
    return this.request(`/onboarding/clients/${clientId}/steps/reorder`, {
      method: "PUT",
      body: JSON.stringify({ stepOrders }),
    });
  }

  async getStepDocuments(stepId: number) {
    return this.request(`/onboarding/steps/${stepId}/documents`);
  }

  async uploadStepDocument(stepId: number, documentData: any) {
    return this.request(`/onboarding/steps/${stepId}/documents`, {
      method: "POST",
      body: JSON.stringify(documentData),
    });
  }

  async deleteStepDocument(documentId: number) {
    return this.request(`/onboarding/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  async getStepComments(stepId: number) {
    return this.request(`/onboarding/steps/${stepId}/comments`);
  }

  async createStepComment(stepId: number, commentData: any) {
    return this.request(`/onboarding/steps/${stepId}/comments`, {
      method: "POST",
      body: JSON.stringify(commentData),
    });
  }

  async deleteStepComment(commentId: number) {
    return this.request(`/onboarding/comments/${commentId}`, {
      method: "DELETE",
    });
  }

  // Enhanced request method with retry logic
  private async requestWithRetry<T = any>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = 2,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `Attempt ${attempt}/${maxRetries} for endpoint: ${endpoint}`,
        );
        const result = await this.request<T>(endpoint, options);
        console.log(`Success on attempt ${attempt} for endpoint: ${endpoint}`);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `Attempt ${attempt}/${maxRetries} failed for ${endpoint}:`,
          error,
        );

        // If it's the last attempt, don't retry
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    console.error(`All ${maxRetries} attempts failed for ${endpoint}`);
    throw lastError;
  }

  // Lead methods
  async getLeads(salesRepId?: number) {
    try {
      const params = salesRepId ? `?salesRep=${salesRepId}` : "";
      return await this.requestWithRetry(`/leads${params}`, {}, 3);
    } catch (error) {
      console.error("Failed to fetch leads after all retries:", error);
      // Return empty array as fallback to prevent UI crashes
      return [];
    }
  }

  async getPartialLeads(salesRepId?: number) {
    const params = salesRepId
      ? `?salesRep=${salesRepId}&partial=true`
      : "?partial=true";
    return this.request(`/leads${params}`);
  }

  async getMyPartialSaves(userId?: number) {
    const params = userId
      ? `?created_by=${userId}&partial_saves_only=true`
      : "?partial_saves_only=true";
    return this.request(`/leads${params}`);
  }

  async getLead(id: number) {
    return this.request(`/leads/${id}`);
  }

  async createLead(leadData: any) {
    return this.request("/leads", {
      method: "POST",
      body: JSON.stringify(leadData),
    });
  }

  async updateLead(id: number, leadData: any) {
    return this.request(`/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(leadData),
    });
  }

  async deleteLead(id: number) {
    return this.request(`/leads/${id}`, {
      method: "DELETE",
    });
  }

  async getLeadStats(salesRepId?: number) {
    const params = salesRepId ? `?salesRep=${salesRepId}` : "";
    return this.request(`/leads/stats${params}`);
  }

  async getTemplateStepDashboard() {
    return this.request("/leads/template-step-dashboard");
  }

  async getLeadProgressDashboard() {
    try {
      return await this.requestWithRetry("/leads/progress-dashboard", {}, 3);
    } catch (error) {
      console.error(
        "Failed to fetch lead progress dashboard after all retries:",
        error,
      );
      // Return empty array as fallback to prevent UI crashes
      return [];
    }
  }

  async getLeadsForTemplateStep(
    templateId: number,
    stepId: number,
    status: string,
  ) {
    return this.request(
      `/leads/template-step/${templateId}/${stepId}/${status}`,
    );
  }

  // FinOps Task Management methods
  async getFinOpsTasks() {
    return this.request("/finops/tasks");
  }

  async createFinOpsTask(taskData: any) {
    return this.request("/finops/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
  }

  async updateFinOpsTask(id: number, taskData: any) {
    return this.request(`/finops/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    });
  }

  async deleteFinOpsTask(id: number) {
    return this.request(`/finops/tasks/${id}`, {
      method: "DELETE",
    });
  }

  async updateFinOpsSubTask(
    taskId: number,
    subTaskId: string,
    status: string,
    userName?: string,
  ) {
    return this.request(`/finops/tasks/${taskId}/subtasks/${subTaskId}`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        user_name: userName,
      }),
    });
  }

  async getFinOpsActivityLog(filters?: {
    taskId?: number;
    userId?: string;
    action?: string;
    date?: string;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.taskId) params.append("taskId", filters.taskId.toString());
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.action) params.append("action", filters.action);
    if (filters?.date) params.append("date", filters.date);
    if (filters?.limit) params.append("limit", filters.limit.toString());

    return this.request(`/finops/activity-log?${params.toString()}`);
  }

  async runFinOpsTask(taskId: number) {
    return this.request(`/finops/tasks/${taskId}/run`, {
      method: "POST",
    });
  }

  async getFinOpsDailyTasks(date?: string) {
    const params = date ? `?date=${date}` : "";
    return this.request(`/finops/daily-tasks${params}`);
  }

  async triggerFinOpsSLACheck() {
    return this.request("/finops/check-sla", {
      method: "POST",
    });
  }

  async triggerFinOpsDailyExecution() {
    return this.request("/finops/trigger-daily", {
      method: "POST",
    });
  }

  async getFinOpsSchedulerStatus() {
    return this.request("/finops/scheduler-status");
  }

  async getFinOpsTaskSummary(taskId: number) {
    return this.request(`/finops/tasks/${taskId}/summary`);
  }

  async sendFinOpsManualAlert(
    taskId: number,
    subtaskId: string,
    alertType: string,
    message: string,
  ) {
    return this.request(`/finops/tasks/${taskId}/subtasks/${subtaskId}/alert`, {
      method: "POST",
      body: JSON.stringify({
        alert_type: alertType,
        message: message,
      }),
    });
  }

  // Lead steps methods
  async getLeadSteps(leadId: number) {
    return this.request(`/leads/${leadId}/steps`);
  }

  async createLeadStep(leadId: number, stepData: any) {
    return this.request(`/leads/${leadId}/steps`, {
      method: "POST",
      body: JSON.stringify(stepData),
    });
  }

  async updateLeadStep(stepId: number, stepData: any) {
    return this.request(`/leads/steps/${stepId}`, {
      method: "PUT",
      body: JSON.stringify(stepData),
    });
  }

  async deleteLeadStep(stepId: number) {
    return this.request(`/leads/steps/${stepId}`, {
      method: "DELETE",
    });
  }

  async reorderLeadSteps(
    leadId: number,
    stepOrders: { id: number; order: number }[],
  ) {
    return this.request(`/leads/${leadId}/steps/reorder`, {
      method: "PUT",
      body: JSON.stringify({ stepOrders }),
    });
  }

  // Lead chat methods
  async getStepChats(stepId: number) {
    return this.request(`/leads/steps/${stepId}/chats`);
  }

  async createStepChat(stepId: number, chatData: any) {
    return this.request(`/leads/steps/${stepId}/chats`, {
      method: "POST",
      body: JSON.stringify(chatData),
    });
  }

  async deleteStepChat(chatId: number) {
    return this.request(`/leads/chats/${chatId}`, {
      method: "DELETE",
    });
  }

  // File upload method
  async uploadFiles(files: FileList) {
    const formData = new FormData();

    // Use consistent field name that multer expects
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    const url = `${API_BASE_URL}/files/upload`;

    try {
      console.log(`Uploading ${files.length} files to ${url}`);

      // Log file details for debugging
      Array.from(files).forEach((file, index) => {
        console.log(`File ${index + 1}: ${file.name} (${file.size} bytes, ${file.type})`);
      });

      // Log FormData contents (note: can't directly inspect FormData entries in all browsers)
      console.log("FormData created with files under 'files' field");

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const response = await fetch(url, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header, let browser set it with boundary
      });

      clearTimeout(timeoutId);

      console.log(`Upload response status: ${response.status}`);

      // Read the response body immediately to avoid "body stream already read" errors
      let responseText = '';
      let responseData = null;

      try {
        responseText = await response.text();
        console.log("Raw response text:", responseText);

        // Try to parse as JSON
        if (responseText.trim()) {
          try {
            responseData = JSON.parse(responseText);
            console.log("Parsed response data:", responseData);
          } catch (jsonError) {
            console.log("Response is not JSON, treating as plain text");
          }
        }
      } catch (readError) {
        console.error("Could not read response body:", readError);
        throw new Error(`Upload failed: ${response.status} ${response.statusText} (could not read response)`);
      }

      // Now handle the response based on status
      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.status}`;

        // Extract error message from parsed data or text
        if (responseData && (responseData.error || responseData.message)) {
          errorMessage = responseData.message || responseData.error;
        } else if (responseText) {
          // Analyze text content for common error patterns
          if (responseText.includes('413') || responseText.toLowerCase().includes('too large')) {
            errorMessage = "File too large. Please choose a smaller file.";
          } else if (responseText.includes('400') || responseText.toLowerCase().includes('bad request')) {
            errorMessage = "Invalid request format. Please try again.";
          } else if (responseText.includes('404')) {
            errorMessage = "Upload endpoint not found. Please contact support.";
          } else if (responseText.includes('500')) {
            errorMessage = "Server error occurred. Please try again later.";
          } else {
            // Include a snippet of the response for debugging
            const snippet = responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText;
            errorMessage = `Upload failed: ${response.status} ${response.statusText}. Response: ${snippet}`;
          }
        } else {
          errorMessage = `Upload failed: ${response.status} ${response.statusText} (empty response)`;
        }

        // Log error details properly
        console.error("Complete upload error details:");
        console.error("- Status:", response.status);
        console.error("- Status Text:", response.statusText);
        console.error("- URL:", response.url);
        console.error("- Headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
        console.error("- Response Text:", responseText);
        console.error("- Response Data:", responseData);

        throw new Error(errorMessage);
      }

      // Handle successful response
      if (responseData) {
        console.log("Upload successful:", responseData);
        return responseData;
      } else {
        console.error("Success response is not valid JSON:", responseText);
        throw new Error("Server returned invalid response format for successful upload");
      }
    } catch (error: any) {
      console.error("Upload error:", error);

      if (error.name === 'AbortError') {
        throw new Error("Upload timed out. Please try with smaller files or check your connection.");
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred during upload");
    }
  }

  // Follow-up methods
  async getAllFollowUps(params?: {
    userId?: string;
    userRole?: string;
    status?: string;
    assigned_to?: string;
  }) {
    try {
      const searchParams = new URLSearchParams();
      if (params?.userId) searchParams.append("userId", params.userId);
      if (params?.userRole) searchParams.append("userRole", params.userRole);
      if (params?.status) searchParams.append("status", params.status);
      if (params?.assigned_to)
        searchParams.append("assigned_to", params.assigned_to);

      const queryString = searchParams.toString();
      const endpoint = `/follow-ups${queryString ? `?${queryString}` : ""}`;

      console.log("Fetching follow-ups from:", endpoint);

      // Add a timeout and retry logic specifically for follow-ups
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Follow-ups request timeout")),
          20000,
        ); // Increased to 20 seconds
      });

      // Add retry logic for follow-ups
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const requestPromise = this.request(endpoint);
          const result = await Promise.race([requestPromise, timeoutPromise]);
          console.log(
            "Follow-ups fetch successful, got",
            Array.isArray(result) ? result.length : "non-array",
            "items",
          );
          return result;
        } catch (error) {
          lastError = error as Error;
          console.warn(`Follow-ups request attempt ${attempt} failed:`, error);

          if (attempt < 2) {
            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      throw lastError;
    } catch (error) {
      console.error("Failed to fetch follow-ups:", error);

      // Check if it's a network error vs server error
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.error("Network error - server may be unreachable");
      }

      // Return empty array as fallback to prevent crashes
      return [];
    }
  }

  async createFollowUp(followUpData: any) {
    return this.request("/follow-ups", {
      method: "POST",
      body: JSON.stringify(followUpData),
    });
  }

  async getClientFollowUps(clientId: number) {
    return this.request(`/follow-ups/client/${clientId}`);
  }

  async getLeadFollowUps(leadId: number) {
    return this.request(`/follow-ups/lead/${leadId}`);
  }

  async updateFollowUpStatus(followUpId: number, statusData: any) {
    return this.request(`/follow-ups/${followUpId}`, {
      method: "PATCH",
      body: JSON.stringify(statusData),
    });
  }

  // Ticketing API methods
  async getTicketMetadata() {
    return this.request<{
      priorities: any[];
      statuses: any[];
      categories: any[];
    }>("/tickets/metadata");
  }

  async getTickets(filters?: any, page?: number, limit?: number) {
    let endpoint = "/tickets";
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return this.request<{
      tickets: any[];
      total: number;
      pages: number;
    }>(endpoint);
  }

  async getTicketById(id: number) {
    return this.request<any>(`/tickets/${id}`);
  }

  async getTicketByTrackId(trackId: string) {
    return this.request<any>(`/tickets/track/${trackId}`);
  }

  async createTicket(ticketData: any, attachments?: File[]) {
    const formData = new FormData();

    // Add ticket data
    Object.entries(ticketData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // Add attachments
    if (attachments) {
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });
    }

    return this.request<any>("/tickets", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async updateTicket(id: number, updateData: any) {
    return this.request<any>(`/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  async deleteTicket(id: number) {
    return this.request<void>(`/tickets/${id}`, {
      method: "DELETE",
    });
  }

  async getTicketComments(ticketId: number) {
    return this.request<any[]>(`/tickets/${ticketId}/comments`);
  }

  async addTicketComment(ticketId: number, commentData: any) {
    return this.request<any>(`/tickets/${ticketId}/comments`, {
      method: "POST",
      body: JSON.stringify(commentData),
    });
  }

  async getTicketNotifications(userId: string, unreadOnly?: boolean) {
    let endpoint = `/tickets/notifications/${userId}`;
    if (unreadOnly) {
      endpoint += "?unread_only=true";
    }
    return this.request<any[]>(endpoint);
  }

  async markNotificationAsRead(notificationId: number) {
    return this.request<void>(`/tickets/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  }

  async uploadTicketAttachment(
    ticketId: number,
    file: File,
    commentId?: number,
    userId?: string,
  ) {
    const formData = new FormData();
    formData.append("file", file);
    if (commentId) formData.append("comment_id", String(commentId));
    if (userId) formData.append("user_id", userId);

    return this.request<any>(`/tickets/${ticketId}/attachments`, {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Enhanced Template API methods
  async getTemplateCategories() {
    return this.request<any[]>("/templates/categories");
  }

  async getTemplatesByCategory(categoryId: number) {
    return this.request<any[]>(`/templates/category/${categoryId}`);
  }

  async getTemplatesWithCategories() {
    return this.request<any[]>("/templates/with-categories");
  }

  async getTemplateStats() {
    return this.request<any>("/templates/stats");
  }

  async searchTemplates(searchTerm: string, categoryId?: number) {
    let endpoint = `/templates/search?q=${encodeURIComponent(searchTerm)}`;
    if (categoryId) {
      endpoint += `&category=${categoryId}`;
    }
    return this.request<any[]>(endpoint);
  }

  async getStepCategories() {
    return this.request<any[]>("/templates/step-categories");
  }

  async recordTemplateUsage(
    templateId: number,
    entityType: string,
    entityId: number,
  ) {
    return this.request<void>(`/templates/${templateId}/usage`, {
      method: "POST",
      body: JSON.stringify({ entityType, entityId }),
    });
  }

  // FinOps API methods
  async getFinOpsDashboard() {
    return this.request("/finops/dashboard");
  }

  async getFinOpsMetrics(
    period?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const params = new URLSearchParams();
    if (period) params.append("period", period);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const query = params.toString();
    return this.request(`/finops/metrics${query ? `?${query}` : ""}`);
  }

  async getFinOpsAccounts() {
    return this.request("/finops/accounts");
  }

  async createFinOpsAccount(accountData: any) {
    return this.request("/finops/accounts", {
      method: "POST",
      body: JSON.stringify(accountData),
    });
  }

  async getFinOpsTransactions(limit?: number, offset?: number) {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());

    const query = params.toString();
    return this.request(`/finops/transactions${query ? `?${query}` : ""}`);
  }

  async getFinOpsTransaction(id: number) {
    return this.request(`/finops/transactions/${id}`);
  }

  async createFinOpsTransaction(transactionData: any) {
    return this.request("/finops/transactions", {
      method: "POST",
      body: JSON.stringify(transactionData),
    });
  }

  async getFinOpsBudgets() {
    return this.request("/finops/budgets");
  }

  async createFinOpsBudget(budgetData: any) {
    return this.request("/finops/budgets", {
      method: "POST",
      body: JSON.stringify(budgetData),
    });
  }

  async getFinOpsInvoices() {
    return this.request("/finops/invoices");
  }

  async createFinOpsInvoice(invoiceData: any) {
    return this.request("/finops/invoices", {
      method: "POST",
      body: JSON.stringify(invoiceData),
    });
  }

  async getFinOpsCosts(referenceType?: string, referenceId?: number) {
    const params = new URLSearchParams();
    if (referenceType) params.append("reference_type", referenceType);
    if (referenceId) params.append("reference_id", referenceId.toString());

    const query = params.toString();
    return this.request(`/finops/costs${query ? `?${query}` : ""}`);
  }

  async createFinOpsCost(costData: any) {
    return this.request("/finops/costs", {
      method: "POST",
      body: JSON.stringify(costData),
    });
  }

  async generateFinOpsReport(reportData: any) {
    return this.request("/finops/reports/generate", {
      method: "POST",
      body: JSON.stringify(reportData),
    });
  }

  async exportFinOpsData(
    type: string,
    format?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const params = new URLSearchParams();
    if (format) params.append("format", format);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const query = params.toString();
    return this.request(`/finops/export/${type}${query ? `?${query}` : ""}`);
  }

  // Workflow API methods
  async getWorkflowDashboard(userId: number, userRole: string) {
    return this.request(
      `/workflow/dashboard?userId=${userId}&userRole=${userRole}`,
    );
  }

  async getWorkflowProjects(userId?: number, userRole?: string) {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId.toString());
    if (userRole) params.append("userRole", userRole);

    const query = params.toString();
    return this.request(`/workflow/projects${query ? `?${query}` : ""}`);
  }

  async getWorkflowProject(id: number) {
    return this.request(`/workflow/projects/${id}`);
  }

  async createWorkflowProject(projectData: any) {
    return this.request("/workflow/projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    });
  }

  async createProjectFromLead(leadId: number, projectData: any) {
    return this.request(`/workflow/projects/from-lead/${leadId}`, {
      method: "POST",
      body: JSON.stringify(projectData),
    });
  }

  async getProjectSteps(projectId: number) {
    return this.request(`/workflow/projects/${projectId}/steps`);
  }

  async createProjectStep(projectId: number, stepData: any) {
    return this.request(`/workflow/projects/${projectId}/steps`, {
      method: "POST",
      body: JSON.stringify(stepData),
    });
  }

  async updateStepStatus(stepId: number, status: string, updatedBy: number) {
    return this.request(`/workflow/steps/${stepId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, updated_by: updatedBy }),
    });
  }

  async getProjectComments(projectId: number, stepId?: number) {
    const params = new URLSearchParams();
    if (stepId) params.append("stepId", stepId.toString());

    const query = params.toString();
    return this.request(
      `/workflow/projects/${projectId}/comments${query ? `?${query}` : ""}`,
    );
  }

  async createProjectComment(projectId: number, commentData: any) {
    return this.request(`/workflow/projects/${projectId}/comments`, {
      method: "POST",
      body: JSON.stringify(commentData),
    });
  }

  async getWorkflowNotifications(userId: number, unreadOnly?: boolean) {
    const params = new URLSearchParams();
    params.append("userId", userId.toString());
    if (unreadOnly) params.append("unreadOnly", "true");

    const query = params.toString();
    return this.request(`/workflow/notifications?${query}`);
  }

  async getWorkflowAutomations() {
    return this.request("/workflow/automations");
  }

  async triggerAutomation(automationId: number) {
    return this.request(`/workflow/automations/${automationId}/trigger`, {
      method: "POST",
    });
  }

  async getCompletedLeads() {
    return this.request("/workflow/leads/completed");
  }

  async reorderProjectSteps(
    projectId: number,
    stepOrders: { id: number; order: number }[],
  ) {
    return this.request(`/workflow/projects/${projectId}/steps/reorder`, {
      method: "POST",
      body: JSON.stringify({ stepOrders }),
    });
  }

  async createProjectFollowUp(projectId: number, followUpData: any) {
    return this.request(`/workflow/projects/${projectId}/follow-ups`, {
      method: "POST",
      body: JSON.stringify(followUpData),
    });
  }
}

export const apiClient = new ApiClient();

// Reset circuit breaker for development/demo mode
apiClient.resetCircuitBreaker();
