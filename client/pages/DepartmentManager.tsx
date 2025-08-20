import React, { useState, useRef } from "react";
import { apiClient } from "@/lib/api";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  Users,
  Building,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";

interface Department {
  name: string;
  permissions: string[];
  users: string[];
}

interface UserData {
  email: string;
  displayName: string;
  givenName: string;
  surname: string;
  jobTitle: string;
  department: string;
  ssoId: string;
  role?: string;
  authType?: string;
  status?: string;
  createdAt?: string;
}

interface DepartmentData {
  departments: Record<string, Department>;
  users: UserData[];
}

interface DatabaseUsersData {
  users: UserData[];
  departments: Record<string, Department>;
  totalUsers: number;
  usersByRole: Record<string, number>;
  databaseStatus?: "available" | "unavailable";
  message?: string;
}

export default function DepartmentManager() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [currentData, setCurrentData] = useState<DepartmentData | null>(null);
  const [databaseUsers, setDatabaseUsers] = useState<DatabaseUsersData | null>(null);
  const [viewMode, setViewMode] = useState<"json" | "database">("database");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json") {
      setUploadStatus({
        type: "error",
        message: "Please upload a valid JSON file.",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: null, message: "" });

    try {
      const fileContent = await file.text();
      const parsedData = JSON.parse(fileContent);

      // Validate JSON structure
      if (!parsedData.departments || !parsedData.users) {
        throw new Error(
          "Invalid JSON structure. Must contain 'departments' and 'users' properties.",
        );
      }

      // Upload to server
      const response = await apiClient.request(
        "/auth/admin/upload-departments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsedData),
        },
      );

      if (response.success) {
        const data = response.data;
        let detailedMessage = response.message || "Upload completed.";

        if (data) {
          detailedMessage += `\n\nDetailed Results:`;
          detailedMessage += `\n• Total users in upload: ${parsedData.users.length}`;
          detailedMessage += `\n• New users added: ${data.newUserCount || 0}`;
          detailedMessage += `\n• Users skipped (already in database): ${data.skippedInDatabase || 0}`;
          detailedMessage += `\n• Users skipped (already in JSON): ${data.skippedInJson || 0}`;
          detailedMessage += `\n• Total users now in system: ${data.totalUsersInJson || 0}`;
          detailedMessage += `\n• Departments processed: ${data.departmentCount || 0}`;
        }

        setUploadStatus({
          type: "success",
          message: detailedMessage,
        });
        // Reload current data to show updated state
        await loadCurrentData();
        await loadDatabaseUsers();
      } else {
        throw new Error(response.error || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadStatus({
        type: "error",
        message: error.message || "Failed to upload department data.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const downloadTemplate = () => {
    const template: DepartmentData = {
      departments: {
        hr: {
          name: "Human Resources",
          permissions: ["users", "reports", "settings"],
          users: [],
        },
        finance: {
          name: "Finance",
          permissions: ["finops", "reports", "billing"],
          users: [],
        },
        database: {
          name: "Database",
          permissions: ["admin", "database", "settings"],
          users: [],
        },
        frontend: {
          name: "Frontend Development",
          permissions: ["product", "leads", "vc"],
          users: [],
        },
        backend: {
          name: "Backend Development",
          permissions: ["admin", "product", "database", "leads", "vc"],
          users: [],
        },
        infra: {
          name: "Infrastructure",
          permissions: ["admin", "settings", "database"],
          users: [],
        },
        admin: {
          name: "Administration",
          permissions: [
            "admin",
            "users",
            "reports",
            "settings",
            "database",
            "finops",
            "finance",
            "product",
            "leads",
            "vc",
          ],
          users: [],
        },
        administration: {
          name: "Administration",
          permissions: [
            "admin",
            "users",
            "reports",
            "settings",
            "database",
            "finops",
            "finance",
            "product",
            "leads",
            "vc",
          ],
          users: [],
        },
      },
      users: [
        {
          email: "mohan.m@mylapay.com",
          displayName: "Mohan Raj Ravichandran",
          givenName: "Mohan Raj",
          surname: "Ravichandran",
          jobTitle: "Director Technology",
          department: "admin",
          ssoId: "a416d1c8-bc01-4acd-8cad-3210a78d01a9",
        },
        {
          email: "john.doe@mylapay.com",
          displayName: "John Doe",
          givenName: "John",
          surname: "Doe",
          jobTitle: "Software Engineer",
          department: "backend",
          ssoId: "microsoft-sso-id-here",
        },
        {
          email: "jane.smith@mylapay.com",
          displayName: "Jane Smith",
          givenName: "Jane",
          surname: "Smith",
          jobTitle: "Project Manager",
          // Note: No department field - will become "unknown" user
        },
      ],
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "user-departments-template.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadCurrentData = async () => {
    try {
      const response = await apiClient.request(
        "/auth/admin/current-departments",
      );
      if (response.success) {
        setCurrentData(response.data);
      }
    } catch (error) {
      console.error("Error loading current data:", error);
    }
  };

  const loadDatabaseUsers = async () => {
    try {
      const response = await apiClient.request(
        "/auth/admin/database-users",
      );
      if (response.success) {
        setDatabaseUsers(response.data);
      }
    } catch (error) {
      console.error("Error loading database users:", error);
    }
  };

  React.useEffect(() => {
    loadCurrentData();
    loadDatabaseUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Department Manager</h1>
        <p className="text-gray-600 mt-1">
          Manage user department assignments and permissions via JSON upload
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload Department Data</span>
            </CardTitle>
            <CardDescription>
              Upload a JSON file containing user department assignments. Users
              already existing in the database (by email) will be skipped and
              not updated. Users without a "department" field will be marked as
              "unknown" for manual role assignment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jsonFile">JSON File</Label>
              <Input
                ref={fileInputRef}
                id="jsonFile"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="mt-1"
              />
            </div>

            {uploadStatus.type && (
              <Alert
                variant={
                  uploadStatus.type === "error" ? "destructive" : "default"
                }
              >
                {uploadStatus.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{uploadStatus.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">JSON Structure:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <code>departments</code>: Object with department codes as keys
                </li>
                <li>
                  <code>users</code>: Array of user objects with email, name,
                  department, etc.
                </li>
                <li>
                  Each user must have: email, displayName, department, ssoId
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Current Data Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>
                {viewMode === "database" ? "Database Users" : "JSON Department Data"}
              </span>
            </CardTitle>
            <CardDescription>
              {viewMode === "database"
                ? "All users currently in the database, including those with unknown roles"
                : "Preview of currently loaded department assignments from JSON file"
              }
            </CardDescription>
            <div className="flex space-x-2 mt-2">
              <Button
                variant={viewMode === "database" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("database")}
              >
                Database View
              </Button>
              <Button
                variant={viewMode === "json" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("json")}
              >
                JSON View
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "database" && databaseUsers ? (
              <div className="space-y-4">
                {databaseUsers.databaseStatus === "unavailable" && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-yellow-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Database Unavailable</span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                      {databaseUsers.message || "PostgreSQL is not running. Please start the database to view users."}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Users:</span> {databaseUsers.totalUsers}
                  </div>
                  <div>
                    <span className="font-medium">Departments:</span> {Object.keys(databaseUsers.departments).length}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4" />
                    <span>Users by Role</span>
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(databaseUsers.usersByRole).map(([role, count]) => (
                      <Badge key={role} variant={role === "unknown" ? "destructive" : "outline"}>
                        {role}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Recent Users</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {databaseUsers.users.length > 0 ? (
                      databaseUsers.users.map((user, index) => (
                        <div
                          key={index}
                          className="text-sm flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{user.displayName}</div>
                            <div className="text-gray-500 text-xs">{user.email}</div>
                            {user.jobTitle && (
                              <div className="text-gray-400 text-xs">{user.jobTitle}</div>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <Badge
                              variant={user.role === "unknown" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {user.role}
                            </Badge>
                            {user.department && user.department !== "unknown" && (
                              <Badge variant="outline" className="text-xs">
                                {user.department}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>
                          {databaseUsers.databaseStatus === "unavailable"
                            ? "Database unavailable - cannot load users"
                            : "No users found in database"
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {databaseUsers.usersByRole.unknown && databaseUsers.usersByRole.unknown > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-orange-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">
                        {databaseUsers.usersByRole.unknown} users need role assignment
                      </span>
                    </div>
                    <p className="text-orange-700 text-sm mt-1">
                      These users were imported without department information and need manual role assignment.
                    </p>
                  </div>
                )}
              </div>
            ) : viewMode === "json" && currentData ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center space-x-2 mb-2">
                    <Building className="w-4 h-4" />
                    <span>
                      Departments ({Object.keys(currentData.departments).length})
                    </span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(currentData.departments).map(
                      ([code, dept]) => (
                        <Badge key={code} variant="outline">
                          {dept.name} ({dept.permissions.length} permissions)
                        </Badge>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4" />
                    <span>Users ({currentData.users.length})</span>
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {currentData.users.map((user, index) => (
                      <div
                        key={index}
                        className="text-sm flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span>{user.displayName}</span>
                        <Badge variant="secondary">{user.department}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>
                  {viewMode === "database"
                    ? "No users found in database"
                    : "No department data loaded"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
