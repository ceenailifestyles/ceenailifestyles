import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/repositories/user";
import { verifyPassword, signToken, ADMIN_COOKIE_NAME } from "@/lib/auth";
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
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(req);
    const normalizedEmail = email.toLowerCase().trim();
    const failKey = `admin-login-fail:${clientIp}:${normalizedEmail}`;

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
        { error: "Invalid credentials" },
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
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Role-Based Restriction: Only ADMIN or SUPER_ADMIN roles can log in through the admin portal
    if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
      recordFailedAttempt(failKey, 15 * 60 * 1000);
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    // Reset failed counter on successful login
    resetRateLimit(failKey);

    const token = signToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      "1d"
    ); // 1 day for admin session

    const response = NextResponse.json({
      success: true,
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
