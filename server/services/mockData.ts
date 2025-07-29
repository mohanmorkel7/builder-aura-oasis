import bcrypt from "bcryptjs";

// Mock data that will be used when database is not available
export const mockUsers = [
  {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "admin@banani.com",
    phone: "+1 (555) 123-4567",
    password_hash:
      "$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y", // 'password'
    role: "admin" as const,
    department: "Administration",
    manager_id: null,
    status: "active" as const,
    start_date: "2023-01-10",
    last_login: "2024-01-15T10:30:00Z",
    two_factor_enabled: false,
    notes: "System administrator",
    created_at: "2023-01-10T09:00:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    first_name: "Jane",
    last_name: "Smith",
    email: "sales@banani.com",
    phone: "+1 (555) 234-5678",
    password_hash:
      "$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y", // 'password'
    role: "sales" as const,
    department: "Sales & Marketing",
    manager_id: 1,
    status: "active" as const,
    start_date: "2023-02-15",
    last_login: "2024-01-14T14:20:00Z",
    two_factor_enabled: true,
    notes: "Senior sales representative",
    created_at: "2023-02-15T09:00:00Z",
    updated_at: "2024-01-14T14:20:00Z",
  },
  {
    id: 3,
    first_name: "Mike",
    last_name: "Johnson",
    email: "product@banani.com",
    phone: "+1 (555) 345-6789",
    password_hash:
      "$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y", // 'password'
    role: "product" as const,
    department: "Product Development",
    manager_id: 1,
    status: "active" as const,
    start_date: "2023-03-20",
    last_login: "2024-01-13T16:45:00Z",
    two_factor_enabled: false,
    notes: "Lead product manager",
    created_at: "2023-03-20T09:00:00Z",
    updated_at: "2024-01-13T16:45:00Z",
  },
  {
    id: 4,
    first_name: "Sarah",
    last_name: "Wilson",
    email: "sarah@banani.com",
    phone: "+1 (555) 456-7890",
    password_hash:
      "$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y", // 'password'
    role: "sales" as const,
    department: "Sales & Marketing",
    manager_id: 2,
    status: "inactive" as const,
    start_date: "2023-04-01",
    last_login: "2023-12-20T12:00:00Z",
    two_factor_enabled: false,
    notes: "On temporary leave",
    created_at: "2023-04-01T09:00:00Z",
    updated_at: "2023-12-20T12:00:00Z",
  },
  {
    id: 5,
    first_name: "Tom",
    last_name: "Brown",
    email: "tom@banani.com",
    phone: "+1 (555) 567-8901",
    password_hash:
      "$2b$10$rOyZUjbEf8Z8gzLl5wF9YeS7YbZzI.sVGzJxJ8MG8KnYxRgQ8nO0y", // 'password'
    role: "product" as const,
    department: "Product Development",
    manager_id: 3,
    status: "pending" as const,
    start_date: "2024-01-10",
    last_login: null,
    two_factor_enabled: false,
    notes: "New hire - pending setup",
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-01-10T09:00:00Z",
  },
];

