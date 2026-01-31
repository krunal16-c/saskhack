import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET user profile
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

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// UPDATE user profile
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { age, gender, yearsExperience, jobType, jobTitle, department, name } = body;

    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(age !== undefined && { age: parseInt(age) || null }),
        ...(gender !== undefined && { gender }),
        ...(yearsExperience !== undefined && { yearsExperience: parseInt(yearsExperience) || 0 }),
        ...(jobType !== undefined && { jobType }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(department !== undefined && { department }),
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
