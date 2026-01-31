import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendBulkNotificationEmails, type EmailType } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const type = body.type as string;
    const userIds = Array.isArray(body.userIds) ? (body.userIds as string[]) : [];

    console.log("[admin/notify] Request:", { type, userIds });

    if (type !== "no_form" && type !== "high_risk") {
      return NextResponse.json(
        { error: "Invalid type. Use 'no_form' or 'high_risk'." },
        { status: 400 }
      );
    }

    if (userIds.length === 0) {
      return NextResponse.json(
        { error: "Select at least one worker from the list." },
        { status: 400 }
      );
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });

    const recipients = users
      .filter((u) => u.email)
      .map((u) => ({ email: u.email, name: u.name }));

    const seen = new Set<string>();
    const uniqueRecipients = recipients.filter(
      (r) => r.email && !seen.has(r.email) && seen.add(r.email)
    );

    console.log("[admin/notify] Recipients:", uniqueRecipients.map((r) => r.email));

    if (uniqueRecipients.length === 0) {
      return NextResponse.json({
        sent: 0,
        failed: 0,
        errors: [],
        message: "No valid email addresses found for the selected workers.",
      });
    }

    const result = await sendBulkNotificationEmails(uniqueRecipients, type as EmailType);

    console.log("[admin/notify] Result:", { sent: result.sent, failed: result.failed, errors: result.errors });

    return NextResponse.json({
      ...result,
      total: uniqueRecipients.length,
      message:
        result.failed === 0
          ? `Successfully sent ${result.sent} email(s) to selected workers.`
          : `Sent ${result.sent} email(s). ${result.failed} failed.`,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[admin/notify] Error:", err.message);
    console.error("[admin/notify] Stack:", err.stack);
    if (error && typeof (error as { code?: string }).code !== "undefined") {
      console.error("[admin/notify] Error code:", (error as { code?: string }).code);
    }
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