export const mockClients = [
  {
    id: 1,
    client_name: "Acme Corp",
    contact_person: "Jane Doe",
    email: "jane@acme.com",
    phone: "+1 (555) 123-4567",
    company_size: "large",
    industry: "technology",
    address: "123 Business Ave",
    city: "New York",
    state: "NY",
    zip_code: "10001",
    country: "us",
    expected_value: 50000,
    priority: "high" as const,
    status: "active" as const,
    sales_rep_id: 2,
    start_date: "2023-10-26",
    notes: "Important enterprise client",
    created_at: "2023-10-26T09:00:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    sales_rep_name: "Jane Smith",
  },
  {
    id: 2,
    client_name: "Globex Inc.",
    contact_person: "Bob Wilson",
    email: "bob@globex.com",
    phone: "+1 (555) 234-5678",
    company_size: "medium",
    industry: "finance",
    address: "456 Corporate Blvd",
    city: "Chicago",
    state: "IL",
    zip_code: "60601",
    country: "us",
    expected_value: 25000,
    priority: "medium" as const,
    status: "onboarding" as const,
    sales_rep_id: 2,
    start_date: "2023-10-20",
    notes: "In onboarding process",
    created_at: "2023-10-20T09:00:00Z",
    updated_at: "2024-01-14T14:20:00Z",
    sales_rep_name: "Jane Smith",
  },
  {
    id: 3,
    client_name: "Soylent Corp",
    contact_person: "Alice Green",
    email: "alice@soylent.com",
    phone: "+1 (555) 345-6789",
    company_size: "small",
    industry: "manufacturing",
    address: "789 Industrial Way",
    city: "Detroit",
    state: "MI",
    zip_code: "48201",
    country: "us",
    expected_value: 15000,
    priority: "low" as const,
    status: "completed" as const,
    sales_rep_id: 2,
    start_date: "2023-09-15",
    notes: "Successfully onboarded",
    created_at: "2023-09-15T09:00:00Z",
    updated_at: "2023-11-01T16:00:00Z",
    sales_rep_name: "Jane Smith",
  },
  {
    id: 4,
    client_name: "Initech",
    contact_person: "Peter Gibbons",
    email: "peter@initech.com",
    phone: "+1 (555) 456-7890",
    company_size: "medium",
    industry: "technology",
    address: "321 Office Park Dr",
    city: "Austin",
    state: "TX",
    zip_code: "73301",
    country: "us",
    expected_value: 35000,
    priority: "high" as const,
    status: "active" as const,
    sales_rep_id: 2,
    start_date: "2023-10-25",
    notes: "Rapid growth potential",
    created_at: "2023-10-25T09:00:00Z",
    updated_at: "2024-01-13T11:15:00Z",
    sales_rep_name: "Jane Smith",
  },
];

export const mockTemplates = [
  {
    id: 1,
    name: "Standard Client Onboarding",
    description:
      "A comprehensive template for standard client onboarding, covering initial contact to final setup.",
    type: "standard" as const,
    is_active: true,
    created_by: 1,
    created_at: "2023-01-15T09:00:00Z",
    updated_at: "2023-01-15T09:00:00Z",
    step_count: 5,
    creator_name: "John Doe",
    steps: [
      {
        id: 1,
        template_id: 1,
        step_order: 1,
        name: "Initial Contact",
        description:
          "Reach out to the client to introduce the onboarding process.",
        default_eta_days: 2,
        auto_alert: true,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
      },
      {
        id: 2,
        template_id: 1,
        step_order: 2,
        name: "Document Collection",
        description:
          "Gather all necessary legal and financial documents from the client.",
        default_eta_days: 5,
        auto_alert: true,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
      },
      {
        id: 3,
        template_id: 1,
        step_order: 3,
        name: "Contract Signing",
        description: "Review and execute service agreements.",
        default_eta_days: 3,
        auto_alert: true,
        email_reminder: false,
        created_at: "2023-01-15T09:00:00Z",
      },
      {
        id: 4,
        template_id: 1,
        step_order: 4,
        name: "Account Setup",
        description: "Create client accounts and configure initial settings.",
        default_eta_days: 2,
        auto_alert: false,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
      },
      {
        id: 5,
        template_id: 1,
        step_order: 5,
        name: "Training Session",
        description: "Conduct onboarding training and knowledge transfer.",
        default_eta_days: 7,
        auto_alert: false,
        email_reminder: true,
        created_at: "2023-01-15T09:00:00Z",
      },
    ],
  },
  {
    id: 2,
    name: "Enterprise Client Onboarding",
    description:
      "Tailored onboarding process for large enterprise clients with complex integration requirements.",
    type: "enterprise" as const,
    is_active: true,
    created_by: 1,
    created_at: "2023-01-15T09:00:00Z",
    updated_at: "2023-01-15T09:00:00Z",
    step_count: 8,
    creator_name: "John Doe",
  },
  {
    id: 3,
    name: "SMB Onboarding Lite",
    description:
      "A streamlined onboarding template for small to medium businesses with essential steps.",
    type: "smb" as const,
    is_active: true,
    created_by: 1,
    created_at: "2023-01-15T09:00:00Z",
    updated_at: "2023-01-15T09:00:00Z",
    step_count: 3,
    creator_name: "John Doe",
  },
];

