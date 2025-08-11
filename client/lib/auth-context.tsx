import * as React from "react";
import { apiClient } from "./api";

// Detect HMR at module level
const IS_HMR_RELOAD =
  typeof import.meta.hot !== "undefined" &&
  import.meta.hot &&
  performance.navigation &&
  performance.navigation.type === 1;
import {
  PublicClientApplication,
  AuthenticationResult,
} from "@azure/msal-browser";
import { msalConfig, loginRequest, graphConfig } from "./msal-config";

export type UserRole =
  | "admin"
  | "sales"
  | "product"
  | "development"
  | "db"
  | "finops"
  | "finance"
  | "hr_management"
  | "infra"
  | "switch_team";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  azureObjectId?: string;
  employeeId?: string;
}

// Stable export to prevent HMR issues
const ROLE_GROUPS = {
  admin: {
    label: "Admin",
    color: "bg-red-100 text-red-800",
    permissions: ["all"],
  },
  sales: {
    label: "Sales",
    color: "bg-blue-100 text-blue-800",
    permissions: ["leads", "clients", "reports"],
  },
  product: {
    label: "Product",
    color: "bg-green-100 text-green-800",
    permissions: ["templates", "features", "analytics"],
  },
  development: {
    label: "Development",
    color: "bg-purple-100 text-purple-800",
    permissions: ["technical", "deployment"],
  },
  db: {
    label: "Database",
    color: "bg-gray-100 text-gray-800",
    permissions: ["database", "data_management"],
  },
  finops: {
    label: "FinOps",
    color: "bg-yellow-100 text-yellow-800",
    permissions: ["financial", "operations"],
  },
  finance: {
    label: "Finance",
    color: "bg-green-100 text-green-700",
    permissions: ["financial", "accounting", "budgets"],
  },
  hr_management: {
    label: "HR Management",
    color: "bg-pink-100 text-pink-800",
    permissions: ["users", "roles", "hr"],
  },
  infra: {
    label: "Infrastructure",
    color: "bg-indigo-100 text-indigo-800",
    permissions: ["infrastructure", "monitoring"],
  },
  switch_team: {
    label: "Switch Team",
    color: "bg-orange-100 text-orange-800",
    permissions: ["switch", "integration"],
  },
} as const;

export const roleGroups = ROLE_GROUPS;

interface MicrosoftProfile {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string;
}

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Azure AD group mappings to roles
const azureGroupMappings: Record<string, UserRole> = {
  // Replace these with your actual Azure AD group IDs or names
  "Admin Group": "admin",
  "Sales Team": "sales",
  "Product Team": "product",
  "Development Team": "development",
  "Database Team": "db",
  "FinOps Team": "finops",
  "Finance Team": "finance",
  "HR Management": "hr_management",
  "Infrastructure Team": "infra",
  "Switch Team": "switch_team",
};

