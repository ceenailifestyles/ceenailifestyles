import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/repositories/user";
import { verifyPassword, signToken, CUSTOMER_COOKIE_NAME } from "@/lib/auth";
import { customerLoginSchema, getZodErrorMessage } from "@/lib/validations";
import { Role } from "@/lib/types";
import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  createRateLimitResponse,
} from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = customerLoginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(validated.error) },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const clientIp = getClientIp(req);
    const normalizedEmail = email.toLowerCase().trim();
    const failKey = `customer-login-fail:${clientIp}:${normalizedEmail}`;

    // Check if locked out (5 failed attempts per 15 minutes per IP+email)
    const check = checkRateLimit(failKey, 5);
    if (!check.allowed) {
      return createRateLimitResponse(
        check.retryAfterSeconds,
        "Too many failed login attempts. Please try again later."
      );
    }

    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      const fail = recordFailedAttempt(failKey, 15 * 60 * 1000);
      if (fail.count >= 5) {
        return createRateLimitResponse(
          fail.retryAfterSeconds,
          "Too many failed login attempts. Please try again later."
        );
      }
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      const fail = recordFailedAttempt(failKey, 15 * 60 * 1000);
      if (fail.count >= 5) {
        return createRateLimitResponse(
          fail.retryAfterSeconds,
          "Too many failed login attempts. Please try again later."
        );
      }
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Role-Based Restriction: Only CUSTOMER role accounts can log in via the customer portal
    if (user.role !== Role.CUSTOMER) {
      recordFailedAttempt(failKey, 15 * 60 * 1000);
      return NextResponse.json(
        {
          error:
            "Access denied. This login portal is strictly for customers. Administrators must sign in through the Admin Console at /admin/login.",
        },
        { status: 403 }
      );
    }

    // Reset failed counter on successful login
    resetRateLimit(failKey);

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

    response.cookies.set(CUSTOMER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
