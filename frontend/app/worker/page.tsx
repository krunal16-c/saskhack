"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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
    const greeting = now.getHours() < 12 ? "Good Morning" : now.getHours() < 18 ? "Good Afternoon" : "Good Evening";

    return (
      <DashboardLayout>
        <div className="space-y-8 pb-10">
          {/* Hero Section with Greeting */}
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-primary-foreground md:px-10 md:py-12 shadow-xl mb-4">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-md">
                    <Calendar className="h-3 w-3" />
                    {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                    {greeting}, {profile?.full_name?.split(" ")[0] || "User"}!
                  </h1>
                  <p className="max-w-md text-primary-foreground/90 text-lg leading-relaxed">
                    {todayFormSubmitted 
                      ? "Great job! Your safety check is complete. Stay alert and stay safe."
                      : "Your safety matters. Please complete your daily safety check-in before starting work."
                    }
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {!todayFormSubmitted ? (
                    <Button 
                      onClick={() => router.push("/worker/form")} 
                      size="lg" 
                      className="bg-white text-primary hover:bg-white/90 shadow-xl group h-14 px-8 text-base font-bold"
                    >
                      <ClipboardList className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                      Complete Daily Check-in
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={() => router.push("/worker/form")} 
                      size="lg" 
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20 h-14 px-8"
                    >
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Update Check-in
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => router.push("/worker/alerts")}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 relative h-14 px-8"
                  >
                    <AlertTriangle className="mr-2 h-6 w-6" />
                    View Alerts
                    {unreadAlerts > 0 && (
                      <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-black text-white ring-4 ring-primary animate-pulse">
                        {unreadAlerts}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Background decorative elements */}
              <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-[100px]" />
              <div className="absolute -bottom-20 left-20 h-80 w-80 rounded-full bg-white/5 blur-[100px]" />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main Risk Status */}
              <Card className="lg:col-span-2 overflow-hidden border-none shadow-lg">
                <CardHeader className="pb-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold">Safety Wellness Score</CardTitle>
                      <CardDescription className="text-base">Comprehensive risk assessment overview</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => fetchDashboard(true)}
                      disabled={refreshing}
                      className="hover:bg-primary/10 rounded-full"
                    >
                      <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-8 lg:p-10">
                  <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="relative group shrink-0">
                      <RiskScoreGauge score={latestRisk.total_score} size="lg" showLabel={false} />
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap drop-shadow-md">
                        <RiskBadge level={latestRisk.risk_level} size="md" />
                      </div>
                    </div>


                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Weekly Forms</p>
                          <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold">{stats.formsThisWeek}</span>
                            <span className="text-xs text-muted-foreground mb-1">/ 7 days</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Avg Risk</p>
                          <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold">{stats.avgRisk7d}</span>
                            <TrendingUp className={cn("h-4 w-4 mb-2", stats.avgRisk7d > 50 ? "text-destructive" : "text-success")} />
                          </div>
                        </div>
                      </div>
  
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Streak Status</span>
                          <span className="text-success font-bold">{consecutiveSafeDays} Day Safe Streak</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full bg-success transition-all duration-1000" 
                            style={{ width: `${Math.min((consecutiveSafeDays / 14) * 100, 100)}%` }} 
                          />
                        </div>

                      <p className="text-xs text-muted-foreground">Keep it up! 14 days is a major milestone.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <StatCard
                title="Active Alerts"
                value={unreadAlerts}
                icon={AlertTriangle}
                variant={unreadAlerts > 0 ? "warning" : "success"}
                className="shadow-sm border-none bg-card hover:bg-muted/50 transition-colors"
              />
              <StatCard
                title="Risk History"
                value={stats.avgRisk7d}
                subtitle="Last 7 days avg"
                icon={TrendingUp}
                variant={stats.avgRisk7d < 40 ? "success" : "warning"}
                className="shadow-sm border-none bg-card hover:bg-muted/50 transition-colors"
              />
                <div className="p-6 rounded-xl bg-gradient-to-br from-primary to-info text-primary-foreground shadow-lg border border-primary/20">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-white/20">
                      <Shield className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">New</span>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-bold">Safety Guide</h4>
                    <p className="text-xs text-primary-foreground/80 mt-1">Review updated PPE requirements for Zone B.</p>
                    <Button variant="link" className="text-primary-foreground p-0 h-auto mt-2 text-xs font-bold underline">Learn more</Button>
                  </div>
                </div>

            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Timeline View for Forms */}
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Activity Timeline</CardTitle>
                    <CardDescription>Your recent safety contributions</CardDescription>
                  </div>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {recentForms.length > 0 ? (
                    recentForms.map((form, index) => (
                      <div key={form.id} className="relative flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                            <div className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-8 ring-background transition-colors group-hover:scale-110",
                              form.risk_score <= 30 ? "bg-success/10 text-success" : 
                              form.risk_score <= 60 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                            )}>
                              <CheckCircle className="h-5 w-5" />
                            </div>

                          <div>
                            <p className="font-semibold text-sm">
                              {new Date(form.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Submitted at {new Date(form.submitted_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <RiskBadge 
                            level={
                              form.risk_score <= 30 ? "low" : 
                              form.risk_score <= 60 ? "medium" : 
                              form.risk_score <= 85 ? "high" : "critical"
                            } 
                            size="sm" 
                          />
                          <p className="text-[10px] font-medium text-muted-foreground mt-1">Score: {form.risk_score}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <ClipboardList className="h-8 w-8 text-muted-foreground opacity-20" />
                      </div>
                      <p className="text-muted-foreground font-medium">No activity history yet.</p>
                      <Button variant="link" onClick={() => router.push("/worker/form")} className="mt-2">Start your first check-in</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alerts & Notifications */}
            <Card className="border-none shadow-md overflow-hidden">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Priority Notifications</CardTitle>
                    <CardDescription>Critical safety updates and news</CardDescription>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={cn(
                          "flex items-start gap-4 p-5 hover:bg-muted/30 transition-colors",
                          !alert.is_read && "bg-primary/5"
                        )}
                      >
                          <div className={cn(
                            "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            alert.severity === "critical" ? "bg-destructive/10 text-destructive" :
                            alert.severity === "high" ? "bg-warning/20 text-warning" : "bg-warning/10 text-warning"
                          )}>
                            <AlertTriangle className="h-4 w-4" />
                          </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm truncate pr-2">{alert.title}</h4>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {new Date(alert.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {alert.message}
                          </p>
                          {!alert.is_read && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">New</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 px-6">
                      <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-emerald-500 opacity-40" />
                      </div>
                      <h4 className="font-semibold">All Clear!</h4>
                      <p className="text-sm text-muted-foreground mt-1">No active alerts at this time.</p>
                    </div>
                  )}
                </div>
                {alerts.length > 0 && (
                  <div className="p-4 border-t bg-muted/20 text-center">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/worker/alerts")} className="text-xs font-semibold text-muted-foreground hover:text-primary">
                      View all notifications
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

