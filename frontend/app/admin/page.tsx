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
  Mail,
  Loader2,
  Ban,
  FileWarning,
  MessageCircle,
  Send,
  User,
  Bot,
  UserPlus,
  Plus,
  Settings2,
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

interface TeamInfo {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  members: { id: string; name: string | null; email: string }[];
  createdAt: string;
}

interface UserOption {
  id: string;
  name: string | null;
  email: string;
  jobTitle: string | null;
  department: string | null;
}

export default function AdminDashboard() {
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [createTeamName, setCreateTeamName] = useState("");
  const [createTeamDescription, setCreateTeamDescription] = useState("");
  const [createTeamLoading, setCreateTeamLoading] = useState(false);
  const [createTeamError, setCreateTeamError] = useState<string | null>(null);
  const [manageTeamOpen, setManageTeamOpen] = useState(false);
  const [teamDetail, setTeamDetail] = useState<{ team: TeamInfo } | null>(null);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [manageTeamLoading, setManageTeamLoading] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState<string>("");
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
  const [notifyLoading, setNotifyLoading] = useState<string | null>(null);
  const [notifyMessage, setNotifyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const sendChatMessage = useCallback(async () => {
    if (!selectedUser || !chatInput.trim() || chatLoading) return;
    const userMessage = chatInput.trim();
    setChatInput("");
    const newHistory = [...chatMessages, { role: "user" as const, content: userMessage }];
    setChatMessages(newHistory);
    setChatLoading(true);
    try {
      const response = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          message: userMessage,
          messages: chatMessages,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${result.error || "Failed to get response."}` }]);
        return;
      }
      setChatMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Failed to send message." }]);
    } finally {
      setChatLoading(false);
    }
  }, [selectedUser, chatInput, chatLoading, chatMessages]);

  const sendNotifyEmail = useCallback(async (userId: string, type: "no_form" | "high_risk") => {
    const key = `${userId}-${type}`;
    setNotifyMessage(null);
    setNotifyLoading(key);
    try {
      const response = await fetch("/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, userIds: [userId] }),
      });
      const result = await response.json();
      if (!response.ok) {
        setNotifyMessage({ type: "error", text: result.error || "Failed to send email." });
        return;
      }
      setNotifyMessage({ type: "success", text: result.message || "Email sent." });
    } catch (err) {
      setNotifyMessage({ type: "error", text: "Failed to send notification." });
    } finally {
      setNotifyLoading(null);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    setTeamsLoading(true);
    try {
      const response = await fetch("/api/admin/teams");
      if (response.ok) {
        const result = await response.json();
        setTeams(result.teams ?? []);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (!selectedTeamId) {
      setData(null);
      setLoading(false);
      return;
    }
    if (showRefresh) setRefreshing(true);
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/dashboard?teamId=${encodeURIComponent(selectedTeamId)}`);
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
  }, [selectedTeamId]);

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
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (selectedTeamId) {
      fetchData();
    } else {
      setData(null);
      setLoading(false);
    }
  }, [selectedTeamId, fetchData]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserData(selectedUser.id);
    } else {
      setUserDetailData(null);
    }
  }, [selectedUser, fetchUserData]);

  const createTeam = useCallback(async () => {
    const name = createTeamName.trim();
    if (!name) {
      setCreateTeamError("Team name is required.");
      return;
    }
    setCreateTeamError(null);
    setCreateTeamLoading(true);
    try {
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: createTeamDescription.trim() || null }),
      });
      const result = await response.json();
      if (!response.ok) {
        setCreateTeamError(result.error || "Failed to create team.");
        return;
      }
      setCreateTeamOpen(false);
      setCreateTeamName("");
      setCreateTeamDescription("");
      await fetchTeams();
      if (result.team?.id) setSelectedTeamId(result.team.id);
    } catch (err) {
      setCreateTeamError("Failed to create team.");
    } finally {
      setCreateTeamLoading(false);
    }
  }, [createTeamName, createTeamDescription, fetchTeams]);

  const openManageTeam = useCallback(async () => {
    if (!selectedTeamId) return;
    setManageTeamOpen(true);
    setManageTeamLoading(true);
    setTeamDetail(null);
    setAllUsers([]);
    setAddMemberUserId("");
    try {
      const [teamRes, usersRes] = await Promise.all([
        fetch(`/api/admin/teams/${selectedTeamId}`),
        fetch("/api/admin/users"),
      ]);
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamDetail(teamData);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAllUsers(usersData.users ?? []);
      }
    } catch (err) {
      console.error("Error loading manage team:", err);
    } finally {
      setManageTeamLoading(false);
    }
  }, [selectedTeamId]);

  const addMemberToTeam = useCallback(async () => {
    if (!selectedTeamId || !addMemberUserId) return;
    try {
      const response = await fetch(`/api/admin/teams/${selectedTeamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: addMemberUserId }),
      });
      if (!response.ok) return;
      setAddMemberUserId("");
      const teamRes = await fetch(`/api/admin/teams/${selectedTeamId}`);
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamDetail(teamData);
      }
      fetchData(true);
      fetchTeams();
    } catch (err) {
      console.error("Error adding member:", err);
    }
  }, [selectedTeamId, addMemberUserId, fetchData, fetchTeams]);

  const removeMemberFromTeam = useCallback(
    async (userId: string) => {
      if (!selectedTeamId) return;
      try {
        const response = await fetch(`/api/admin/teams/${selectedTeamId}/members/${userId}`, {
          method: "DELETE",
        });
        if (!response.ok) return;
        const teamRes = await fetch(`/api/admin/teams/${selectedTeamId}`);
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeamDetail(teamData);
        }
        fetchData(true);
        fetchTeams();
      } catch (err) {
        console.error("Error removing member:", err);
      }
    },
    [selectedTeamId, fetchData, fetchTeams]
  );

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

  if (teamsLoading) {
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
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Team-based safety analytics and worker overview
            </p>
          </div>
          {selectedTeamId && (
            <Button
              variant="outline"
              onClick={() => fetchData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>

        {/* Team Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team
            </CardTitle>
            <CardDescription>
              Select a team to view analytics, or create and manage teams
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <div className="min-w-[200px]">
              <Select
                value={selectedTeamId ?? ""}
                onValueChange={(v) => {
                  setSelectedTeamId(v || null);
                  setSelectedUser(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.memberCount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setCreateTeamError(null); setCreateTeamOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create team
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedTeamId}
              onClick={openManageTeam}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Manage team
            </Button>
          </CardContent>
        </Card>

        {!selectedTeamId && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Select a team above to view analytics, metrics, and workers.
            </CardContent>
          </Card>
        )}

        {selectedTeamId && loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {selectedTeamId && !loading && (
          <>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Workers ({filteredUsers.length})
                </CardTitle>
                <CardDescription>
                  Click on a worker to view details and form submissions
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </Button>
            </div>

            {/* Filters Section */}
            {showFilters && (
              <div className="mt-4 p-4 rounded-lg bg-muted/30 border animate-in slide-in-from-top duration-200">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <Input
                      placeholder="Name, email, job title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Risk Level Filter */}
                  <div className="space-y-2">
                    <Label>Risk Level</Label>
                    <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Department Filter */}
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* PPE Compliance Filter */}
                  <div className="space-y-2">
                    <Label>PPE Compliance</Label>
                    <Select value={ppeComplianceFilter} onValueChange={setPpeComplianceFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="high">High (≥80%)</SelectItem>
                        <SelectItem value="medium">Medium (50-79%)</SelectItem>
                        <SelectItem value="low">Low (&lt;50%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Age Range */}
                  <div className="space-y-2">
                    <Label>Age Range</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={ageMinFilter}
                        onChange={(e) => setAgeMinFilter(e.target.value)}
                        className="w-20"
                      />
                      <span className="self-center">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={ageMaxFilter}
                        onChange={(e) => setAgeMaxFilter(e.target.value)}
                        className="w-20"
                      />
                    </div>
                  </div>

                  {/* Experience Min */}
                  <div className="space-y-2">
                    <Label>Min Experience (years)</Label>
                    <Input
                      type="number"
                      placeholder="Min years"
                      value={experienceMinFilter}
                      onChange={(e) => setExperienceMinFilter(e.target.value)}
                    />
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latestRiskScore">Risk Score</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="avgPpeCompliance">PPE Compliance</SelectItem>
                        <SelectItem value="age">Age</SelectItem>
                        <SelectItem value="yearsExperience">Experience</SelectItem>
                        <SelectItem value="formsThisWeek">Forms This Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-2">
                    <Label>Order</Label>
                    <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">High to Low</SelectItem>
                        <SelectItem value="asc">Low to High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Name</th>
                    <th className="text-left py-3 px-2 font-medium">Department</th>
                    <th className="text-center py-3 px-2 font-medium">Risk</th>
                    <th className="text-center py-3 px-2 font-medium">PPE</th>
                    <th className="text-center py-3 px-2 font-medium">Forms (7d)</th>
                    <th className="text-center py-3 px-2 font-medium">Today</th>
                    <th className="text-center py-3 px-2 font-medium">Incidents</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                          selectedUser?.id === user.id ? "bg-primary/10" : ""
                        }`}
                        onClick={() => {
                          setSelectedUser(selectedUser?.id === user.id ? null : user);
                          setNotifyMessage(null);
                          setChatMessages([]);
                          setChatInput("");
                        }}
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
                          <div className="flex flex-col items-center gap-1">
                            <RiskBadge level={user.riskLevel} size="sm" />
                            <span className="text-xs text-muted-foreground">{user.latestRiskScore}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`font-medium ${
                            user.avgPpeCompliance >= 80 ? "text-emerald-500" :
                            user.avgPpeCompliance >= 50 ? "text-amber-500" : "text-red-500"
                          }`}>
                            {user.avgPpeCompliance}%
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
                        No workers found matching filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Selected User Details with Charts and Forms */}
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

                {/* Send notification email to this worker */}
                <div className="mb-6">
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Send notification email
                  </h5>
                  {notifyMessage && (
                    <div
                      className={`mb-3 p-2 rounded text-sm ${
                        notifyMessage.type === "success"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 border border-red-500/20"
                      }`}
                    >
                      {notifyMessage.text}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={!!notifyLoading}
                      onClick={() => sendNotifyEmail(selectedUser.id, "no_form")}
                    >
                      {notifyLoading === `${selectedUser.id}-no_form` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileWarning className="h-3.5 w-3.5" />
                      )}
                      No Form Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                      disabled={!!notifyLoading}
                      onClick={() => sendNotifyEmail(selectedUser.id, "high_risk")}
                    >
                      {notifyLoading === `${selectedUser.id}-high_risk` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Ban className="h-3.5 w-3.5" />
                      )}
                      Do Not Come to Work (High Risk)
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sends an email to {selectedUser.email}
                  </p>
                </div>

                {/* Ask about this worker (OpenAI chat) */}
                <div className="mb-6">
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Ask about this worker
                  </h5>
                  <p className="text-xs text-muted-foreground mb-2">
                    Questions are answered using this worker&apos;s profile and form data from the database.
                  </p>
                  <div className="rounded-lg border bg-background">
                    <div className="h-48 overflow-y-auto p-3 space-y-3">
                      {chatMessages.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          Ask a question about {selectedUser.name}, e.g. &quot;What is their average risk this week?&quot; or &quot;Has they reported any incidents?&quot;
                        </p>
                      ) : (
                        chatMessages.map((m, i) => (
                          <div
                            key={i}
                            className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {m.role === "assistant" && (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Bot className="h-3.5 w-3.5 text-primary" />
                              </div>
                            )}
                            <div
                              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                                m.role === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              {m.content}
                            </div>
                            {m.role === "user" && (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                      {chatLoading && (
                        <div className="flex gap-2 justify-start">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Bot className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="rounded-lg px-3 py-2 text-sm bg-muted">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 p-2 border-t">
                      <Input
                        placeholder="Ask about this worker..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendChatMessage();
                          }
                        }}
                        disabled={chatLoading}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        onClick={sendChatMessage}
                        disabled={!chatInput.trim() || chatLoading}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
                    <p className="text-sm text-muted-foreground">PPE Compliance</p>
                    <p className={`font-medium ${
                      selectedUser.avgPpeCompliance >= 80 ? "text-emerald-500" :
                      selectedUser.avgPpeCompliance >= 50 ? "text-amber-500" : "text-red-500"
                    }`}>
                      {selectedUser.avgPpeCompliance}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Forms</p>
                    <p className="font-medium">{selectedUser.totalForms}</p>
                  </div>
                </div>

                {/* Form Submissions List */}
                <div className="mb-6">
                  <h5 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Recent Form Submissions
                  </h5>
                  {selectedUser.formSubmissions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.formSubmissions.map((form) => (
                        <div key={form.id} className="rounded-lg border bg-background">
                          <div
                            className="p-3 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                            onClick={() => setExpandedFormId(expandedFormId === form.id ? null : form.id)}
                          >
                            <div className="flex items-center gap-4">
                              <span className="font-medium">{formatDate(form.date)}</span>
                              <RiskBadge 
                                level={
                                  form.riskScore <= 30 ? "low" : 
                                  form.riskScore <= 60 ? "medium" : 
                                  form.riskScore <= 80 ? "high" : "critical"
                                } 
                                size="sm" 
                              />
                              <span className="text-sm text-muted-foreground">
                                Risk: {form.riskScore}
                              </span>
                              <span className={`text-sm ${
                                form.ppeComplianceRate >= 80 ? "text-emerald-500" :
                                form.ppeComplianceRate >= 50 ? "text-amber-500" : "text-red-500"
                              }`}>
                                PPE: {form.ppeComplianceRate}%
                              </span>
                              {form.incidentReported && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                  Incident
                                </span>
                              )}
                            </div>
                            {expandedFormId === form.id ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          
                          {/* Expanded Form Details */}
                          {expandedFormId === form.id && (
                            <div className="px-3 pb-3 pt-0 border-t animate-in slide-in-from-top duration-200">
                              <div className="grid gap-4 md:grid-cols-3 mt-3 text-sm">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Shift Duration:</span>
                                    <span className="font-medium">{form.shiftDuration} hours</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Fatigue Level:</span>
                                    <span className="font-medium">{form.fatigueLevel}/10</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Hazard Hours:</span>
                                    <span className="font-medium">{form.totalHazardExposureHours.toFixed(1)}h</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <HardHat className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">PPE Used:</span>
                                    <span className="font-medium">{form.ppeItemsUsed}/{form.ppeItemsRequired}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Hazards:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {Object.entries(form.hazardExposures).map(([hazard, hours]) => (
                                        <span 
                                          key={hazard} 
                                          className="text-xs bg-muted px-2 py-0.5 rounded"
                                        >
                                          {hazard} ({hours}h)
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {form.symptoms && (form.symptoms as string[]).length > 0 && (
                                    <div>
                                      <span className="text-muted-foreground">Symptoms:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {(form.symptoms as string[]).map((symptom) => (
                                          <span 
                                            key={symptom} 
                                            className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded"
                                          >
                                            {symptom}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {form.incidentReported && form.incidentDescription && (
                                    <div>
                                      <span className="text-muted-foreground">Incident:</span>
                                      <p className="text-xs mt-1 p-2 bg-red-50 text-red-700 rounded">
                                        {form.incidentDescription}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No form submissions yet</p>
                  )}
                </div>

                {/* Metric Selector for Charts */}
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
          </>
        )}
      </div>

      {/* Create Team Modal */}
      {createTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !createTeamLoading && setCreateTeamOpen(false)}>
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Create team</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCreateTeamOpen(false)} disabled={createTeamLoading}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {createTeamError && (
                <p className="text-sm text-destructive">{createTeamError}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="team-name">Team name</Label>
                <Input
                  id="team-name"
                  value={createTeamName}
                  onChange={(e) => setCreateTeamName(e.target.value)}
                  placeholder="e.g. Field Crew A"
                  disabled={createTeamLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-desc">Description (optional)</Label>
                <Input
                  id="team-desc"
                  value={createTeamDescription}
                  onChange={(e) => setCreateTeamDescription(e.target.value)}
                  placeholder="Brief description"
                  disabled={createTeamLoading}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateTeamOpen(false)} disabled={createTeamLoading}>
                  Cancel
                </Button>
                <Button onClick={createTeam} disabled={createTeamLoading}>
                  {createTeamLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manage Team Modal */}
      {manageTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setManageTeamOpen(false)}>
          <Card className="w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manage team</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setManageTeamOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-auto">
              {manageTeamLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {teamDetail?.team && (
                    <>
                      <div>
                        <p className="text-sm font-medium">{teamDetail.team.name}</p>
                        {teamDetail.team.description && (
                          <p className="text-sm text-muted-foreground">{teamDetail.team.description}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Add member</Label>
                        <div className="flex gap-2">
                          <Select value={addMemberUserId} onValueChange={setAddMemberUserId}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                              {allUsers
                                .filter((u) => !teamDetail.team.members.some((m) => m.id === u.id))
                                .map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.name || u.email} {u.department ? `(${u.department})` : ""}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={addMemberToTeam} disabled={!addMemberUserId} size="sm">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Members ({teamDetail.team.members.length})</Label>
                        <ul className="border rounded-lg divide-y">
                          {teamDetail.team.members.length === 0 ? (
                            <li className="px-3 py-4 text-sm text-muted-foreground text-center">
                              No members. Add users above.
                            </li>
                          ) : (
                            teamDetail.team.members.map((m) => (
                              <li key={m.id} className="px-3 py-2 flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{m.name || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">{m.email}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => removeMemberFromTeam(m.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
