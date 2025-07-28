import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Clock, AlertTriangle, CheckCircle, Users } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "overdue",
    title: "Overdue: Client Onboarding - Step 1",
    description:
      "Initial Contact for 'Acme Corp' is 2 days overdue. Action required.",
    time: "2 hours ago",
    action: "View Client",
    icon: AlertTriangle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    read: false,
  },
  {
    id: 2,
    type: "followup",
    title: "New Follow-up: Project Alpha",
    description:
      "A new follow-up note has been added to 'Project Alpha' by Jane Smith.",
    time: "Yesterday",
    action: "View Follow-up",
    icon: Users,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    read: false,
  },
  {
    id: 3,
    type: "missed-eta",
    title: "Missed ETA: Product Deployment - Phase 2",
    description:
      "The ETA for 'Product X' deployment, Phase 2, was missed. Review progress.",
    time: "3 days ago",
    action: "View Product",
    icon: Clock,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    read: true,
  },
  {
    id: 4,
    type: "completed",
    title: "Onboarding Complete: Global Solutions",
    description:
      "Client 'Global Solutions' has successfully completed their onboarding process.",
    time: "5 days ago",
    action: "View Client",
    icon: CheckCircle,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    read: true,
  },
];

export default function AlertsNotifications() {
  const [activeTab, setActiveTab] = useState("all");
  const [markAllAsRead, setMarkAllAsRead] = useState(false);

  const handleMarkAsRead = (id: number) => {
    // In a real app, this would update the backend
    console.log("Marking notification as read:", id);
  };

  const handleMarkAllAsRead = () => {
    setMarkAllAsRead(true);
    // In a real app, this would update the backend
    console.log("Marking all notifications as read");
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read && !markAllAsRead;
    if (activeTab === "overdue") return notification.type === "overdue";
    if (activeTab === "follow-ups") return notification.type === "followup";
    return true;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Alerts & Notifications
          </h1>
          <p className="text-gray-600 mt-1">
            Stay updated with important events and tasks
          </p>
        </div>
        <Button onClick={handleMarkAllAsRead} variant="outline">
          Mark All Read
        </Button>
      </div>

      {/* Notification Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No notifications
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === "unread"
                      ? "You're all caught up!"
                      : `No ${activeTab} notifications found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => {
                const Icon = notification.icon;
                const isRead = notification.read || markAllAsRead;

                return (
                  <Card
                    key={notification.id}
                    className={`transition-all ${isRead ? "opacity-75" : "border-l-4 border-l-primary"}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${notification.bgColor}`}
                        >
                          <Icon
                            className={`w-6 h-6 ${notification.iconColor}`}
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3
                                className={`font-semibold ${isRead ? "text-gray-600" : "text-gray-900"}`}
                              >
                                {notification.title}
                              </h3>
                              <p className="text-gray-600 mt-1">
                                {notification.description}
                              </p>
                              <p className="text-sm text-gray-400 mt-2">
                                {notification.time}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                              {!isRead && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                {notification.action}
                              </Button>
                              {!isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleMarkAsRead(notification.id)
                                  }
                                >
                                  Mark as Read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Notifications
                </p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-red-600">
                  {markAllAsRead ? 0 : 2}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Overdue Items
                </p>
                <p className="text-2xl font-bold text-yellow-600">1</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
