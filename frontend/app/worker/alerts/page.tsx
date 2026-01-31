"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RiskBadge, RiskLevel } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle, AlertTriangle } from "lucide-react";

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: RiskLevel;
  is_read: boolean;
  created_at: string;
  resolved_at: string | null;
}

export default function WorkerAlertsPage() {
  const { loading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "1",
      title: "High Noise Exposure",
      message: "Your noise exposure levels have exceeded recommended limits this week. Please ensure proper ear protection is being used.",
      severity: "high",
      is_read: false,
      created_at: new Date().toISOString(),
      resolved_at: null,
    },
    {
      id: "2",
      title: "PPE Compliance Reminder",
      message: "You reported not using all required PPE yesterday. Please ensure full compliance.",
      severity: "medium",
      is_read: false,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      resolved_at: null,
    },
    {
      id: "3",
      title: "Risk Score Increase",
      message: "Your risk score has increased by 15 points over the last 7 days.",
      severity: "medium",
      is_read: true,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      resolved_at: null,
    },
  ]);

  const markAsRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
    );
  };

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              My Alerts
            </h1>
            <p className="text-muted-foreground">
              {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>

          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alert History</CardTitle>
            <CardDescription>All safety alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 p-4 rounded-lg ${
                      alert.is_read
                        ? "bg-muted/30"
                        : "bg-muted/50 border-l-4 border-amber-500"
                    }`}
                  >
                    <AlertTriangle
                      className={`h-5 w-5 mt-1 ${
                        alert.severity === "critical"
                          ? "text-destructive"
                          : alert.severity === "high"
                          ? "text-orange-500"
                          : alert.severity === "medium"
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <RiskBadge level={alert.severity} size="sm" showIcon={false} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!alert.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Read
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-emerald-500 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Alerts</h3>
                  <p>You&apos;re all caught up! No safety alerts at this time.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
