import * as React from "react";
import { apiClient } from "./api";

export type UserRole = "admin" | "sales" | "product";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

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
    } catch (error) {
      console.error("API login failed:", error);
    }

    // Always try demo authentication fallback regardless of API result
    console.log("Trying demo authentication...");

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
        console.log("Demo authentication successful:", userData.role);
        setUser(userData);
        localStorage.setItem("banani_user", JSON.stringify(userData));
        setIsLoading(false);
        return true;
      }
    }

    // If demo auth also fails, provide helpful message
    console.log(
      "Login failed. Use: admin@banani.com / sales@banani.com / product@banani.com with password: password",
    );

    setIsLoading(false);
    return false;
  };

  const loginWithSSO = async (provider: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      // For demo purposes, SSO will use the default admin credentials
      const response: any = await apiClient.login(
        "admin@banani.com",
        "password",
      );

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
    } catch (error) {
      console.error("SSO login error:", error);

      // Fallback SSO login - always authenticate as admin for demo
      const userData: User = {
        id: "1",
        name: "John Doe",
        email: "admin@banani.com",
        role: "admin",
      };

      setUser(userData);
      localStorage.setItem("banani_user", JSON.stringify(userData));
      setIsLoading(false);
      return true;
    }
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
