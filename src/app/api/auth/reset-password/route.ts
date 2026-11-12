import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema, getZodErrorMessage } from "@/lib/validations";
import { sendPasswordResetConfirmationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = resetPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(validated.error) },
        { status: 400 }
      );
    }

    const { email, otp, password } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Find OTP record matching email and 6-digit OTP
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        email: normalizedEmail,
        token: otp.trim(),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid OTP. Please check the 6-digit code sent to your email." },
        { status: 400 }
      );
    }

    // 2. Check if already used
    if (resetRecord.usedAt) {
      return NextResponse.json(
        { error: "This OTP has already been used. Please request a new OTP." },
        { status: 400 }
      );
    }

    // 3. Check expiration
    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json(
        { error: "This OTP has expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    // 4. Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // 5. Hash new password & update
    const hashedPassword = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await sendPasswordResetConfirmationEmail({
      to: user.email,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