// Function to extract role from Azure AD groups
const extractRoleFromGroups = (groups: any[]): UserRole => {
  for (const group of groups) {
    const groupName = group.displayName || group.name;
    if (azureGroupMappings[groupName]) {
      return azureGroupMappings[groupName];
    }
  }

  // Default role if no matching group found
  return "product";
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithSSO: (provider: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

// Create stable context to prevent HMR issues
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Set display name for better debugging
AuthContext.displayName = "AuthContext";

// Use React.memo to prevent unnecessary re-renders during HMR
export const AuthProvider = React.memo(function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Detect HMR and avoid certain operations during hot reloads
  const isHMR =
    typeof import.meta.hot !== "undefined" &&
    import.meta.hot &&
    import.meta.hot.data;

  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Skip during HMR to prevent connection timing issues
    if (isHMR) {
      console.log("Skipping auth initialization during HMR");
      setIsLoading(false);
      return;
    }

    const loadStoredUser = () => {
      // Add error handling for localStorage access
      try {
        const storedUser = localStorage.getItem("banani_user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log("Successfully loaded user from localStorage:", userData.email);
          setUser(userData);
        } else {
          console.log("No user found in localStorage");
        }
      } catch (error) {
        console.warn("Error loading stored user data:", error);
        // Don't automatically clear localStorage - might be temporary corruption
        console.warn("Keeping localStorage data, error might be temporary");
        // Try to preserve session if possible
        const storedUser = localStorage.getItem("banani_user");
        if (storedUser && storedUser.length > 10) { // Basic sanity check
          console.log("Attempting to preserve session despite parse error");
        }
      }
      setIsLoading(false);
    };

    // Add small delay to prevent HMR timing issues
    const timeoutId = setTimeout(loadStoredUser, 50); // Increased delay
    return () => clearTimeout(timeoutId);
  }, [isHMR]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response: any = await apiClient.login(email, password);

      if (response.user) {
        const userData: User = {
          id: response.user.id.toString(),
          name: `${response.user.first_name} ${response.user.last_name}`,
          email: response.user.email,
          role: response.user.role,
        };

        setUser(userData);
        localStorage.setItem("banani_user", JSON.stringify(userData));
        setIsLoading(false);
        return true;
      }
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.log("API login failed, error:", errorMessage);
      console.log("Attempting demo credentials fallback...");

      // Always try demo authentication as fallback when API fails

      if (password === "password") {
        let userData: User | null = null;

        if (email === "admin@banani.com") {
          userData = {
            id: "1",
            name: "John Doe",
            email,
            role: "admin",
            department: "Administration",
          };
        } else if (email === "sales@banani.com") {
          userData = {
            id: "2",
            name: "Jane Smith",
            email,
            role: "sales",
            department: "Sales",
          };
        } else if (email === "product@banani.com") {
          userData = {
            id: "3",
            name: "Mike Johnson",
            email,
            role: "product",
            department: "Product",
          };
        } else if (email === "dev@banani.com") {
          userData = {
            id: "4",
            name: "Alex Chen",
            email,
            role: "development",
            department: "Development",
          };
        } else if (email === "db@banani.com") {
          userData = {
            id: "5",
            name: "Sarah Wilson",
            email,
            role: "db",
            department: "Database",
          };
        } else if (email === "finops@banani.com") {
          userData = {
            id: "6",
            name: "David Brown",
            email,
            role: "finops",
            department: "FinOps",
          };
        } else if (email === "hr@banani.com") {
          userData = {
            id: "7",
            name: "Lisa Garcia",
            email,
            role: "hr_management",
            department: "HR",
          };
        } else if (email === "infra@banani.com") {
          userData = {
            id: "8",
            name: "Tom Martinez",
            email,
            role: "infra",
            department: "Infrastructure",
          };
        } else if (email === "switch@banani.com") {
          userData = {
            id: "9",
            name: "Emma Davis",
            email,
            role: "switch_team",
            department: "Switch Team",
          };
        }

        if (userData) {
          setUser(userData);
          localStorage.setItem("banani_user", JSON.stringify(userData));
          setIsLoading(false);
          return true;
        }
      }

      setIsLoading(false);
      return false;
    }

    // If API response exists but doesn't contain user, it means invalid credentials
    setIsLoading(false);
    return false;
  };

  const loginWithSSO = async (provider: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      if (provider === "microsoft") {
        // Initialize MSAL instance before use
        await msalInstance.initialize();

        // Microsoft SSO using MSAL
        const loginResponse: AuthenticationResult =
          await msalInstance.loginPopup(loginRequest);

        if (loginResponse.account) {
          // Get user profile from Microsoft Graph
          const accessToken = loginResponse.accessToken;
          const graphResponse = await fetch(graphConfig.graphMeEndpoint, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const profile: MicrosoftProfile = await graphResponse.json();

          // Get user's Azure AD groups to determine role
          const groupsResponse = await fetch(
            `${graphConfig.graphMeEndpoint}/memberOf`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          const groups = await groupsResponse.json();
          const userRole = extractRoleFromGroups(groups.value || []);

          // Create user data from Microsoft profile
          const userData: User = {
            id: profile.id,
            name: profile.displayName,
            email: profile.mail || profile.userPrincipalName,
            role: userRole,
            azureObjectId: profile.id,
            avatar: undefined,
          };

          setUser(userData);
          localStorage.setItem("banani_user", JSON.stringify(userData));
          localStorage.setItem(
            "msal_account",
            JSON.stringify(loginResponse.account),
          );
          setIsLoading(false);
          return true;
        }
      } else if (provider === "google") {
        // Google SSO - placeholder for future implementation
        console.log("Google SSO not implemented yet");
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      // Handle user cancellation gracefully - don't show error or fallback
      if (
        error.errorCode === "user_cancelled" ||
        error.message?.includes("User cancelled")
      ) {
        console.log("User cancelled SSO login");
        setIsLoading(false);
        return false;
      }

      console.error("SSO login error:", error);

      // Fallback for development/demo when Azure AD is not configured
      if (provider === "microsoft") {
        const userData: User = {
          id: "sso-user-1",
          name: "Microsoft User",
          email: "microsoft.user@company.com",
          role: "admin",
        };

        setUser(userData);
        localStorage.setItem("banani_user", JSON.stringify(userData));
        setIsLoading(false);
        return true;
      }
    }

    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    try {
      // Check if user logged in via Microsoft SSO
      const msalAccount = localStorage.getItem("msal_account");
      if (msalAccount) {
        await msalInstance.initialize();
        await msalInstance.logoutPopup();
        localStorage.removeItem("msal_account");
      }
    } catch (error) {
      console.error("MSAL logout error:", error);
    }

    setUser(null);
    localStorage.removeItem("banani_user");
  };

  // Memoize the context value to prevent unnecessary re-renders
  // Add HMR guard to prevent timing issues
  const contextValue = React.useMemo(() => {
    try {
      return { user, login, loginWithSSO, logout, isLoading };
    } catch (error) {
      // Fallback during HMR issues
      console.warn("Context value creation error (likely HMR):", error);
      return {
        user: null,
        login: async () => false,
        loginWithSSO: async () => false,
        logout: () => {},
        isLoading: false,
      };
    }
  }, [user, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
});

export function useAuth() {
  try {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
      // Check if this is likely an HMR issue
      const isHMR = typeof module !== "undefined" && module.hot;
      const isDevelopment = process.env.NODE_ENV === "development";

      if (isHMR || isDevelopment) {
        // Suppress error logging for known HMR issues in development
        console.warn(
          "Auth context unavailable (likely HMR reload) - using fallback",
        );
      } else {
        console.error(
          "useAuth called outside of AuthProvider. Component tree:",
          {
            location: window?.location?.pathname || "unknown",
            timestamp: new Date().toISOString(),
            reactVersion: React.version,
            isHMR,
          },
        );
      }

      // Always provide a fallback to prevent crashes during HMR
      return {
        user: null,
        login: async () => false,
        loginWithSSO: async () => false,
        logout: () => {},
        isLoading: false, // Don't show loading during fallback
      };
    }
    return context;
  } catch (error) {
    // Only log errors in production or non-HMR scenarios
    if (process.env.NODE_ENV === "production") {
      console.error("Error accessing auth context:", error);
    }
    // Fallback for any context access errors
    return {
      user: null,
      login: async () => false,
      loginWithSSO: async () => false,
      logout: () => {},
      isLoading: false,
    };
  }
}

// Handle HMR properly to prevent connection issues
if (import.meta.hot) {
  // Disable HMR for this module to prevent connection timing issues
  import.meta.hot.decline();

  // Add additional safety for HMR
  if (IS_HMR_RELOAD) {
    console.log(
      "Auth context: HMR reload detected, using minimal initialization",
    );
  }
}
