import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { msalConfig, syncRequest, graphConfig } from "./msal-config";

// Initialize MSAL instance
let msalInstance: PublicClientApplication | null = null;
let msalInitialized = false;

export const initializeMsal = async (): Promise<PublicClientApplication> => {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }

  if (!msalInitialized) {
    await msalInstance.initialize();
    msalInitialized = true;
  }

  return msalInstance;
};

export class AzureSyncService {
  private msal: PublicClientApplication | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Don't initialize in constructor, do it lazily
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initializeMsal();
    }
    await this.initPromise;
  }

  private async initializeMsal(): Promise<void> {
    try {
      this.msal = await initializeMsal();
    } catch (error) {
      console.error("Failed to initialize MSAL:", error);
      throw new Error(`MSAL initialization failed: ${error.message}`);
    }
  }

  /**
   * Get access token for Microsoft Graph API
   */
  async getAccessToken(): Promise<string> {
    try {
      await this.ensureInitialized();

      if (!this.msal) {
        throw new Error("MSAL instance not initialized");
      }

      // Check if user is already signed in
      const accounts = this.msal.getAllAccounts();
      let account: AccountInfo | null = null;

      if (accounts.length > 0) {
        account = accounts[0];
      } else {
        // No accounts found, need to login
        const loginResponse = await this.msal.loginPopup(syncRequest);
        account = loginResponse.account;
      }

      if (!account) {
        throw new Error("No account found. Please sign in first.");
      }

      // Get access token silently
      try {
        const tokenResponse = await this.msal.acquireTokenSilent({
          ...syncRequest,
          account: account,
        });
        return tokenResponse.accessToken;
      } catch (silentError) {
        console.warn(
          "Silent token acquisition failed, trying popup:",
          silentError,
        );

        // If silent acquisition fails, try interactive popup
        const tokenResponse = await this.msal.acquireTokenPopup({
          ...syncRequest,
          account: account,
        });
        return tokenResponse.accessToken;
      }
    } catch (error) {
      console.error("Failed to get access token:", error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Sync users from Azure AD
   */
  async syncUsersFromAzure(): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch("/api/azure-sync/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage =
                errorJson.message || errorJson.error || errorMessage;
            } catch {
              errorMessage = errorText;
            }
          }
        } catch (readError) {
          console.warn("Could not read error response:", readError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Azure sync failed:", error);
      throw error;
    }
  }

  /**
   * Test Graph API connection
   */
  async testGraphConnection(): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(graphConfig.graphUsersEndpoint + "?$top=1", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Graph API test failed: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Graph API test failed:", error);
      throw error;
    }
  }

  /**
   * Check if user has required permissions
   */
  async checkPermissions(): Promise<boolean> {
    try {
      await this.testGraphConnection();
      return true;
    } catch (error) {
      if (
        error.message.includes("403") ||
        error.message.includes("Forbidden")
      ) {
        console.error("Insufficient permissions for Azure sync");
        return false;
      }
      throw error;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<AccountInfo | null> {
    try {
      await this.ensureInitialized();

      if (!this.msal) {
        return null;
      }

      const accounts = this.msal.getAllAccounts();
      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error("Failed to get current user:", error);
      return null;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    await this.msal.logoutPopup();
  }
}

// Export singleton instance
export const azureSyncService = new AzureSyncService();
