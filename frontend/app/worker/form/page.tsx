"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RiskScoreGauge } from "@/components/RiskScoreGauge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Calendar,
  Clock,
  Loader2,
  Cloud,
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

const WEATHER_CONDITIONS = [
  { value: "Clear", label: "Clear / Sunny" },
  { value: "Cloudy", label: "Cloudy" },
  { value: "Rain", label: "Rain" },
  { value: "Snow", label: "Snow" },
  { value: "Fog", label: "Fog" },
  { value: "Extreme_Heat", label: "Extreme Heat (>30°C)" },
  { value: "Extreme_Cold", label: "Extreme Cold (<-20°C)" },
  { value: "Wind", label: "High Wind" },
  { value: "Storm", label: "Storm" },
];

const getTodayDate = () => new Date().toISOString().split("T")[0];

export default function DailyFormPage() {
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Date & Shift Info
  const [formDate, setFormDate] = useState(getTodayDate());
  const [shiftDuration, setShiftDuration] = useState(8);
  const [weatherCondition, setWeatherCondition] = useState("Clear");

  // Step 2: Hazard Exposure
  const [selectedHazards, setSelectedHazards] = useState<string[]>([]);
  const [hazardHours, setHazardHours] = useState<Record<string, number>>({});

  // Step 3: PPE Usage
  const [selectedPPE, setSelectedPPE] = useState<string[]>([]);

  // Step 4: Physical Condition
  const [fatigueLevel, setFatigueLevel] = useState(3);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Step 5: Incidents & Notes
  const [incidentReported, setIncidentReported] = useState(false);
  const [incidentDescription, setIncidentDescription] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Calculate total hazard exposure hours
  const totalHazardExposureHours = Object.entries(hazardHours)
    .filter(([id]) => selectedHazards.includes(id))
    .reduce((sum, [, hours]) => sum + hours, 0);

  // Calculate PPE compliance rate
  const ppeComplianceRate = PPE_ITEMS.length > 0 ? selectedPPE.length / PPE_ITEMS.length : 1;

  // Calculate live risk score (0-100 for display, will be converted to 0-1 for storage)
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

    // PPE reduction (up to 18 points)
    const ppeReduction = ppeComplianceRate * 18;
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

    try {
      // Build hazard exposures object
      const hazardExposures: Record<string, number> = {};
      selectedHazards.forEach((id) => {
        hazardExposures[id] = hazardHours[id] || 1;
      });

      // Prepare form data
      const formData = {
        date: formDate,
        shiftDuration,
        weatherCondition,
        fatigueLevel,
        ppeItemsRequired: PPE_ITEMS.length,
        ppeItemsUsed: selectedPPE.length,
        ppeDetails: selectedPPE,
        hazardExposures,
        symptoms: selectedSymptoms,
        incidentReported,
        incidentDescription: incidentReported ? incidentDescription : null,
        notes: additionalNotes || null,
      };

      // Log form data
      console.log("=== FORM DATA JSON ===");
      console.log(JSON.stringify(formData, null, 2));
      console.log("======================");

      // Submit form to API
      const formResponse = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!formResponse.ok) {
        throw new Error("Failed to submit form");
      }

      const formResult = await formResponse.json();

      // Calculate features for ML model
      const featuresResponse = await fetch("/api/forms/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: {
            shiftDuration,
            weatherCondition,
            fatigueLevel,
            ppeComplianceRate,
            totalHazardExposureHours,
            ruleBasedScore: formResult.form.ruleBasedScore,
          },
        }),
      });

      if (!featuresResponse.ok) {
        throw new Error("Failed to calculate features");
      }

      const featuresResult = await featuresResponse.json();

      // Print features JSON to console
      console.log("=== ML FEATURES JSON ===");
      console.log(JSON.stringify(featuresResult.features, null, 2));
      console.log("========================");

      // Redirect to dashboard after successful submission
      router.push("/worker");

    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form. Please try again.");
      setSubmitting(false);
    }
  };

  const toggleHazard = (hazardId: string) => {
    setSelectedHazards((prev) =>
      prev.includes(hazardId) ? prev.filter((h) => h !== hazardId) : [...prev, hazardId]
    );
    if (!hazardHours[hazardId]) {
      setHazardHours((prev) => ({ ...prev, [hazardId]: 1 }));
    }
  };

  const togglePPE = (ppeId: string) => {
    setSelectedPPE((prev) =>
      prev.includes(ppeId) ? prev.filter((p) => p !== ppeId) : [...prev, ppeId]
    );
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
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

  const totalSteps = 5;

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
              Complete your daily safety assessment
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

        {/* Step 1: Date & Shift Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date & Shift Information
              </CardTitle>
              <CardDescription>
                Enter the date, duration, and conditions of your shift
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Form Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    max={getTodayDate()}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shiftDuration">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Shift Duration (hours)
                  </Label>
                  <Input
                    id="shiftDuration"
                    type="number"
                    min={1}
                    max={16}
                    step={0.5}
                    value={shiftDuration}
                    onChange={(e) => setShiftDuration(parseFloat(e.target.value) || 8)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weather">
                    <Cloud className="inline h-4 w-4 mr-1" />
                    Weather Condition
                  </Label>
                  <Select value={weatherCondition} onValueChange={setWeatherCondition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select weather" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEATHER_CONDITIONS.map((condition) => (
                        <SelectItem key={condition.value} value={condition.value}>
                          {condition.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Hazard Exposure */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Hazard Exposure</CardTitle>
              <CardDescription>
                Select hazards you were exposed to and indicate duration (hours)
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
                          <Input
                            type="number"
                            min={0.5}
                            max={shiftDuration}
                            step={0.5}
                            value={hazardHours[hazard.id] || 1}
                            onChange={(e) => {
                              e.stopPropagation();
                              setHazardHours((prev) => ({
                                ...prev,
                                [hazard.id]: parseFloat(e.target.value) || 1,
                              }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-20"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Total Hazard Exposure: <strong>{totalHazardExposureHours.toFixed(1)} hours</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: PPE Usage */}
        {step === 3 && (
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
              <div className="pt-4 mt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  PPE Compliance: <strong>{(ppeComplianceRate * 100).toFixed(0)}%</strong> ({selectedPPE.length}/{PPE_ITEMS.length} items)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Physical Condition */}
        {step === 4 && (
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
                  <span>Well Rested (1)</span>
                  <span>Exhausted (10)</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Symptoms Experienced (select all that apply)</Label>
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

        {/* Step 5: Incidents & Summary */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Incidents & Summary</CardTitle>
              <CardDescription>
                Report any incidents and review your form
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
                  <Label>Incident Description *</Label>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{formDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Shift Duration</p>
                    <p className="font-medium">{shiftDuration} hours</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Weather</p>
                    <p className="font-medium">{weatherCondition.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Hazards</p>
                    <p className="font-medium">{selectedHazards.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Hazard Hours</p>
                    <p className="font-medium">{totalHazardExposureHours.toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">PPE Compliance</p>
                    <p className="font-medium">{(ppeComplianceRate * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fatigue Level</p>
                    <p className="font-medium">{fatigueLevel}/10</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Incident</p>
                    <p className="font-medium">{incidentReported ? "Yes" : "No"}</p>
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
