import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const body = await request.json().catch(() => ({}));
    const { userId: memberUserId } = body as { userId?: string };

    if (!memberUserId || typeof memberUserId !== "string") {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: memberUserId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.teamMember.upsert({
      where: {
        teamId_userId: { teamId, userId: memberUserId },
      },
      create: { teamId, userId: memberUserId },
      update: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
