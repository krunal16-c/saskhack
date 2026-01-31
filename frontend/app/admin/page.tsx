"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { RiskBadge, RiskLevel } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Users,
  Shield,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  CheckCircle,
  RefreshCw,
  Activity,
  HardHat,
  X,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface UserData {
  id: string;
  name: string;
  email: string;
  age: number | null;
  gender: string | null;
  yearsExperience: number | null;
  jobTitle: string | null;
  department: string | null;
  formsThisWeek: number;
  avgRisk7d: number;
  latestRiskScore: number;
  hasSubmittedToday: boolean;
  totalForms: number;
  incidentsReported: number;
  riskLevel: RiskLevel;
}

interface AdminDashboardData {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalFormsToday: number;
    totalFormsThisWeek: number;
    avgRiskToday: number;
    avgRiskWeek: number;
    highRiskUsers: number;
    incidentsThisMonth: number;
    complianceRate: number;
  };
  users: UserData[];
  charts: {
    dailyRiskTrend: { date: string; avgRisk: number; formCount: number }[];
    riskDistribution: { low: number; medium: number; high: number; critical: number };
    hazardData: { name: string; count: number }[];
    ppeComplianceTrend: { date: string; compliance: number }[];
    fatigueDistribution: { level: number; count: number }[];
  };
}

interface UserTimeSeriesData {
  date: string;
  riskScore: number;
  fatigueLevel: number;
  ppeCompliance: number;
  hazardHours: number;
  shiftDuration: number;
}

interface MetricOption {
  key: string;
  label: string;
  color: string;
}

