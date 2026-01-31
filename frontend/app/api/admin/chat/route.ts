import path from "path";
import { config } from "dotenv";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/prisma";

// Ensure .env.local is loaded so OPENAI_API_KEY is available
config({ path: path.resolve(process.cwd(), ".env.local") });

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to .env.local.");
  }
  return new OpenAI({ apiKey });
}

function buildWorkerContext(user: {
  name: string | null;
  email: string;
  age: number | null;
  gender: string | null;
  yearsExperience: number | null;
  jobTitle: string | null;
  department: string | null;
}, forms: Array<{
  date: Date;
  shiftDuration: number;
  fatigueLevel: number;
  riskScore: number;
  ppeComplianceRate: number;
  ppeItemsUsed: number;
  ppeItemsRequired: number;
  totalHazardExposureHours: number;
  hazardExposures: unknown;
  symptoms: unknown;
  incidentReported: boolean;
  incidentDescription: string | null;
  notes: string | null;
}>) {
  const profile = [
    `Name: ${user.name ?? "Not set"}`,
    `Email: ${user.email}`,
    `Age: ${user.age ?? "Not set"}`,
    `Gender: ${user.gender ?? "Not set"}`,
    `Job Title: ${user.jobTitle ?? "Not set"}`,
    `Department: ${user.department ?? "Not set"}`,
    `Years of Experience: ${user.yearsExperience ?? "Not set"}`,
  ].join("\n");

  const formEntries = forms.map((f, i) => {
    const dateStr = new Date(f.date).toLocaleDateString("en-US");
    const hazards = typeof f.hazardExposures === "object" && f.hazardExposures !== null
      ? JSON.stringify(f.hazardExposures)
      : "none";
    const symptoms = Array.isArray(f.symptoms) ? (f.symptoms as string[]).join(", ") : "none";
    return [
      `--- Form ${i + 1} (${dateStr}) ---`,
      `Shift duration: ${f.shiftDuration} hours`,
      `Fatigue level: ${f.fatigueLevel}/10`,
      `Risk score: ${f.riskScore}`,
      `PPE compliance: ${f.ppeItemsUsed}/${f.ppeItemsRequired} (${Math.round(f.ppeComplianceRate * 100)}%)`,
      `Total hazard exposure hours: ${f.totalHazardExposureHours}`,
      `Hazard exposures: ${hazards}`,
      `Symptoms: ${symptoms}`,
      `Incident reported: ${f.incidentReported}`,
      f.incidentDescription ? `Incident description: ${f.incidentDescription}` : null,
      f.notes ? `Notes: ${f.notes}` : null,
    ].filter(Boolean).join("\n");
  }).join("\n\n");

  return `## Worker profile\n${profile}\n\n## Daily form submissions (most recent first)\n${formEntries || "No form submissions yet."}`;
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Set OPENAI_API_KEY in .env.local." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { userId: targetUserId, message } = body as { userId?: string; message?: string };
    const messages = Array.isArray(body.messages) ? (body.messages as { role: string; content: string }[]) : null;

    if (!targetUserId || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Missing userId or message." },
        { status: 400 }
      );
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        dailyForms: {
          where: { date: { gte: thirtyDaysAgo } },
          orderBy: { date: "desc" },
          take: 30,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const context = buildWorkerContext(
      {
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        yearsExperience: user.yearsExperience,
        jobTitle: user.jobTitle,
        department: user.department,
      },
      user.dailyForms
    );

    const systemContent = `You are an admin assistant for a workplace safety app (SafetyFirst). You help answer questions about a specific worker using their profile and daily safety form data. Answer only based on the context provided. If the context does not contain enough information, say so. Be concise and professional.

<context>
${context}
</context>`;

    const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemContent },
    ];

    if (messages && messages.length > 0) {
      for (const m of messages) {
        if (m.role === "user" || m.role === "assistant") {
          chatMessages.push({ role: m.role as "user" | "assistant", content: m.content });
        }
      }
    }
    chatMessages.push({ role: "user", content: message.trim() });

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content ?? "No response from the model.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[admin/chat] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to get response.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
