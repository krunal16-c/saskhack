import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get forms from last 7 days
    const recentForms = await prisma.dailyForm.findMany({
      where: {
        userId: user.id,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: "desc" },
      take: 7,
    });

    // Check if today's form was submitted
    const todayForm = recentForms.find((form) => {
      const formDate = new Date(form.date);
      return (
        formDate.getFullYear() === today.getFullYear() &&
        formDate.getMonth() === today.getMonth() &&
        formDate.getDate() === today.getDate()
      );
    });

    // Get the latest risk score
    const latestForm = recentForms[0];
    const latestRiskScore = latestForm?.ruleBasedScore ?? 0;

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    if (latestRiskScore > 70) riskLevel = "critical";
    else if (latestRiskScore > 50) riskLevel = "high";
    else if (latestRiskScore > 30) riskLevel = "medium";

    // Calculate consecutive safe days (days with risk score <= 30)
    let consecutiveSafeDays = 0;
    const allForms = await prisma.dailyForm.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 90,
    });

    for (const form of allForms) {
      if (form.ruleBasedScore <= 30) {
        consecutiveSafeDays++;
      } else {
        break;
      }
    }

    // Calculate average risk over 7 days
    const avgRisk7d =
      recentForms.length > 0
        ? recentForms.reduce((sum, f) => sum + f.ruleBasedScore, 0) / recentForms.length
        : 0;

    // Get incidents in last 90 days
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const incidentForms = await prisma.dailyForm.findMany({
      where: {
        userId: user.id,
        date: { gte: ninetyDaysAgo },
        incidentReported: true,
      },
    });

    // Build alerts from incidents and high risk days
    const alerts = [];

    // Add alerts for any incidents
    for (const form of incidentForms.slice(0, 3)) {
      alerts.push({
        id: `incident-${form.id}`,
        title: "Incident Reported",
        message: form.incidentDescription || "An incident was reported on this day.",
        severity: "high" as const,
        is_read: false,
        created_at: form.submittedAt.toISOString(),
      });
    }

    // Add alert if recent average risk is elevated
    if (avgRisk7d > 40) {
      alerts.push({
        id: "elevated-risk",
        title: "Elevated Risk Level",
        message: `Your average risk score over the past 7 days is ${Math.round(avgRisk7d)}. Consider reviewing your safety practices.`,
        severity: avgRisk7d > 60 ? ("critical" as const) : ("medium" as const),
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    // Add alert for high fatigue if recent
    const highFatigueForms = recentForms.filter((f) => f.fatigueLevel >= 7);
    if (highFatigueForms.length > 0) {
      alerts.push({
        id: "high-fatigue",
        title: "High Fatigue Detected",
        message: `You reported high fatigue levels on ${highFatigueForms.length} day(s) this week. Please ensure adequate rest.`,
        severity: "medium" as const,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    // Format forms for response
    const formattedForms = recentForms.map((form) => ({
      id: form.id,
      date: form.date.toISOString(),
      submitted_at: form.submittedAt.toISOString(),
      risk_score: form.ruleBasedScore,
    }));

    return NextResponse.json({
      latestRisk: {
        total_score: latestRiskScore,
        risk_level: riskLevel,
        date: latestForm?.date.toISOString() ?? new Date().toISOString(),
      },
      recentForms: formattedForms,
      alerts,
      todayFormSubmitted: !!todayForm,
      consecutiveSafeDays,
      stats: {
        formsThisWeek: recentForms.length,
        avgRisk7d: Math.round(avgRisk7d),
        incidentsLast90d: incidentForms.length,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
