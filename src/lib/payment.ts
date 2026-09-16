import crypto from "crypto";
import Razorpay from "razorpay";

function getRazorpayConfig(): { keyId: string; keySecret: string; mode: "LIVE" | "TEST" } {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret || !/^rzp_(live|test)_/.test(keyId)) {
    throw new Error("Razorpay configuration is missing or invalid. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET with a valid Razorpay key pair.");
  }

  const mode: "LIVE" | "TEST" = keyId.startsWith("rzp_live_") ? "LIVE" : "TEST";
  if (process.env.VERCEL_ENV === "production" && mode !== "LIVE") {
    throw new Error("Production Razorpay configuration must use a live key. Refusing to run checkout in test mode.");
  }

  return { keyId, keySecret, mode };
}

export function getRazorpayMode(): "LIVE" | "TEST" {
  return getRazorpayConfig().mode;
}

export function getRazorpayKeyId(): string {
  return getRazorpayConfig().keyId;
}

const initialKeyId = process.env.RAZORPAY_KEY_ID?.trim() || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
if (initialKeyId && /^rzp_(live|test)_/.test(initialKeyId)) {
  console.info(`RAZORPAY_RUNTIME_MODE=${initialKeyId.startsWith("rzp_live_") ? "LIVE" : "TEST"}`);
  console.info(`RAZORPAY_KEY_PREFIX=${initialKeyId.match(/^rzp_(live|test)_/)?.[0]}`);
}

function getRazorpayClient() {
  const { keyId, keySecret } = getRazorpayConfig();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

/**
 * Creates a real Razorpay order with currency INR (in paise)
 */
export async function createRazorpayOrder({
  amount,
  receipt,
  notes = {},
}: {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  let order;
  try {
    order = await getRazorpayClient().orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt,
      notes: { ...notes, paymentMode: getRazorpayMode() },
    });
  } catch (error: any) {
    console.error("Razorpay order creation failed", {
      code: error?.error?.code,
      description: error?.error?.description,
      status: error?.statusCode ?? error?.status,
    });
    throw error;
  }
  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
  };
}

/**
 * Validates Razorpay Payment Signature using HMAC-SHA256
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
  const { keySecret } = getRazorpayConfig();
  if (!signature) return false;

  try {
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(signature));
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

/**
 * Verifies the signature and confirms the payment/order state with Razorpay.
 */
export async function verifyRazorpayPayment({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
    throw new Error("Invalid Razorpay payment signature");
  }

  const client = getRazorpayClient();
  const [payment, order] = await Promise.all([
    client.payments.fetch(paymentId),
    client.orders.fetch(orderId),
  ]);

  if (payment.order_id !== orderId) {
    throw new Error("Razorpay payment does not belong to the supplied order");
  }

  if (payment.status !== "captured" || order.status !== "paid") {
    throw new Error(`Razorpay payment is not captured (payment=${payment.status}, order=${order.status})`);
  }

  return { payment, order };
}
