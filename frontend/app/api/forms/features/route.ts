import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Calculate features for ML model
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
          take: 90, // Last 90 days of data
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { formData } = body;

    // Get today's date info
    const now = new Date();
    const dayOfWeek = now.getDay();
    const month = now.getMonth() + 1;

    // Calculate historical metrics
    const forms = user.dailyForms;
    const today = new Date().toISOString().split("T")[0];

    // Filter forms by time periods
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

    // Calculate average risk scores
    const avgRisk7d = forms7d.length > 0
      ? forms7d.reduce((sum, f) => sum + f.ruleBasedScore, 0) / forms7d.length
      : formData.ruleBasedScore;

    const avgRisk30d = forms30d.length > 0
      ? forms30d.reduce((sum, f) => sum + f.ruleBasedScore, 0) / forms30d.length
      : formData.ruleBasedScore;

    // Max risk in 7 days
    const maxRisk7d = forms7d.length > 0
      ? Math.max(...forms7d.map((f) => f.ruleBasedScore))
      : formData.ruleBasedScore;

    // Total hazard hours
    const totalHazardHours7d = forms7d.reduce((sum, f) => sum + f.totalHazardExposureHours, 0);
    const totalHazardHours30d = forms30d.reduce((sum, f) => sum + f.totalHazardExposureHours, 0);

    // Average PPE compliance
    const avgPpe7d = forms7d.length > 0
      ? forms7d.reduce((sum, f) => sum + f.ppeComplianceRate, 0) / forms7d.length
      : formData.ppeComplianceRate;

    // Incidents in last 90 days
    const incidentsLast90d = forms90d.filter((f) => f.incidentReported).length;

    // Days since last incident
    const lastIncidentForm = forms.find((f) => f.incidentReported);
    const daysSinceLastIncident = lastIncidentForm
      ? Math.floor((now.getTime() - new Date(lastIncidentForm.date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Calculate consecutive days worked
    let consecutiveDaysWorked = 0;
    const sortedForms = [...forms].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (let i = 0; i < sortedForms.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const formDate = new Date(sortedForms[i].date).toISOString().split("T")[0];
      const expected = expectedDate.toISOString().split("T")[0];
      
      if (formDate === expected) {
        consecutiveDaysWorked++;
      } else {
        break;
      }
    }

    // Gender encoding
    const genderEncoded = user.gender === "male" ? 0 : user.gender === "female" ? 1 : 2;

    // Build features object
    const features = {
      // Personal/Worker history
      age: user.age || 30,
      years_experience: user.yearsExperience || 0,
      gender_encoded: genderEncoded,
      
      // Time-based
      day_of_week: dayOfWeek,
      month: month,
      
      // Today's form data
      shift_duration: formData.shiftDuration,
      fatigue_level: formData.fatigueLevel,
      ppe_compliance_rate: formData.ppeComplianceRate,
      total_hazard_exposure_hours: formData.totalHazardExposureHours,
      
      // Calculated from history
      consecutive_days_worked: consecutiveDaysWorked,
      daily_risk_score: formData.ruleBasedScore,
      avg_risk_7d: Math.round(avgRisk7d * 100) / 100,
      avg_risk_30d: Math.round(avgRisk30d * 100) / 100,
      max_risk_7d: maxRisk7d,
      total_hazard_hours_7d: Math.round(totalHazardHours7d * 100) / 100,
      total_hazard_hours_30d: Math.round(totalHazardHours30d * 100) / 100,
      avg_ppe_7d: Math.round(avgPpe7d * 100) / 100,
      incidents_last_90d: incidentsLast90d,
      days_since_last_incident: daysSinceLastIncident,
    };

    return NextResponse.json({ features });
  } catch (error) {
    console.error("Error calculating features:", error);
    return NextResponse.json({ error: "Failed to calculate features" }, { status: 500 });
  }
}