export const mockDeployments = [
  {
    id: 1,
    product_id: 1,
    version: "v2.1.0",
    environment: "production" as const,
    status: "completed" as const,
    description: "Major release with new features",
    assigned_to: 3,
    scheduled_date: "2024-07-18T10:00:00Z",
    started_at: "2024-07-18T10:00:00Z",
    completed_at: "2024-07-18T11:30:00Z",
    auto_rollback: true,
    run_tests: true,
    notify_team: true,
    require_approval: true,
    release_notes: "Added new dashboard features and performance improvements",
    created_by: 3,
    created_at: "2024-07-15T09:00:00Z",
    updated_at: "2024-07-18T11:30:00Z",
    product_name: "Core App",
    assigned_to_name: "Mike Johnson",
    created_by_name: "Mike Johnson",
  },
  {
    id: 2,
    product_id: 2,
    version: "v1.5.2",
    environment: "production" as const,
    status: "failed" as const,
    description: "Analytics module update",
    assigned_to: 3,
    scheduled_date: "2024-07-17T14:00:00Z",
    started_at: "2024-07-17T14:00:00Z",
    completed_at: "2024-07-17T14:45:00Z",
    auto_rollback: true,
    run_tests: true,
    notify_team: true,
    require_approval: false,
    release_notes: "Bug fixes and minor improvements",
    created_by: 3,
    created_at: "2024-07-16T09:00:00Z",
    updated_at: "2024-07-17T14:45:00Z",
    product_name: "Analytics Module",
    assigned_to_name: "Mike Johnson",
    created_by_name: "Mike Johnson",
  },
  {
    id: 3,
    product_id: 3,
    version: "v3.0.1",
    environment: "production" as const,
    status: "completed" as const,
    description: "API Gateway security patch",
    assigned_to: 3,
    scheduled_date: "2024-07-16T09:00:00Z",
    started_at: "2024-07-16T09:00:00Z",
    completed_at: "2024-07-16T09:30:00Z",
    auto_rollback: true,
    run_tests: true,
    notify_team: true,
    require_approval: true,
    release_notes: "Security updates and bug fixes",
    created_by: 3,
    created_at: "2024-07-15T16:00:00Z",
    updated_at: "2024-07-16T09:30:00Z",
    product_name: "API Gateway",
    assigned_to_name: "Mike Johnson",
    created_by_name: "Mike Johnson",
  },
  {
    id: 4,
    product_id: 4,
    version: "v1.2.3",
    environment: "staging" as const,
    status: "pending" as const,
    description: "Mobile app feature update",
    assigned_to: 3,
    scheduled_date: "2024-07-20T10:00:00Z",
    started_at: null,
    completed_at: null,
    auto_rollback: true,
    run_tests: true,
    notify_team: true,
    require_approval: false,
    release_notes: "New user interface improvements",
    created_by: 3,
    created_at: "2024-07-15T10:00:00Z",
    updated_at: "2024-07-15T10:00:00Z",
    product_name: "Mobile App",
    assigned_to_name: "Mike Johnson",
    created_by_name: "Mike Johnson",
  },
];

export const mockProducts = [
  {
    id: 1,
    name: "Core App",
    description: "Main application platform",
    current_version: "v2.0.9",
    repository_url: "https://github.com/company/core-app",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-18T11:30:00Z",
  },
  {
    id: 2,
    name: "Analytics Module",
    description: "Data analytics and reporting",
    current_version: "v1.5.1",
    repository_url: "https://github.com/company/analytics",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-17T14:45:00Z",
  },
  {
    id: 3,
    name: "API Gateway",
    description: "API management and routing",
    current_version: "v3.0.0",
    repository_url: "https://github.com/company/api-gateway",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-16T09:30:00Z",
  },
  {
    id: 4,
    name: "Mobile App",
    description: "Mobile application",
    current_version: "v1.2.2",
    repository_url: "https://github.com/company/mobile-app",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-15T10:00:00Z",
  },
  {
    id: 5,
    name: "Reporting Service",
    description: "Report generation service",
    current_version: "v0.8.9",
    repository_url: "https://github.com/company/reporting",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2024-07-14T16:00:00Z",
  },
];

