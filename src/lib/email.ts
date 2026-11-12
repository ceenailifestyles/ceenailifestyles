import { z } from "zod";
import { formatINR } from "@/lib/utils";

const BREVO_REST_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Ensure the Brevo email service is strictly executed on the server.
 */
function assertServerSide(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "Security violation: Brevo email service must only be executed on the server."
    );
  }
}

/**
 * Zod schema for validating Brevo environment configuration.
 */
const brevoEnvSchema = z.object({
  apiKey: z.string().trim().min(1, "BREVO_API_KEY is missing in environment variables"),
  senderEmail: z
    .string()
    .trim()
    .email("BREVO_SENDER_EMAIL must be a valid email address"),
  senderName: z.string().trim().min(1).default("CeeneAI"),
});

/**
 * Zod schema for validating transactional email parameters.
 */
const sendEmailInputSchema = z
  .object({
    recipientEmail: z.string().trim().email("Invalid recipient email address"),
    recipientName: z.string().trim().optional(),
    subject: z.string().trim().min(1, "Email subject is required").optional(),
    htmlContent: z.string().trim().min(1, "HTML content cannot be empty").optional(),
    textContent: z.string().trim().optional(),
    templateId: z.number().int().positive().optional(),
    templateParams: z.record(z.string(), z.unknown()).optional(),
    replyTo: z
      .object({
        email: z.string().trim().email(),
        name: z.string().trim().optional(),
      })
      .optional(),
    tags: z.array(z.string().trim()).optional(),
  })
  .refine(
    (data) => Boolean(data.htmlContent || data.templateId),
    "Either htmlContent or templateId must be provided"
  )
  .refine(
    (data) => Boolean(data.templateId || data.subject),
    "subject is required when sending custom htmlContent"
  );

export interface SendTransactionalEmailOptions {
  /** Recipient email address (alias: `to`) */
  recipientEmail?: string;
  to?: string;
  /** Recipient display name (alias: `name`) */
  recipientName?: string;
  name?: string;
  /** Email subject line */
  subject?: string;
  /** HTML body of the email */
  htmlContent?: string;
  /** Optional plain-text fallback body */
  textContent?: string;
  /** Optional Brevo transactional template ID */
  templateId?: number;
  /** Optional template parameters (alias: `params`) */
  templateParams?: Record<string, unknown>;
  params?: Record<string, unknown>;
  /** Optional reply-to address */
  replyTo?: {
    email: string;
    name?: string;
  };
  /** Optional tags for Brevo analytics */
  tags?: string[];
}

export interface BrevoEmailResult {
  success: boolean;
  messageId?: string;
  statusCode: number;
  error?: string;
  details?: unknown;
}

/**
 * Retrieve and validate Brevo credentials from server environment variables.
 */
