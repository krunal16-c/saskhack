import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all forms for the current user
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "90");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const forms = await prisma.dailyForm.findMany({
      where: {
        userId: user.id,
        date: { gte: startDate },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ forms });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return NextResponse.json({ error: "Failed to fetch forms" }, { status: 500 });
  }
}

// POST - Submit a new daily form
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      date,
      shiftDuration,
      fatigueLevel,
      ppeItemsRequired,
      ppeItemsUsed,
      ppeDetails,
      hazardExposures,
      symptoms,
      incidentReported,
      incidentDescription,
      notes,
    } = body;

    // Calculate PPE compliance rate
    const ppeComplianceRate = ppeItemsRequired > 0 ? ppeItemsUsed / ppeItemsRequired : 1;

    // Calculate total hazard exposure hours
    const totalHazardExposureHours = Object.values(hazardExposures as Record<string, number>).reduce(
      (sum: number, hours: number) => sum + hours,
      0
    );

    // Calculate rule-based score
    const ruleBasedScore = calculateRuleBasedScore({
      fatigueLevel,
      ppeComplianceRate,
      hazardExposures,
      totalHazardExposureHours,
      incidentReported,
      symptoms: symptoms || [],
    });

    // Upsert form (update if exists for same date, create otherwise)
    const form = await prisma.dailyForm.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: new Date(date),
        },
      },
      update: {
        shiftDuration,
        fatigueLevel,
        ppeItemsRequired,
        ppeItemsUsed,
        ppeComplianceRate,
        ppeDetails,
        hazardExposures,
        totalHazardExposureHours,
        symptoms,
        incidentReported,
        incidentDescription,
        ruleBasedScore,
        notes,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        date: new Date(date),
        shiftDuration,
        fatigueLevel,
        ppeItemsRequired,
        ppeItemsUsed,
        ppeComplianceRate,
        ppeDetails,
        hazardExposures,
        totalHazardExposureHours,
        symptoms,
        incidentReported,
        incidentDescription,
        ruleBasedScore,
        notes,
      },
    });

    return NextResponse.json({ form, created: true });
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json({ error: "Failed to submit form" }, { status: 500 });
  }
}

// Helper function to calculate rule-based risk score
function calculateRuleBasedScore(data: {
  fatigueLevel: number;
  ppeComplianceRate: number;
  hazardExposures: Record<string, number>;
  totalHazardExposureHours: number;
  incidentReported: boolean;
  symptoms: string[];
}): number {
  let score = 0;

  // Hazard base risks
  const hazardRisks: Record<string, number> = {
    noise: 15,
    dust: 12,
    chemicals: 20,
    heights: 25,
    electrical: 22,
    confined: 18,
  };

  // Hazard exposure contribution (normalized by 8-hour shift)
  for (const [hazard, hours] of Object.entries(data.hazardExposures)) {
    const baseRisk = hazardRisks[hazard] || 10;
    score += baseRisk * (hours / 8);
  }

  // PPE reduction (up to 18 points reduction for full compliance)
  const ppeReduction = data.ppeComplianceRate * 18;
  score = Math.max(0, score - ppeReduction);

  // Fatigue contribution (0-45 points based on 1-10 scale)
  score += (data.fatigueLevel - 1) * 5;

  // Symptoms contribution (4 points each)
  score += data.symptoms.length * 4;

  // Incident adds significant risk
  if (data.incidentReported) {
    score += 20;
  }

  return Math.min(100, Math.round(score));
}
