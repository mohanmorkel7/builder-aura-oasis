import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login, loginWithSSO, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const success = await login(email, password);
    if (!success) {
      setError("Login failed. Please use the demo credentials: admin@banani.com, sales@banani.com, or product@banani.com with password 'password'");
    }
  };

  const handleSSOLogin = async (provider: string) => {
    setError("");
    await loginWithSSO(provider);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Banani App</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm border border-red-200">
                  <div className="flex items-center mb-2">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <span className="font-semibold">Login Failed</span>
                  </div>
                  <p className="mb-2">{error}</p>
                  <p className="text-xs bg-red-100 p-2 rounded">
                    <strong>Need help?</strong> Click any demo credential below to auto-fill the correct login details.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSSOLogin("google")}
                disabled={isLoading}
              >
                Google SSO
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSSOLogin("microsoft")}
                disabled={isLoading}
              >
                Microsoft SSO
              </Button>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-200">
              <p className="font-semibold mb-2 text-blue-800">Demo Credentials (Click to auto-fill):</p>

              <div className="space-y-1 mb-3">
                <button
                  type="button"
                  className="w-full text-left p-2 rounded bg-white hover:bg-blue-50 border border-blue-200 transition-colors"
                  onClick={() => {
                    setEmail("admin@banani.com");
                    setPassword("password");
                    setError("");
                  }}
                >
                  <span className="font-medium text-blue-700">Admin:</span> admin@banani.com / password
                </button>

                <button
                  type="button"
                  className="w-full text-left p-2 rounded bg-white hover:bg-blue-50 border border-blue-200 transition-colors"
                  onClick={() => {
                    setEmail("sales@banani.com");
                    setPassword("password");
                    setError("");
                  }}
                >
                  <span className="font-medium text-blue-700">Sales:</span> sales@banani.com / password
                </button>

                <button
                  type="button"
                  className="w-full text-left p-2 rounded bg-white hover:bg-blue-50 border border-blue-200 transition-colors"
                  onClick={() => {
                    setEmail("product@banani.com");
                    setPassword("password");
                    setError("");
                  }}
                >
                  <span className="font-medium text-blue-700">Product:</span> product@banani.com / password
                </button>
              </div>

              <p className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                💡 <strong>Tip:</strong> Click any credential above to auto-fill the form, then click "Sign in"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