export function getBrevoConfig() {
  assertServerSide();

  const parsed = brevoEnvSchema.safeParse({
    apiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.BREVO_SENDER_EMAIL,
    senderName: process.env.BREVO_SENDER_NAME || "CeeneAI",
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(
      `Brevo configuration error: ${firstIssue?.message || "Invalid environment variables"}`
    );
  }

  return parsed.data;
}

/**
 * Interpolate `{{key}}` placeholders in a string using provided template parameters.
 */
function interpolateParams(
  content: string,
  params?: Record<string, unknown>
): string {
  if (!params) return content;
  return content.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Shared CeeneAI HTML email wrapper for transactional emails.
 */
function wrapBrandEmailTemplate(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 24px 16px; background-color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2B1A13;">
    <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 14px; border: 1px solid #EFE8DE; overflow: hidden; box-shadow: 0 4px 16px rgba(43, 26, 19, 0.05);">
      <div style="background-color: #7B1123; padding: 24px 32px; text-align: center;">
        <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 700; color: #FFFFFF; letter-spacing: 1.5px;">
          CEENAI
        </h1>
      </div>
      <div style="padding: 32px;">
        ${bodyHtml}
      </div>
      <div style="background-color: #FFFFFF; padding: 18px 32px; text-align: center; border-top: 1px solid #EFE8DE; font-size: 12px; color: #7A6F68; line-height: 1.6;">
        &copy; ${new Date().getFullYear()} CeeneAI. All rights reserved.<br />
        Om Kripa CHS, Shop No. 1, Janakalyan Road, Malad West, Mumbai - 400095
      </div>
    </div>
  </body>
</html>`;
}

/**
 * Core reusable function to send transactional emails via the Brevo v3 REST API.
 */
export async function sendTransactionalEmail(
  options: SendTransactionalEmailOptions
): Promise<BrevoEmailResult> {
  assertServerSide();

  const recipientEmail = options.recipientEmail || options.to || "";
  const recipientName = options.recipientName || options.name;
  const templateParams = options.templateParams || options.params;

  const validatedInput = sendEmailInputSchema.safeParse({
    recipientEmail,
    recipientName,
    subject: options.subject,
    htmlContent: options.htmlContent,
    textContent: options.textContent,
    templateId: options.templateId,
    templateParams,
    replyTo: options.replyTo,
    tags: options.tags,
  });

  if (!validatedInput.success) {
    const errorMessage =
      validatedInput.error.issues[0]?.message || "Invalid email payload";
    console.error("[BrevoEmailService] Validation error:", errorMessage);
    return {
      success: false,
      statusCode: 400,
      error: errorMessage,
      details: validatedInput.error.flatten(),
    };
  }

  let config: ReturnType<typeof getBrevoConfig>;
  try {
    config = getBrevoConfig();
  } catch (err: any) {
    const message = err instanceof Error ? err.message : "Brevo configuration error";
    console.error("[BrevoEmailService] Configuration error:", message);
    return {
      success: false,
      statusCode: 500,
      error: message,
    };
  }

  const data = validatedInput.data;

  const payload: Record<string, unknown> = {
    sender: {
      name: config.senderName,
      email: config.senderEmail,
    },
    to: [
      {
        email: data.recipientEmail,
        ...(data.recipientName ? { name: data.recipientName } : {}),
      },
    ],
  };

  if (data.subject) {
    payload.subject = interpolateParams(data.subject, data.templateParams);
  }

  if (data.htmlContent) {
    payload.htmlContent = interpolateParams(
      data.htmlContent,
      data.templateParams
    );
  }

  if (data.textContent) {
    payload.textContent = interpolateParams(
      data.textContent,
      data.templateParams
    );
  }

  if (data.templateId) {
    payload.templateId = data.templateId;
  }

  if (data.templateParams && Object.keys(data.templateParams).length > 0) {
    payload.params = data.templateParams;
  }

  if (data.replyTo) {
    payload.replyTo = data.replyTo;
  }

  if (data.tags && data.tags.length > 0) {
    payload.tags = data.tags;
  }

  try {
    const response = await fetch(BREVO_REST_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const apiErrorMessage =
        responseData?.message ||
        responseData?.code ||
        `Brevo API request failed with HTTP ${response.status}`;

      console.error("[BrevoEmailService] Brevo API error:", {
        status: response.status,
        recipient: data.recipientEmail,
        subject: data.subject,
        response: responseData,
      });

      return {
        success: false,
        statusCode: response.status,
        error: apiErrorMessage,
        details: responseData,
      };
    }

    const messageId = responseData?.messageId
      ? String(responseData.messageId)
      : undefined;

    console.info("[BrevoEmailService] Transactional email dispatched:", {
      messageId,
      recipient: data.recipientEmail,
      subject: data.subject,
    });

    return {
      success: true,
      messageId,
      statusCode: response.status,
    };
  } catch (error: any) {
    const networkError =
      error instanceof Error ? error.message : "Network error contacting Brevo API";
    console.error("[BrevoEmailService] Request exception:", networkError);
    return {
      success: false,
      statusCode: 502,
      error: networkError,
    };
  }
}

/**
 * 1. Password Reset OTP Email (Forgot Password workflow)
 */
export interface SendPasswordResetParams {
  to: string;
  name?: string;
  otp: string;
}

export async function sendPasswordResetEmail({
  to,
  name,
  otp,
}: SendPasswordResetParams): Promise<BrevoEmailResult> {
  const customerName = name || "Valued Customer";
  const htmlContent = wrapBrandEmailTemplate(
    "Your CeeneAI Password Reset OTP",
    `
      <h2 style="font-size: 20px; font-weight: 700; color: #2B1A13; margin-top: 0;">Password Reset OTP</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #442C22;">Hello {{name}},</p>
      <p style="font-size: 14px; line-height: 1.6; color: #442C22;">
        Use the following 6-digit One-Time Password (OTP) to reset your CeeneAI account password:
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <div style="display: inline-block; background-color: #FAF7F2; border: 2px dashed #7B1123; color: #7B1123; padding: 14px 32px; border-radius: 12px; font-size: 28px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">
          {{otp}}
        </div>
      </div>
      <p style="font-size: 12px; line-height: 1.6; color: #7A6F68;">
        This OTP is valid for 10 minutes and can only be used once. Do not share this code with anyone. If you did not request a password reset, you can safely ignore this email.
      </p>
    `
  );

  return sendTransactionalEmail({
    recipientEmail: to,
    recipientName: customerName,
    subject: `${otp} is your CeeneAI password reset OTP`,
    htmlContent,
    templateParams: {
      name: customerName,
      otp,
    },
    tags: ["auth", "password-reset-otp"],
  });
}

export const sendPasswordResetOtpEmail = sendPasswordResetEmail;

/**
 * 2. Password Reset Confirmation Email (Reset Password workflow)
 */
export async function sendPasswordResetConfirmationEmail({
  to,
  name,
}: {
  to: string;
  name?: string;
}): Promise<BrevoEmailResult> {
  const customerName = name || "Valued Customer";
  const htmlContent = wrapBrandEmailTemplate(
    "Your CeeneAI Password Has Been Updated",
    `
      <h2 style="font-size: 20px; font-weight: 700; color: #2B1A13; margin-top: 0;">Password Updated Successfully</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #442C22;">Hello {{name}},</p>
      <p style="font-size: 14px; line-height: 1.6; color: #442C22;">
        Your CeeneAI account password was recently changed. You can now sign in with your new password.
      </p>
      <p style="font-size: 12px; line-height: 1.6; color: #7A6F68; margin-top: 20px;">
        If you did not perform this action, please contact our support team immediately.
      </p>
    `
  );

  return sendTransactionalEmail({
    recipientEmail: to,
    recipientName: customerName,
    subject: "Your CeeneAI Password Has Been Updated",
    htmlContent,
    templateParams: {
      name: customerName,
    },
    tags: ["auth", "password-reset-confirmed"],
  });
}

/**
 * 3. Welcome Email on Customer Registration (Register workflow)
 */
export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}): Promise<BrevoEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const htmlContent = wrapBrandEmailTemplate(
    "Welcome to CeeneAI",
    `
      <h2 style="font-size: 20px; font-weight: 700; color: #2B1A13; margin-top: 0;">Welcome to CeeneAI, {{name}}!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #442C22;">
        Thank you for creating your account with CeeneAI. Explore our curated collections of Indian wear, western wear, luxury nightwear, and accessories crafted for timeless elegance.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{{shopUrl}}" style="display: inline-block; background-color: #7B1123; color: #FFFFFF; padding: 13px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Explore Collection
        </a>
      </div>
    `
  );

  return sendTransactionalEmail({
    recipientEmail: to,
    recipientName: name,
    subject: "Welcome to CeeneAI – Timeless Elegance",
    htmlContent,
    templateParams: {
      name,
      shopUrl: `${appUrl}/products`,
    },
    tags: ["auth", "welcome"],
  });
}

/**
 * 4. Order Confirmation Email (Checkout / Order Creation workflow)
 */
export interface OrderConfirmationEmailParams {
  to: string;
  customerName: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string | null;
    color?: string | null;
  }>;
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  shippingAddress: {
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
  };
}

export async function sendOrderConfirmationEmail(
  params: OrderConfirmationEmailParams
): Promise<BrevoEmailResult> {
  const itemsRowsHtml = params.items
    .map((item) => {
      const variantMeta = [
        item.size ? `Size: ${item.size}` : null,
        item.color ? `Color: ${item.color}` : null,
      ]
        .filter(Boolean)
        .join(" • ");

      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #EFE8DE; font-size: 13px; color: #2B1A13;">
            <strong>${item.name}</strong>
            ${variantMeta ? `<br /><span style="font-size: 11px; color: #7A6F68;">${variantMeta}</span>` : ""}
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #EFE8DE; font-size: 13px; color: #7A6F68; text-align: center;">
            &times;${item.quantity}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #EFE8DE; font-size: 13px; font-weight: 600; color: #2B1A13; text-align: right;">
            ${formatINR(item.price * item.quantity)}
          </td>
        </tr>
      `;
    })
    .join("");

  const htmlContent = wrapBrandEmailTemplate(
    `Order Confirmed – #${params.orderNumber}`,
    `
      <h2 style="font-size: 20px; font-weight: 700; color: #2B1A13; margin-top: 0;">Thank You for Your Order!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #442C22;">
        Hello {{customerName}}, your order <strong>#{{orderNumber}}</strong> has been confirmed and is being prepared.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr>
            <th style="text-align: left; font-size: 11px; text-transform: uppercase; color: #7A6F68; padding-bottom: 8px; border-bottom: 1px solid #EFE8DE;">Item</th>
            <th style="text-align: center; font-size: 11px; text-transform: uppercase; color: #7A6F68; padding-bottom: 8px; border-bottom: 1px solid #EFE8DE;">Qty</th>
            <th style="text-align: right; font-size: 11px; text-transform: uppercase; color: #7A6F68; padding-bottom: 8px; border-bottom: 1px solid #EFE8DE;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHtml}
        </tbody>
      </table>

      <div style="background-color: #FAF7F2; padding: 16px; border-radius: 10px; font-size: 13px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #7A6F68;">Subtotal:</span>
          <strong style="color: #2B1A13; float: right;">${formatINR(params.subtotal)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: #7A6F68;">Shipping:</span>
          <strong style="color: #2B1A13; float: right;">${params.shippingFee === 0 ? "FREE" : formatINR(params.shippingFee)}</strong>
        </div>
        <div style="border-top: 1px solid #EFE8DE; padding-top: 8px; margin-top: 8px;">
          <span style="font-weight: 700; color: #2B1A13;">Grand Total (${params.paymentMethod}):</span>
          <strong style="color: #7B1123; font-size: 15px; float: right;">${formatINR(params.total)}</strong>
        </div>
      </div>

      <div style="font-size: 12px; color: #7A6F68; line-height: 1.6;">
        <strong style="color: #2B1A13;">Delivery Address:</strong><br />
        ${params.shippingAddress.addressLine}, ${params.shippingAddress.city}, ${params.shippingAddress.state} - ${params.shippingAddress.postalCode}
      </div>
    `
  );

  return sendTransactionalEmail({
    recipientEmail: params.to,
    recipientName: params.customerName,
    subject: `Order Confirmed – #${params.orderNumber} | CeeneAI`,
    htmlContent,
    templateParams: {
      customerName: params.customerName,
      orderNumber: params.orderNumber,
      total: formatINR(params.total),
    },
    tags: ["order", "order-confirmation"],
  });
}

