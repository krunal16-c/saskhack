import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ML_API_URL = "https://ck1603-ohands.hf.space/predict";

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
      include: {
        dailyForms: {
          orderBy: { date: "desc" },
          take: 90,
        },
      },
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

    // Calculate historical metrics for ML features
    const now = new Date();
    const forms = user.dailyForms;

    const forms7d = forms.filter((f) => {
      const diffDays = Math.floor((now.getTime() - new Date(f.date).getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });

    const forms30d = forms.filter((f) => {
      const diffDays = Math.floor((now.getTime() - new Date(f.date).getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });

    const forms90d = forms.filter((f) => {
      const diffDays = Math.floor((now.getTime() - new Date(f.date).getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 90;
    });

    // Calculate averages from historical data (0-100 scale)
    const avgRisk7d = forms7d.length > 0
      ? forms7d.reduce((sum, f) => sum + f.riskScore, 0) / forms7d.length
      : 50; // Default baseline

    const avgRisk30d = forms30d.length > 0
      ? forms30d.reduce((sum, f) => sum + f.riskScore, 0) / forms30d.length
      : 50;

    const maxRisk7d = forms7d.length > 0
      ? Math.max(...forms7d.map((f) => f.riskScore))
      : 50;

    const totalHazardHours7d = forms7d.reduce((sum, f) => sum + f.totalHazardExposureHours, 0);
    const totalHazardHours30d = forms30d.reduce((sum, f) => sum + f.totalHazardExposureHours, 0);

    const avgPpe7d = forms7d.length > 0
      ? forms7d.reduce((sum, f) => sum + f.ppeComplianceRate, 0) / forms7d.length
      : ppeComplianceRate;

    const incidentsLast90d = forms90d.filter((f) => f.incidentReported).length;

    const lastIncidentForm = forms.find((f) => f.incidentReported);
    const daysSinceLastIncident = lastIncidentForm
      ? Math.floor((now.getTime() - new Date(lastIncidentForm.date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Calculate consecutive days worked
    let consecutiveDaysWorked = 1; // Include today
    const sortedForms = [...forms].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (let i = 0; i < sortedForms.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i - 1);
      const formDate = new Date(sortedForms[i].date).toISOString().split("T")[0];
      const expected = expectedDate.toISOString().split("T")[0];
      if (formDate === expected) {
        consecutiveDaysWorked++;
      } else {
        break;
      }
    }

    // Gender encoding: male=1, female=0, other=2
    const genderEncoded = user.gender === "male" ? 1 : user.gender === "female" ? 0 : 2;

    // Build features for ML model - matching the exact structure required
    const features = {
      shift_duration: Number(shiftDuration) || 8,
      fatigue_level: Number(fatigueLevel) || 3,
      ppe_compliance_rate: Math.round(Number(ppeComplianceRate) * 100) / 100,
      total_hazard_exposure_hours: Math.round(Number(totalHazardExposureHours) * 100) / 100,
      
      age: Number(user.age) || 30,
      years_experience: Number(user.yearsExperience) || 0,
      gender_encoded: Number(genderEncoded),
      
      consecutive_days_worked: Number(consecutiveDaysWorked),
      daily_risk_score: Math.round(Number(avgRisk7d)), // Use recent average as baseline
      avg_risk_7d: Math.round(Number(avgRisk7d)),
      avg_risk_30d: Math.round(Number(avgRisk30d)),
      max_risk_7d: Math.round(Number(maxRisk7d)),
      
      total_hazard_hours_7d: Math.round(Number(totalHazardHours7d)),
      total_hazard_hours_30d: Math.round(Number(totalHazardHours30d)),
      avg_ppe_7d: Math.round(Number(avgPpe7d) * 100) / 100,
      
      incidents_last_90d: Number(incidentsLast90d),
      days_since_last_incident: Number(daysSinceLastIncident),
    };

    // Call ML API to get risk score
    let riskScore = 50; // Default if API fails
    let mlResponse: Record<string, unknown> | null = null;
    
    try {
      console.log("=== CALLING ML API ===");
      console.log("Features:", JSON.stringify(features, null, 2));

      const response = await fetch(ML_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(features),
      });

      if (response.ok) {
        mlResponse = await response.json();
        console.log("ML Response:", JSON.stringify(mlResponse, null, 2));
        
        // Extract risk_score from response (0-100 scale)
        riskScore = Number(mlResponse?.risk_score ?? 50);
        
        console.log("Extracted Risk Score:", riskScore);
      } else {
        console.error("ML API error:", response.status, await response.text());
      }
    } catch (mlError) {
      console.error("Error calling ML API:", mlError);
    }

    // Log the features JSON
    console.log("=== FORM SUBMISSION ===");
    console.log("Features JSON:", JSON.stringify(features, null, 2));
    console.log("ML Risk Score:", riskScore);
    console.log("=======================");

    // Upsert form with ML risk score
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
        riskScore,
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
        riskScore,
        notes,
      },
    });

    return NextResponse.json({ 
      form, 
      features,
      riskScore,
      mlResponse,
      created: true 
    });
  } catch (error) {
    console.error("Error submitting form:", error);
    return NextResponse.json({ error: "Failed to submit form" }, { status: 500 });
  }
}