interface UserDetailData {
  user: {
    id: string;
    name: string;
  };
  timeSeriesData: UserTimeSeriesData[];
  availableMetrics: MetricOption[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userDetailData, setUserDetailData] = useState<UserDetailData | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["riskScore", "fatigueLevel"]);
  const [showOverview, setShowOverview] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);

    try {
      const response = await fetch("/api/admin/dashboard");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchUserData = useCallback(async (userId: string) => {
    setLoadingUserData(true);
    try {
      const response = await fetch(`/api/admin/user/${userId}`);
      if (response.ok) {
        const result = await response.json();
        setUserDetailData(result);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoadingUserData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserData(selectedUser.id);
    } else {
      setUserDetailData(null);
    }
  }, [selectedUser, fetchUserData]);

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricKey)
        ? prev.filter((m) => m !== metricKey)
        : [...prev, metricKey]
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const metrics = data?.metrics ?? {
    totalUsers: 0,
    activeUsers: 0,
    totalFormsToday: 0,
    totalFormsThisWeek: 0,
    avgRiskToday: 0,
    avgRiskWeek: 0,
    highRiskUsers: 0,
    incidentsThisMonth: 0,
    complianceRate: 0,
  };

  const users = data?.users ?? [];
  const charts = data?.charts ?? {
    dailyRiskTrend: [],
    riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
    hazardData: [],
    ppeComplianceTrend: [],
    fatigueDistribution: [],
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of all workers and safety metrics
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Workers"
            value={metrics.totalUsers}
            subtitle={`${metrics.activeUsers} active this week`}
            icon={Users}
          />
          <StatCard
            title="Forms Today"
            value={metrics.totalFormsToday}
            subtitle={`${metrics.totalFormsThisWeek} this week`}
            icon={ClipboardList}
          />
          <StatCard
            title="Avg Risk Score"
            value={metrics.avgRiskWeek}
            subtitle="7-day average"
            icon={Shield}
            variant={
              metrics.avgRiskWeek <= 30
                ? "success"
                : metrics.avgRiskWeek <= 60
                ? "warning"
                : "danger"
            }
          />
          <StatCard
            title="High Risk Workers"
            value={metrics.highRiskUsers}
            icon={AlertTriangle}
            variant={metrics.highRiskUsers > 0 ? "danger" : "success"}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="PPE Compliance"
            value={`${metrics.complianceRate}%`}
            icon={HardHat}
            variant={metrics.complianceRate >= 80 ? "success" : metrics.complianceRate >= 60 ? "warning" : "danger"}
          />
          <StatCard
            title="Incidents (30 days)"
            value={metrics.incidentsThisMonth}
            icon={AlertTriangle}
            variant={metrics.incidentsThisMonth === 0 ? "success" : "warning"}
          />
          <StatCard
            title="Today's Avg Risk"
            value={metrics.avgRiskToday}
            icon={Activity}
            variant={
              metrics.avgRiskToday <= 30
                ? "success"
                : metrics.avgRiskToday <= 60
                ? "warning"
                : "danger"
            }
          />
        </div>

        {/* Overview Charts Toggle */}
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setShowOverview(!showOverview)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Overview Charts</h3>
                  <p className="text-sm text-muted-foreground">
                    View aggregated metrics and trends across all workers
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                {showOverview ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section - Collapsible */}
        {showOverview && (
          <div className="space-y-6 animate-in slide-in-from-top duration-300">
            {/* Charts Row 1 */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Daily Risk Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Risk Score Trend (7 Days)
                  </CardTitle>
                  <CardDescription>Average daily risk score across all workers (0-100)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={charts.dailyRiskTrend}>
                        <defs>
                          <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis domain={[0, 100]} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="avgRisk"
                          name="Avg Risk"
                          stroke="hsl(var(--primary))"
                          fill="url(#riskGradient)"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="formCount"
                          name="Forms Submitted"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{ fill: "#8b5cf6" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* PPE Compliance Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HardHat className="h-5 w-5" />
                    PPE Compliance Trend (7 Days)
                  </CardTitle>
                  <CardDescription>Daily PPE compliance rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={charts.ppeComplianceTrend}>
                        <defs>
                          <linearGradient id="ppeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis domain={[0, 100]} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value}%`, "Compliance"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="compliance"
                          name="Compliance %"
                          stroke="#22c55e"
                          fill="url(#ppeGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fatigue Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Fatigue Level Distribution (7 Days)
                </CardTitle>
                <CardDescription>Distribution of reported fatigue levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.fatigueDistribution}>
                      <defs>
                        <linearGradient id="fatigueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="level" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Workers"
                        stroke="#8b5cf6"
                        fill="url(#fatigueGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Workers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Workers
            </CardTitle>
            <CardDescription>
              Click on a worker to view their detailed metrics • Sorted by risk score (highest first)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Name</th>
                    <th className="text-left py-3 px-2 font-medium">Department</th>
                    <th className="text-center py-3 px-2 font-medium">Risk Level</th>
                    <th className="text-center py-3 px-2 font-medium">Risk Score</th>
                    <th className="text-center py-3 px-2 font-medium">Forms (7d)</th>
                    <th className="text-center py-3 px-2 font-medium">Today</th>
                    <th className="text-center py-3 px-2 font-medium">Incidents</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                          selectedUser?.id === user.id ? "bg-primary/10" : ""
                        }`}
                        onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                      >
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p>{user.jobTitle || "—"}</p>
                            <p className="text-xs text-muted-foreground">{user.department || "—"}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <RiskBadge level={user.riskLevel} size="sm" />
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="font-semibold text-primary">
                            {user.latestRiskScore}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">{user.formsThisWeek}</td>
                        <td className="py-3 px-2 text-center">
                          {user.hasSubmittedToday ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {user.incidentsReported > 0 ? (
                            <span className="text-destructive font-medium">{user.incidentsReported}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No workers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Selected User Details with Charts */}
            {selectedUser && (
              <div className="mt-6 p-4 rounded-lg bg-muted/30 border animate-in slide-in-from-top duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">Worker Details: {selectedUser.name}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedUser(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* User Info Grid */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{selectedUser.age || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{selectedUser.gender || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-medium">
                      {selectedUser.yearsExperience !== null ? `${selectedUser.yearsExperience} years` : "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Latest Risk Score</p>
                    <p className="font-medium text-primary text-lg">{selectedUser.latestRiskScore}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Risk (7d)</p>
                    <p className="font-medium">{selectedUser.avgRisk7d}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Forms</p>
                    <p className="font-medium">{selectedUser.totalForms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Incidents</p>
                    <p className="font-medium">{selectedUser.incidentsReported}</p>
                  </div>
                </div>

                {/* Metric Selector */}
                {userDetailData && (
                  <>
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">Select Metrics to Display:</Label>
                      <div className="flex flex-wrap gap-4">
                        {userDetailData.availableMetrics.map((metric) => (
                          <div key={metric.key} className="flex items-center gap-2">
                            <Checkbox
                              id={metric.key}
                              checked={selectedMetrics.includes(metric.key)}
                              onCheckedChange={() => toggleMetric(metric.key)}
                            />
                            <Label
                              htmlFor={metric.key}
                              className="text-sm cursor-pointer flex items-center gap-2"
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: metric.color }}
                              />
                              {metric.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* User Time Series Chart */}
                    {loadingUserData ? (
                      <div className="flex items-center justify-center h-[300px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : userDetailData.timeSeriesData.length > 0 ? (
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={userDetailData.timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            {userDetailData.availableMetrics
                              .filter((m) => selectedMetrics.includes(m.key))
                              .map((metric) => (
                                <Line
                                  key={metric.key}
                                  type="monotone"
                                  dataKey={metric.key}
                                  name={metric.label}
                                  stroke={metric.color}
                                  strokeWidth={2}
                                  dot={{ fill: metric.color, r: 4 }}
                                  activeDot={{ r: 6 }}
                                />
                              ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                        No form data available for this user
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
