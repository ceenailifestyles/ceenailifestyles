import { NextResponse } from "next/server";
import crypto from "crypto";
import { findUserByEmail } from "@/lib/repositories/user";
import {
  deletePasswordResetsByEmail,
  findPasswordResetByToken,
  createPasswordReset,
} from "@/lib/repositories/passwordReset";
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
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 }
      );
    }

    // Invalidate existing unused OTPs for this email
    await deletePasswordResetsByEmail(normalizedEmail);

    // Generate secure 6-digit numeric OTP
    let otp = crypto.randomInt(100000, 1000000).toString();
    const existingOtp = await findPasswordResetByToken(otp);
    if (existingOtp) {
      otp = crypto.randomInt(100000, 1000000).toString();
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await createPasswordReset(normalizedEmail, otp, expiresAt);

    const emailResult = await sendPasswordResetEmail({
      to: normalizedEmail,
      name: user.name,
      otp,
    });

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
    }

    return NextResponse.json({
      success: true,
      message: "A 6-digit verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
