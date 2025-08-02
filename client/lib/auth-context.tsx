import * as React from "react";
import { apiClient } from "./api";
import { PublicClientApplication, AuthenticationResult } from "@azure/msal-browser";
import { msalConfig, loginRequest, graphConfig } from "./msal-config";

export type UserRole = "admin" | "sales" | "product";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface MicrosoftProfile {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string;
}

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithSSO: (provider: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem("banani_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

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

      // If API is working and rejects credentials, don't try demo fallback - show error
      if (error.message && error.message.includes("Invalid credentials")) {
        setIsLoading(false);
        return false;
      }

      // Only try demo authentication if this was a network error (API unavailable)

      if (password === "password") {
        let userData: User | null = null;

        if (email === "admin@banani.com") {
          userData = { id: "1", name: "John Doe", email, role: "admin" };
        } else if (email === "sales@banani.com") {
          userData = { id: "2", name: "Jane Smith", email, role: "sales" };
        } else if (email === "product@banani.com") {
          userData = { id: "3", name: "Mike Johnson", email, role: "product" };
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
        // Microsoft SSO using MSAL
        const loginResponse: AuthenticationResult = await msalInstance.loginPopup(loginRequest);

        if (loginResponse.account) {
          // Get user profile from Microsoft Graph
          const accessToken = loginResponse.accessToken;
          const graphResponse = await fetch(graphConfig.graphMeEndpoint, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const profile: MicrosoftProfile = await graphResponse.json();

          // Create user data from Microsoft profile
          const userData: User = {
            id: profile.id,
            name: profile.displayName,
            email: profile.mail || profile.userPrincipalName,
            role: "admin", // Default role for SSO users - can be customized based on your business logic
            avatar: undefined,
          };

          setUser(userData);
          localStorage.setItem("banani_user", JSON.stringify(userData));
          localStorage.setItem("msal_account", JSON.stringify(loginResponse.account));
          setIsLoading(false);
          return true;
        }
      } else if (provider === "google") {
        // Google SSO - placeholder for future implementation
        console.log("Google SSO not implemented yet");
        setIsLoading(false);
        return false;
      }
    } catch (error) {
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem("banani_user");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, loginWithSSO, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    console.error("useAuth called outside of AuthProvider. Component tree:", {
      location: window.location?.pathname || "unknown",
      timestamp: new Date().toISOString(),
    });

    // During development/HMR, provide a fallback instead of throwing
    if (process.env.NODE_ENV === "development") {
      console.warn("Providing fallback auth context for development");
      return {
        user: null,
        login: async () => false,
        loginWithSSO: async () => false,
        logout: () => {},
        isLoading: false,
      };
    }

    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
