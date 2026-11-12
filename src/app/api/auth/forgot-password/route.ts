import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema, getZodErrorMessage } from "@/lib/validations";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = forgotPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(validated.error) },
        { status: 400 }
      );
    }

    const { email } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Look up user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 }
      );
    }

    // Invalidate existing unused OTPs for this email
    await prisma.passwordReset.deleteMany({
      where: { email: normalizedEmail },
    });

    // Generate secure 6-digit numeric OTP
    let otp = crypto.randomInt(100000, 1000000).toString();
    const existingOtp = await prisma.passwordReset.findUnique({
      where: { token: otp },
    });
    if (existingOtp) {
      otp = crypto.randomInt(100000, 1000000).toString();
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.passwordReset.create({
      data: {
        email: normalizedEmail,
        token: otp,
        expiresAt,
      },
    });

    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          error: emailResult.error || "Failed to send password reset OTP email",
        },
        { status: emailResult.statusCode || 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "A 6-digit OTP has been sent to your email address.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
