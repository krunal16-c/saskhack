"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { RiskScoreGauge } from "@/components/RiskScoreGauge";
import { RiskBadge, RiskLevel } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardList,
  Shield,
  AlertTriangle,
  TrendingUp,
  Calendar,
  CheckCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface RiskScore {
  total_score: number;
  risk_level: RiskLevel;
  date: string;
}

interface DailyForm {
  id: string;
  date: string;
  submitted_at: string;
  risk_score: number;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: RiskLevel;
  is_read: boolean;
  created_at: string;
}

interface DashboardData {
  latestRisk: RiskScore;
  recentForms: DailyForm[];
  alerts: Alert[];
  todayFormSubmitted: boolean;
  consecutiveSafeDays: number;
  stats: {
    formsThisWeek: number;
    avgRisk7d: number;
    incidentsLast90d: number;
  };
}

export default function WorkerDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const latestRisk = dashboardData?.latestRisk ?? { total_score: 0, risk_level: "low" as RiskLevel, date: new Date().toISOString() };
  const recentForms = dashboardData?.recentForms ?? [];
  const alerts = dashboardData?.alerts ?? [];
  const todayFormSubmitted = dashboardData?.todayFormSubmitted ?? false;
  const consecutiveSafeDays = dashboardData?.consecutiveSafeDays ?? 0;
  const stats = dashboardData?.stats ?? { formsThisWeek: 0, avgRisk7d: 0, incidentsLast90d: 0 };

  const unreadAlerts = alerts.filter((a) => !a.is_read).length;
  const now = new Date();
  const greeting = now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening";

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Welcome header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Good {greeting}, {profile?.full_name?.split(" ")[0] || "there"}!
            </h1>
            <p className="text-muted-foreground">
              {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              title="Refresh dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </Button>

            {!todayFormSubmitted ? (
              <Button onClick={() => router.push("/worker/form")} size="lg" className="gap-2">
                <ClipboardList className="h-5 w-5" />
                Submit Daily Form
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/10 px-4 py-2 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Today&apos;s form submitted</span>
              </div>
            )}
          </div>
        </div>

        {/* Risk status card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <RiskScoreGauge score={latestRisk.total_score} size="lg" />

              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <h2 className="text-xl font-semibold">Your Current Risk Status</h2>
                  <p className="text-muted-foreground">
                    Based on your recent form submissions and exposure history
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.formsThisWeek}</p>
                    <p className="text-sm text-muted-foreground">Forms (7 days)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{unreadAlerts}</p>
                    <p className="text-sm text-muted-foreground">Unread Alerts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{todayFormSubmitted ? "Yes" : "No"}</p>
                    <p className="text-sm text-muted-foreground">Today&apos;s Form</p>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block w-px h-32 bg-border" />

              <div className="space-y-3">
                <h3 className="font-medium text-muted-foreground">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push("/worker/form")}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    {todayFormSubmitted ? "Update Form" : "Submit Form"}
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push("/worker/alerts")}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    View Alerts
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Current Risk Score"
            value={latestRisk.total_score}
            icon={Shield}
            variant={
              latestRisk.total_score <= 30
                ? "success"
                : latestRisk.total_score <= 60
                ? "warning"
                : "danger"
            }
          />
          <StatCard
            title="Avg Risk (7 days)"
            value={stats.avgRisk7d}
            subtitle="average score"
            icon={TrendingUp}
            variant={
              stats.avgRisk7d <= 30
                ? "success"
                : stats.avgRisk7d <= 60
                ? "warning"
                : "danger"
            }
          />
          <StatCard
            title="Active Alerts"
            value={unreadAlerts}
            icon={AlertTriangle}
            variant={unreadAlerts > 0 ? "warning" : "success"}
          />
          <StatCard
            title="Consecutive Safe Days"
            value={consecutiveSafeDays}
            icon={CheckCircle}
            variant="success"
          />
        </div>

        {/* Recent activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Forms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Form Submissions</CardTitle>
              <CardDescription>Your last 7 daily safety forms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentForms.length > 0 ? (
                  recentForms.map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(form.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Risk Score: {form.risk_score} • Submitted at {new Date(form.submitted_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <RiskBadge
                        level={
                          form.risk_score <= 30
                            ? "low"
                            : form.risk_score <= 60
                            ? "medium"
                            : form.risk_score <= 80
                            ? "high"
                            : "critical"
                        }
                        size="sm"
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No forms submitted yet</p>
                    <Button
                      variant="link"
                      onClick={() => router.push("/worker/form")}
                      className="mt-2"
                    >
                      Submit your first form
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Alerts</CardTitle>
              <CardDescription>Safety notifications and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        alert.is_read ? "bg-muted/30" : "bg-muted/50 border-l-2 border-amber-500"
                      }`}
                    >
                      <AlertTriangle
                        className={`h-5 w-5 mt-0.5 ${
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{alert.title}</p>
                          <RiskBadge level={alert.severity} size="sm" showIcon={false} />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50 text-emerald-500" />
                    <p>No alerts - you&apos;re all clear!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
