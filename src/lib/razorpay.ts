import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Return an initialized Razorpay instance using environment variables.
 */
export function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file."
    );
  }

  if (
    key_id.includes("placeholder") ||
    key_secret.includes("placeholder") ||
    key_id === "rzp_test_your_key_id" ||
    key_secret === "your_key_secret"
  ) {
    throw new Error(
      "Razorpay API keys in .env are placeholder values. Please update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET with your Razorpay Test or Live keys from dashboard.razorpay.com."
    );
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

/**
 * Verify Razorpay payment signature after customer completes payment on frontend.
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured.");
  }

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}

