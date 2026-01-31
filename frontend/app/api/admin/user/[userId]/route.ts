import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    // Get user with all their forms (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dailyForms: {
          where: { date: { gte: thirtyDaysAgo } },
          orderBy: { date: "asc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build time series data for each metric
    const timeSeriesData = user.dailyForms.map((form) => ({
      date: new Date(form.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      fullDate: form.date.toISOString(),
      riskScore: form.ruleBasedScore,
      fatigueLevel: form.fatigueLevel,
      ppeCompliance: Math.round(form.ppeComplianceRate * 100),
      hazardHours: form.totalHazardExposureHours,
      shiftDuration: form.shiftDuration,
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        yearsExperience: user.yearsExperience,
        jobTitle: user.jobTitle,
        department: user.department,
      },
      timeSeriesData,
      availableMetrics: [
        { key: "riskScore", label: "Risk Score", color: "#ef4444" },
        { key: "fatigueLevel", label: "Fatigue Level", color: "#f97316" },
        { key: "ppeCompliance", label: "PPE Compliance %", color: "#22c55e" },
        { key: "hazardHours", label: "Hazard Exposure (hrs)", color: "#8b5cf6" },
        { key: "shiftDuration", label: "Shift Duration (hrs)", color: "#3b82f6" },
      ],
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
  }
}
