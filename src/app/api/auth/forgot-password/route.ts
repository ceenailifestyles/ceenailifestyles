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
import { getClientIp, rateLimit, createRateLimitResponse } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. IP Rate limit: 3 requests per 10 minutes per IP
    const clientIp = getClientIp(req);
    const ipLimit = rateLimit(`forgot-ip:${clientIp}`, 3, 10 * 60 * 1000);
    if (!ipLimit.success) {
      return createRateLimitResponse(ipLimit.retryAfterSeconds);
    }

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

    // 2. Email Rate limit: 60-second cooldown per email
    const emailLimit = rateLimit(`forgot-email:${normalizedEmail}`, 1, 60 * 1000);
    if (!emailLimit.success) {
      return createRateLimitResponse(
        emailLimit.retryAfterSeconds,
        "Please wait before requesting another password reset code."
      );
    }

    // Generic response message to prevent email enumeration
    const genericResponse = {
      success: true,
      message: "If an account exists with this email, a verification code has been sent.",
    };

    // Look up user
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return NextResponse.json(genericResponse);
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

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
