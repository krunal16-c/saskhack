import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, jobTitle: true, department: true },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        members: team.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          jobTitle: m.user.jobTitle,
          department: m.user.department,
        })),
        createdAt: team.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function PATCH(
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
    const { name, description } = body as { name?: string; description?: string };

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(typeof name === "string" && name.trim() && { name: name.trim() }),
        ...(typeof description === "string" && { description: description.trim() || null }),
      },
    });

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    await prisma.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
