"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { RiskBadge, RiskLevel } from "@/components/RiskBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Filter,
  FileText,
  Clock,
  Zap,
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

interface FormSubmission {
  id: string;
  date: string;
  shiftDuration: number;
  fatigueLevel: number;
  riskScore: number;
  ppeComplianceRate: number;
  ppeItemsUsed: number;
  ppeItemsRequired: number;
  totalHazardExposureHours: number;
  hazardExposures: Record<string, number>;
  symptoms: string[] | null;
  incidentReported: boolean;
  incidentDescription: string | null;
}

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
  avgPpeCompliance: number;
  hasSubmittedToday: boolean;
  totalForms: number;
  incidentsReported: number;
  riskLevel: RiskLevel;
  formSubmissions: FormSubmission[];
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

type SortField = "latestRiskScore" | "name" | "avgPpeCompliance" | "age" | "yearsExperience" | "formsThisWeek";
type SortOrder = "asc" | "desc";

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userDetailData, setUserDetailData] = useState<UserDetailData | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["riskScore", "fatigueLevel"]);
  const [showOverview, setShowOverview] = useState(false);
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [ageMinFilter, setAgeMinFilter] = useState<string>("");
  const [ageMaxFilter, setAgeMaxFilter] = useState<string>("");
  const [experienceMinFilter, setExperienceMinFilter] = useState<string>("");
  const [ppeComplianceFilter, setPpeComplianceFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("latestRiskScore");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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

  // Get unique departments for filter
  const departments = useMemo(() => {
    if (!data) return [];
    const depts = new Set(data.users.map((u) => u.department).filter(Boolean));
    return Array.from(depts) as string[];
  }, [data]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    if (!data) return [];

    let users = [...data.users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.jobTitle?.toLowerCase().includes(query) ||
          u.department?.toLowerCase().includes(query)
      );
    }

    // Risk level filter
    if (riskLevelFilter !== "all") {
      users = users.filter((u) => u.riskLevel === riskLevelFilter);
    }

    // Department filter
    if (departmentFilter !== "all") {
      users = users.filter((u) => u.department === departmentFilter);
    }

    // Age filter
    if (ageMinFilter) {
      const min = parseInt(ageMinFilter);
      users = users.filter((u) => u.age !== null && u.age >= min);
    }
    if (ageMaxFilter) {
      const max = parseInt(ageMaxFilter);
      users = users.filter((u) => u.age !== null && u.age <= max);
    }

    // Experience filter
    if (experienceMinFilter) {
      const min = parseInt(experienceMinFilter);
      users = users.filter((u) => u.yearsExperience !== null && u.yearsExperience >= min);
    }

    // PPE compliance filter
    if (ppeComplianceFilter !== "all") {
      if (ppeComplianceFilter === "high") {
        users = users.filter((u) => u.avgPpeCompliance >= 80);
      } else if (ppeComplianceFilter === "medium") {
        users = users.filter((u) => u.avgPpeCompliance >= 50 && u.avgPpeCompliance < 80);
      } else if (ppeComplianceFilter === "low") {
        users = users.filter((u) => u.avgPpeCompliance < 50);
      }
    }

    // Sort
    users.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case "latestRiskScore":
          aVal = a.latestRiskScore;
          bVal = b.latestRiskScore;
          break;
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "avgPpeCompliance":
          aVal = a.avgPpeCompliance;
          bVal = b.avgPpeCompliance;
          break;
        case "age":
          aVal = a.age ?? 0;
          bVal = b.age ?? 0;
          break;
        case "yearsExperience":
          aVal = a.yearsExperience ?? 0;
          bVal = b.yearsExperience ?? 0;
          break;
        case "formsThisWeek":
          aVal = a.formsThisWeek;
          bVal = b.formsThisWeek;
          break;
      }

      if (typeof aVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - (bVal as number) : (bVal as number) - aVal;
    });

    return users;
  }, [data, searchQuery, riskLevelFilter, departmentFilter, ageMinFilter, ageMaxFilter, experienceMinFilter, ppeComplianceFilter, sortField, sortOrder]);

  const clearFilters = () => {
    setSearchQuery("");
    setRiskLevelFilter("all");
    setDepartmentFilter("all");
    setAgeMinFilter("");
    setAgeMaxFilter("");
    setExperienceMinFilter("");
    setPpeComplianceFilter("all");
    setSortField("latestRiskScore");
    setSortOrder("desc");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
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

  const charts = data?.charts ?? {
    dailyRiskTrend: [],
    riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
    hazardData: [],
    ppeComplianceTrend: [],
    fatigueDistribution: [],
  };

    return (
      <DashboardLayout>
        <div className="space-y-8 pb-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Monitoring {metrics.totalUsers} workers across {departments.length} departments
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end px-4 py-1 border-r">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sync Status</span>
                <span className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="shadow-sm"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Active Workforce"
              value={metrics.activeUsers}
              subtitle={`${metrics.totalUsers} total registered`}
              icon={Users}
              className="border-none shadow-md bg-white dark:bg-zinc-950"
            />
            <StatCard
              title="Today's Check-ins"
              value={metrics.totalFormsToday}
              subtitle={`${metrics.totalFormsThisWeek} this week`}
              icon={ClipboardList}
              className="border-none shadow-md bg-white dark:bg-zinc-950"
            />
            <StatCard
              title="Global Risk Index"
              value={metrics.avgRiskWeek}
              subtitle="7-day rolling average"
              icon={Shield}
              variant={
                metrics.avgRiskWeek <= 30 ? "success" : 
                metrics.avgRiskWeek <= 60 ? "warning" : "danger"
              }
              className="border-none shadow-md bg-white dark:bg-zinc-950"
            />
            <StatCard
              title="Safety Incidents"
              value={metrics.incidentsThisMonth}
              subtitle="Last 30 days"
              icon={AlertTriangle}
              variant={metrics.incidentsThisMonth === 0 ? "success" : "danger"}
              className="border-none shadow-md bg-white dark:bg-zinc-950"
            />
          </div>

          {/* Advanced Analytics Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Primary Trend Chart */}
            <Card className="lg:col-span-2 border-none shadow-md overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Risk & Participation Trends</CardTitle>
                    <CardDescription>Daily average risk vs. submission volume</CardDescription>
                  </div>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.dailyRiskTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend verticalAlign="top" height={36} align="right" iconType="circle" />
                      <Area
                        type="monotone"
                        dataKey="avgRisk"
                        name="Risk Level"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        fill="url(#riskGradient)"
                      />
                      <Line
                        type="monotone"
                        dataKey="formCount"
                        name="Submissions"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Distribution & Compliance */}
            <div className="space-y-6">
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 border-b pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Compliance Health</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <p className="text-3xl font-bold">{metrics.complianceRate}%</p>
                      <p className="text-xs text-muted-foreground font-medium">Global PPE Compliance</p>
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl",
                      metrics.complianceRate >= 85 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      <HardHat className="h-8 w-8" />
                    </div>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000",
                        metrics.complianceRate >= 85 ? "bg-emerald-500" : "bg-amber-500"
                      )}
                      style={{ width: `${metrics.complianceRate}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 border-b pb-3">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {Object.entries(charts.riskDistribution).map(([level, count]) => (
                      <div key={level} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="capitalize">{level}</span>
                          <span>{count} workers</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full",
                              level === "low" ? "bg-emerald-500" :
                              level === "medium" ? "bg-amber-500" :
                              level === "high" ? "bg-orange-500" : "bg-red-500"
                            )}
                            style={{ width: `${(count / Math.max(metrics.totalUsers, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Worker Management Section */}
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-muted/20 border-b pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Workforce Directory</CardTitle>
                  <CardDescription>Real-time safety status monitoring</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search workers..." 
                      className="pl-9 w-full md:w-[250px] bg-background shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    variant={showFilters ? "secondary" : "outline"}
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                    className="shadow-sm"
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Enhanced Filters */}
              {showFilters && (
                <div className="mt-6 p-6 rounded-2xl bg-background border shadow-inner animate-in slide-in-from-top-4 duration-300">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Department</Label>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="bg-muted/30">
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Risk Severity</Label>
                      <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                        <SelectTrigger className="bg-muted/30">
                          <SelectValue placeholder="All Risks" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Severities</SelectItem>
                          <SelectItem value="critical">Critical Only</SelectItem>
                          <SelectItem value="high">High & Above</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Compliance</Label>
                      <Select value={ppeComplianceFilter} onValueChange={setPpeComplianceFilter}>
                        <SelectTrigger className="bg-muted/30">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="high">High (≥80%)</SelectItem>
                          <SelectItem value="low">Low (&lt;50%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sort By</Label>
                      <div className="flex gap-2">
                        <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                          <SelectTrigger className="bg-muted/30 flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="latestRiskScore">Risk Score</SelectItem>
                            <SelectItem value="name">Worker Name</SelectItem>
                            <SelectItem value="formsThisWeek">Activity</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        >
                          {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button variant="link" size="sm" onClick={clearFilters} className="text-muted-foreground font-semibold">
                      Reset All Filters
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-separate border-spacing-0">
                  <thead className="bg-muted/20">
                    <tr>
                      <th className="text-left py-4 px-6 font-bold text-muted-foreground border-b uppercase tracking-wider text-[10px]">Worker Profile</th>
                      <th className="text-left py-4 px-6 font-bold text-muted-foreground border-b uppercase tracking-wider text-[10px]">Job Details</th>
                      <th className="text-center py-4 px-6 font-bold text-muted-foreground border-b uppercase tracking-wider text-[10px]">Safety Score</th>
                      <th className="text-center py-4 px-6 font-bold text-muted-foreground border-b uppercase tracking-wider text-[10px]">PPE Status</th>
                      <th className="text-center py-4 px-6 font-bold text-muted-foreground border-b uppercase tracking-wider text-[10px]">Today</th>
                      <th className="text-right py-4 px-6 font-bold text-muted-foreground border-b uppercase tracking-wider text-[10px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/10">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className={cn(
                            "group hover:bg-muted/30 transition-all cursor-pointer",
                            selectedUser?.id === user.id && "bg-primary/5"
                          )}
                          onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold">{user.name}</p>
                                <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-0.5">
                              <p className="font-medium">{user.jobTitle || "—"}</p>
                              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {user.department || "General"}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="inline-flex flex-col items-center">
                              <RiskBadge level={user.riskLevel} size="sm" />
                              <span className="text-[10px] font-bold text-muted-foreground mt-1">INDEX: {user.latestRiskScore}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full",
                                    user.avgPpeCompliance >= 80 ? "bg-emerald-500" :
                                    user.avgPpeCompliance >= 50 ? "bg-amber-500" : "bg-red-500"
                                  )}
                                  style={{ width: `${user.avgPpeCompliance}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold">{user.avgPpeCompliance}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {user.hasSubmittedToday ? (
                              <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-muted-foreground/50 uppercase">Pending</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs uppercase">
                              Inspect <ChevronDown className="ml-1 h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-20 text-center text-muted-foreground italic">
                          No workers match your current selection
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* User Detail Side/Bottom Panel */}
          {selectedUser && (
            <Card className="border-none shadow-2xl bg-muted/20 animate-in slide-in-from-bottom-8 duration-500 overflow-hidden">
              <CardHeader className="bg-card border-b pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{selectedUser.name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1 font-medium">
                        <span className="flex items-center gap-1"><HardHat className="h-3.5 w-3.5" /> {selectedUser.jobTitle || "No Title"}</span>
                        <span className="flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> {selectedUser.department || "No Department"}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setSelectedUser(null)} className="rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-10 lg:grid-cols-3">
                  {/* Stats Column */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Performance Metrics
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-background shadow-sm border space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Risk Rating</p>
                        <p className="text-2xl font-black text-primary">{selectedUser.latestRiskScore}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-background shadow-sm border space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Compliance</p>
                        <p className="text-2xl font-black text-emerald-500">{selectedUser.avgPpeCompliance}%</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-background shadow-sm border space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Form Activity</p>
                        <p className="text-2xl font-black">{selectedUser.formsThisWeek}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-background shadow-sm border space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Incidents</p>
                        <p className={cn("text-2xl font-black", selectedUser.incidentsReported > 0 ? "text-destructive" : "text-muted-foreground")}>
                          {selectedUser.incidentsReported}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                      <h5 className="font-bold text-sm">Background Details</h5>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Years Experience</span>
                          <span className="font-bold">{selectedUser.yearsExperience || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Age</span>
                          <span className="font-bold">{selectedUser.age || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Worker Email</span>
                          <span className="font-bold text-primary underline truncate ml-4">{selectedUser.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trends Column */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Longitudinal Insights
                      </h4>
                      <div className="flex gap-2">
                        {userDetailData?.availableMetrics.map(m => (
                          <button
                            key={m.key}
                            onClick={() => toggleMetric(m.key)}
                            className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold transition-all border",
                              selectedMetrics.includes(m.key) 
                                ? "bg-primary text-primary-foreground border-primary" 
                                : "bg-background text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-[300px] w-full bg-background rounded-2xl border p-4 shadow-inner">
                      {loadingUserData ? (
                        <div className="h-full flex items-center justify-center">
                          <RefreshCw className="h-8 w-8 text-primary/30 animate-spin" />
                        </div>
                      ) : userDetailData && userDetailData.timeSeriesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={userDetailData.timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                            <XAxis 
                              dataKey="date" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            {userDetailData.availableMetrics
                              .filter((m) => selectedMetrics.includes(m.key))
                              .map((metric) => (
                                <Line
                                  key={metric.key}
                                  type="monotone"
                                  dataKey={metric.key}
                                  name={metric.label}
                                  stroke={metric.color}
                                  strokeWidth={3}
                                  dot={{ r: 4, strokeWidth: 2, fill: metric.color, stroke: "#fff" }}
                                  activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                              ))}
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground italic">
                          No historical data available for this worker
                        </div>
                      )}
                    </div>

                    {/* Recent Forms Scroll */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Recent Submissions</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedUser.formSubmissions.slice(0, 4).map((form) => (
                          <div 
                            key={form.id} 
                            className="p-4 rounded-xl border bg-background hover:border-primary/50 transition-colors cursor-pointer group"
                            onClick={() => setExpandedFormId(expandedFormId === form.id ? null : form.id)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-black">{formatDate(form.date)}</span>
                              <RiskBadge 
                                level={
                                  form.riskScore <= 30 ? "low" : 
                                  form.riskScore <= 60 ? "medium" : "high"
                                } 
                                size="sm" 
                              />
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                              <span className="flex items-center gap-1"><HardHat className="h-3 w-3" /> {form.ppeComplianceRate}%</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {form.shiftDuration}h</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    );
  }