// Helper functions for mock data operations
export class MockDataService {
  private static users = [...mockUsers];
  private static clients = [...mockClients];
  private static templates = [...mockTemplates];
  private static deployments = [...mockDeployments];
  private static nextUserId = 6;
  private static nextClientId = 5;
  private static nextTemplateId = 4;
  private static nextDeploymentId = 5;

  // User operations
  static async findUserByEmail(email: string) {
    return this.users.find((user) => user.email === email) || null;
  }

  static async verifyPassword(email: string, password: string) {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async getAllUsers() {
    return this.users.map(({ password_hash, ...user }) => user);
  }

  static async createUser(userData: any) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const newUser = {
      id: this.nextUserId++,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone || null,
      password_hash: passwordHash,
      role: userData.role,
      department: userData.department || null,
      manager_id: userData.manager_id || null,
      status: "active" as const,
      start_date: userData.start_date || null,
      last_login: null,
      two_factor_enabled: userData.two_factor_enabled || false,
      notes: userData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.users.push(newUser);
    const { password_hash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  static async updateUser(id: number, userData: any) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return null;

    this.users[index] = {
      ...this.users[index],
      ...userData,
      updated_at: new Date().toISOString(),
    };
    const { password_hash, ...userWithoutPassword } = this.users[index];
    return userWithoutPassword;
  }

  static async deleteUser(id: number) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return false;

    this.users.splice(index, 1);
    return true;
  }

  // Client operations
  static async getAllClients() {
    return this.clients;
  }

  static async createClient(clientData: any) {
    const newClient = {
      id: this.nextClientId++,
      ...clientData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.clients.push(newClient);
    return newClient;
  }

  static async updateClient(id: number, clientData: any) {
    const index = this.clients.findIndex((client) => client.id === id);
    if (index === -1) return null;

    this.clients[index] = {
      ...this.clients[index],
      ...clientData,
      updated_at: new Date().toISOString(),
    };
    return this.clients[index];
  }

  static async deleteClient(id: number) {
    const index = this.clients.findIndex((client) => client.id === id);
    if (index === -1) return false;

    this.clients.splice(index, 1);
    return true;
  }

  // Template operations
  static async getAllTemplates() {
    return this.templates;
  }

  static async createTemplate(templateData: any) {
    const newTemplate = {
      id: this.nextTemplateId++,
      ...templateData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.templates.push(newTemplate);
    return newTemplate;
  }

  // Deployment operations
  static async getAllDeployments() {
    return this.deployments;
  }

  static async createDeployment(deploymentData: any) {
    const product = mockProducts.find(
      (p) => p.id === deploymentData.product_id,
    );
    const newDeployment = {
      id: this.nextDeploymentId++,
      ...deploymentData,
      product_name: product?.name || "Unknown Product",
      assigned_to_name: "Mike Johnson",
      created_by_name: "Mike Johnson",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.deployments.push(newDeployment);
    return newDeployment;
  }

  // Products
  static async getAllProducts() {
    return mockProducts;
  }

  // Stats
  static async getClientStats() {
    return {
      total: this.clients.length,
      active: this.clients.filter((c) => c.status === "active").length,
      onboarding: this.clients.filter((c) => c.status === "onboarding").length,
      completed: this.clients.filter((c) => c.status === "completed").length,
    };
  }

  static async getDeploymentStats() {
    return {
      total: this.deployments.length,
      completed: this.deployments.filter((d) => d.status === "completed")
        .length,
      failed: this.deployments.filter((d) => d.status === "failed").length,
      pending: this.deployments.filter((d) => d.status === "pending").length,
    };
  }
}
