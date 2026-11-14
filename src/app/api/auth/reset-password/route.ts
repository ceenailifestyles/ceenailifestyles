import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { findUserByEmail } from "@/lib/repositories/user";
import { findPasswordReset, resetPasswordWithToken } from "@/lib/repositories/passwordReset";
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
    const resetRecord = await findPasswordReset(normalizedEmail, otp.trim());

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
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // 5. Hash new password & update transactionally
    const hashedPassword = await hashPassword(password);
    const result = await resetPasswordWithToken(otp.trim(), hashedPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to reset password." },
        { status: 400 }
      );
    }

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
