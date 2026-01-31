import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users with their forms
    const users = await prisma.user.findMany({
      include: {
        dailyForms: {
          orderBy: { date: "desc" },
          take: 30, // Last 30 forms per user
        },
      },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all forms for metrics
    const allForms = await prisma.dailyForm.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: "desc" },
    });

    const formsLast7Days = allForms.filter((f) => new Date(f.date) >= sevenDaysAgo);

    // Calculate overall metrics
    const totalUsers = users.length;
    const activeUsers = users.filter((u) =>
      u.dailyForms.some((f) => new Date(f.date) >= sevenDaysAgo)
    ).length;

    const totalFormsToday = allForms.filter((f) => {
      const formDate = new Date(f.date);
      return (
        formDate.getFullYear() === today.getFullYear() &&
        formDate.getMonth() === today.getMonth() &&
        formDate.getDate() === today.getDate()
      );
    }).length;

    const totalFormsThisWeek = formsLast7Days.length;

    // Average risk scores (from ML model, 0-1 scale)
    const avgRiskToday =
      totalFormsToday > 0
        ? allForms
            .filter((f) => {
              const formDate = new Date(f.date);
              return (
                formDate.getFullYear() === today.getFullYear() &&
                formDate.getMonth() === today.getMonth() &&
                formDate.getDate() === today.getDate()
              );
            })
            .reduce((sum, f) => sum + f.riskScore, 0) / totalFormsToday
        : 0;

    const avgRiskWeek =
      formsLast7Days.length > 0
        ? formsLast7Days.reduce((sum, f) => sum + f.riskScore, 0) / formsLast7Days.length
        : 0;

    // High risk users (avg risk > 50 in last 7 days)
    const highRiskUsers = users.filter((u) => {
      const recentForms = u.dailyForms.filter((f) => new Date(f.date) >= sevenDaysAgo);
      if (recentForms.length === 0) return false;
      const avgRisk = recentForms.reduce((sum, f) => sum + f.riskScore, 0) / recentForms.length;
      return avgRisk > 50;
    }).length;

    // Incidents this month
    const incidentsThisMonth = allForms.filter((f) => f.incidentReported).length;

    // Daily risk trend (last 7 days)
    const dailyRiskTrend: { date: string; avgRisk: number; formCount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayForms = allForms.filter((f) => {
        const formDate = new Date(f.date);
        return formDate.toISOString().split("T")[0] === dateStr;
      });
      dailyRiskTrend.push({
        date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        avgRisk: dayForms.length > 0 ? Math.round(dayForms.reduce((sum, f) => sum + f.riskScore, 0) / dayForms.length) : 0,
        formCount: dayForms.length,
      });
    }

    // Risk distribution (using 0-100 scale thresholds)
    const riskDistribution = {
      low: allForms.filter((f) => f.riskScore <= 30).length,
      medium: allForms.filter((f) => f.riskScore > 30 && f.riskScore <= 60).length,
      high: allForms.filter((f) => f.riskScore > 60 && f.riskScore <= 80).length,
      critical: allForms.filter((f) => f.riskScore > 80).length,
    };

    // Hazard frequency
    const hazardFrequency: Record<string, number> = {};
    allForms.forEach((form) => {
      const hazards = form.hazardExposures as Record<string, number>;
      if (hazards) {
        Object.keys(hazards).forEach((hazard) => {
          hazardFrequency[hazard] = (hazardFrequency[hazard] || 0) + 1;
        });
      }
    });

    const hazardData = Object.entries(hazardFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // PPE compliance trend
    const ppeComplianceTrend: { date: string; compliance: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayForms = allForms.filter((f) => {
        const formDate = new Date(f.date);
        return formDate.toISOString().split("T")[0] === dateStr;
      });
      ppeComplianceTrend.push({
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        compliance:
          dayForms.length > 0
            ? Math.round((dayForms.reduce((sum, f) => sum + f.ppeComplianceRate, 0) / dayForms.length) * 100)
            : 0,
      });
    }

    // Format users for response
    const formattedUsers = users.map((user) => {
      const recentForms = user.dailyForms.filter((f) => new Date(f.date) >= sevenDaysAgo);
      const avgRisk =
        recentForms.length > 0
          ? recentForms.reduce((sum, f) => sum + f.riskScore, 0) / recentForms.length
          : 0;
      const latestForm = user.dailyForms[0];
      const hasSubmittedToday = latestForm
        ? new Date(latestForm.date).toISOString().split("T")[0] === today.toISOString().split("T")[0]
        : false;

      const latestRiskScore = latestForm?.riskScore ?? 0;

      return {
        id: user.id,
        clerkId: user.clerkId,
        name: user.name || "Unknown",
        email: user.email,
        age: user.age,
        gender: user.gender,
        yearsExperience: user.yearsExperience,
        jobType: user.jobType,
        jobTitle: user.jobTitle,
        department: user.department,
        formsThisWeek: recentForms.length,
        avgRisk7d: Math.round(avgRisk),
        latestRiskScore: Math.round(latestRiskScore),
        hasSubmittedToday,
        totalForms: user.dailyForms.length,
        incidentsReported: user.dailyForms.filter((f) => f.incidentReported).length,
        riskLevel:
          latestRiskScore <= 30 ? "low" : latestRiskScore <= 60 ? "medium" : latestRiskScore <= 80 ? "high" : "critical",
      };
    });

    // Sort users by risk score (highest first)
    formattedUsers.sort((a, b) => b.latestRiskScore - a.latestRiskScore);

    // Fatigue distribution
    const fatigueDistribution = Array.from({ length: 10 }, (_, i) => ({
      level: i + 1,
      count: formsLast7Days.filter((f) => f.fatigueLevel === i + 1).length,
    }));

    return NextResponse.json({
      metrics: {
        totalUsers,
        activeUsers,
        totalFormsToday,
        totalFormsThisWeek,
        avgRiskToday: Math.round(avgRiskToday),
        avgRiskWeek: Math.round(avgRiskWeek),
        highRiskUsers,
        incidentsThisMonth,
        complianceRate:
          formsLast7Days.length > 0
            ? Math.round(
                (formsLast7Days.reduce((sum, f) => sum + f.ppeComplianceRate, 0) / formsLast7Days.length) * 100
              )
            : 0,
      },
      users: formattedUsers,
      charts: {
        dailyRiskTrend,
        riskDistribution,
        hazardData,
        ppeComplianceTrend,
        fatigueDistribution,
      },
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch admin dashboard" }, { status: 500 });
  }
}
