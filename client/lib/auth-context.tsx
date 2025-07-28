import React, { createContext, useContext, useState, useEffect } from "react";

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem("banani_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock authentication - in real app, this would be an API call
    const mockUsers: User[] = [
      { id: "1", name: "John Doe", email: "admin@banani.com", role: "admin" },
      { id: "2", name: "Jane Smith", email: "sales@banani.com", role: "sales" },
      {
        id: "3",
        name: "Mike Johnson",
        email: "product@banani.com",
        role: "product",
      },
    ];

    const foundUser = mockUsers.find((u) => u.email === email);
    if (foundUser && password === "password") {
      setUser(foundUser);
      localStorage.setItem("banani_user", JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const loginWithSSO = async (provider: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate SSO flow
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock SSO success
    const ssoUser: User = {
      id: "1",
      name: "John Doe",
      email: "admin@banani.com",
      role: "admin",
    };

    setUser(ssoUser);
    localStorage.setItem("banani_user", JSON.stringify(ssoUser));
    setIsLoading(false);
    return true;
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
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
