"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RiskScoreGauge } from "@/components/RiskScoreGauge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Shield,
  HardHat,
  Ear,
  Eye,
  Hand,
  Wind,
} from "lucide-react";

const HAZARDS = [
  { id: "noise", name: "Noise Exposure", icon: Ear, baseRisk: 15 },
  { id: "dust", name: "Dust/Particles", icon: Wind, baseRisk: 12 },
  { id: "chemicals", name: "Chemical Exposure", icon: AlertTriangle, baseRisk: 20 },
  { id: "heights", name: "Working at Heights", icon: AlertTriangle, baseRisk: 25 },
  { id: "electrical", name: "Electrical Hazards", icon: AlertTriangle, baseRisk: 22 },
  { id: "confined", name: "Confined Spaces", icon: AlertTriangle, baseRisk: 18 },
];

const PPE_ITEMS = [
  { id: "hardhat", name: "Hard Hat", icon: HardHat },
  { id: "safety_glasses", name: "Safety Glasses", icon: Eye },
  { id: "ear_protection", name: "Ear Protection", icon: Ear },
  { id: "gloves", name: "Safety Gloves", icon: Hand },
  { id: "respirator", name: "Respirator/Mask", icon: Wind },
  { id: "safety_vest", name: "High-Vis Vest", icon: Shield },
];

const SYMPTOMS = [
  "Headache",
  "Dizziness",
  "Fatigue",
  "Nausea",
  "Eye Irritation",
  "Skin Irritation",
  "Breathing Difficulty",
  "Muscle Pain",
];

export default function DailyFormPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedHazards, setSelectedHazards] = useState<string[]>([]);
  const [hazardHours, setHazardHours] = useState<Record<string, number>>({});
  const [selectedPPE, setSelectedPPE] = useState<string[]>([]);
  const [fatigueLevel, setFatigueLevel] = useState(3);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [incidentReported, setIncidentReported] = useState(false);
  const [incidentDescription, setIncidentDescription] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Calculate live risk score
  const calculateRiskScore = () => {
    let score = 0;

    // Hazard exposure contribution
    selectedHazards.forEach((hazardId) => {
      const hazard = HAZARDS.find((h) => h.id === hazardId);
      if (hazard) {
        const hours = hazardHours[hazardId] || 1;
        score += hazard.baseRisk * (hours / 8);
      }
    });

    // PPE reduction
    const ppeReduction = selectedPPE.length * 3;
    score = Math.max(0, score - ppeReduction);

    // Fatigue contribution
    score += (fatigueLevel - 1) * 5;

    // Symptoms contribution
    score += selectedSymptoms.length * 4;

    // Incident adds significant risk
    if (incidentReported) {
      score += 20;
    }

    return Math.min(100, Math.round(score));
  };

  const riskScore = calculateRiskScore();

  const handleSubmit = async () => {
    setSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitting(false);
    router.push("/worker");
  };

  const toggleHazard = (hazardId: string) => {
    setSelectedHazards((prev) =>
      prev.includes(hazardId)
        ? prev.filter((h) => h !== hazardId)
        : [...prev, hazardId]
    );
  };

  const togglePPE = (ppeId: string) => {
    setSelectedPPE((prev) =>
      prev.includes(ppeId)
        ? prev.filter((p) => p !== ppeId)
        : [...prev, ppeId]
    );
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const totalSteps = 4;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-6 w-6" />
              Daily Safety Form
            </h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <RiskScoreGauge score={riskScore} size="sm" />
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i + 1 <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Hazard Exposure */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Hazard Exposure</CardTitle>
              <CardDescription>
                Select hazards you were exposed to today and indicate duration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {HAZARDS.map((hazard) => {
                const isSelected = selectedHazards.includes(hazard.id);
                return (
                  <div
                    key={hazard.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => toggleHazard(hazard.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} />
                        <hazard.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{hazard.name}</span>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Hours:</span>
                          <input
                            type="number"
                            min="0.5"
                            max="12"
                            step="0.5"
                            value={hazardHours[hazard.id] || 1}
                            onChange={(e) => {
                              e.stopPropagation();
                              setHazardHours((prev) => ({
                                ...prev,
                                [hazard.id]: parseFloat(e.target.value) || 1,
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 px-2 py-1 text-sm border rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Step 2: PPE Usage */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>PPE Usage</CardTitle>
              <CardDescription>
                Select all personal protective equipment you used today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {PPE_ITEMS.map((ppe) => {
                  const isSelected = selectedPPE.includes(ppe.id);
                  return (
                    <div
                      key={ppe.id}
                      className={`p-4 rounded-lg border text-center cursor-pointer transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => togglePPE(ppe.id)}
                    >
                      <ppe.icon className={`h-8 w-8 mx-auto mb-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-sm font-medium">{ppe.name}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Physical Condition */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Physical Condition</CardTitle>
              <CardDescription>
                Rate your fatigue level and report any symptoms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Fatigue Level: {fatigueLevel}/10</Label>
                <Slider
                  value={[fatigueLevel]}
                  onValueChange={(v) => setFatigueLevel(v[0])}
                  min={1}
                  max={10}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Well Rested</span>
                  <span>Exhausted</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Symptoms Experienced</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {SYMPTOMS.map((symptom) => {
                    const isSelected = selectedSymptoms.includes(symptom);
                    return (
                      <div
                        key={symptom}
                        className={`p-2 rounded-lg border text-center cursor-pointer text-sm transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => toggleSymptom(symptom)}
                      >
                        {symptom}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Incidents & Notes */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Incidents & Additional Notes</CardTitle>
              <CardDescription>
                Report any incidents and provide additional information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-lg border">
                <Checkbox
                  checked={incidentReported}
                  onCheckedChange={(checked) => setIncidentReported(checked as boolean)}
                />
                <div>
                  <p className="font-medium">Report an Incident</p>
                  <p className="text-sm text-muted-foreground">
                    Check this if you experienced or witnessed a safety incident
                  </p>
                </div>
              </div>

              {incidentReported && (
                <div className="space-y-2">
                  <Label>Incident Description</Label>
                  <Textarea
                    placeholder="Describe what happened..."
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Additional Notes (Optional)</Label>
                <Textarea
                  placeholder="Any other safety observations or concerns..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Summary */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <h4 className="font-semibold">Form Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Hazards Reported</p>
                    <p className="font-medium">{selectedHazards.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">PPE Used</p>
                    <p className="font-medium">{selectedPPE.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fatigue Level</p>
                    <p className="font-medium">{fatigueLevel}/10</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Symptoms</p>
                    <p className="font-medium">{selectedSymptoms.length}</p>
                  </div>
                </div>
                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="font-medium">Calculated Risk Score</span>
                  <RiskScoreGauge score={riskScore} size="sm" showLabel={false} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {step < totalSteps ? (
            <Button onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Submit Form
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