/**
 * 5. Order Status Update Email (Admin Order Status Update workflow)
 */
export async function sendOrderStatusUpdateEmail({
  to,
  customerName,
  orderNumber,
  status,
  paymentStatus,
  total,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  total: number;
}): Promise<BrevoEmailResult> {
  const htmlContent = wrapBrandEmailTemplate(
    `Order #${orderNumber} Status Update`,
    `
      <h2 style="font-size: 20px; font-weight: 700; color: #2B1A13; margin-top: 0;">Order Status Update</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #442C22;">
        Hello {{customerName}}, the status of your CeeneAI order <strong>#{{orderNumber}}</strong> has been updated.
      </p>
      <div style="background-color: #FAF7F2; border: 1px solid #EFE8DE; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px;">
        <p style="margin: 0 0 8px 0;"><strong>Order Status:</strong> <span style="color: #7B1123; font-weight: 700;">{{status}}</span></p>
        ${paymentStatus ? `<p style="margin: 0 0 8px 0;"><strong>Payment Status:</strong> ${paymentStatus}</p>` : ""}
        <p style="margin: 0;"><strong>Order Total:</strong> ${formatINR(total)}</p>
      </div>
    `
  );

  return sendTransactionalEmail({
    recipientEmail: to,
    recipientName: customerName,
    subject: `Update on Your CeeneAI Order #${orderNumber} – ${status}`,
    htmlContent,
    templateParams: {
      customerName,
      orderNumber,
      status,
    },
    tags: ["order", "order-status-update"],
  });
}
