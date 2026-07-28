import { redis } from "@/server/services/redis/client";

const BASE_URL = process.env.MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

export function isMpesaConfigured() {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_SHORTCODE &&
      process.env.MPESA_PASSKEY &&
      process.env.MPESA_CALLBACK_URL,
  );
}

async function getAccessToken(): Promise<string> {
  const cacheKey = "mpesa:token";
  if (redis) {
    const cached = await redis.get<string>(cacheKey);
    if (cached) return cached;
  }

  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error("Failed to obtain M-Pesa access token.");
  const data = await res.json();
  const token = data.access_token as string;

  // Tokens last 3600s — cache a little short so we never hand out one about to expire.
  if (redis) await redis.set(cacheKey, token, { ex: 3500 });
  return token;
}

/** Daraja wants Africa/Nairobi local time as YYYYMMDDHHmmss, not UTC. */
function nairobiTimestamp(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

export async function initiateSTKPush(params: {
  phone: string; // 254XXXXXXXXX
  amountCents: number;
  accountRef: string; // Daraja caps this at 12 characters
  description: string;
}) {
  const token = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE!;
  const timestamp = nairobiTimestamp();
  const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");
  const amount = Math.round(params.amountCents / 100); // Daraja wants whole shillings, no decimals

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: params.phone,
      PartyB: shortcode,
      PhoneNumber: params.phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: params.accountRef.slice(0, 12),
      TransactionDesc: params.description,
    }),
  });

  const data = await res.json();
  if (!res.ok || data.ResponseCode !== "0") {
    throw new Error(data.errorMessage ?? data.ResponseDescription ?? "STK push request failed.");
  }

  return { checkoutRequestId: data.CheckoutRequestID as string, merchantRequestId: data.MerchantRequestID as string };
}

/** For the reconciliation sweep: asks Daraja directly for a checkout's outcome instead of waiting on a callback that may never arrive. */
export async function queryStkStatus(checkoutRequestId: string) {
  const token = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE!;
  const timestamp = nairobiTimestamp();
  const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");

  const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ BusinessShortCode: shortcode, Password: password, Timestamp: timestamp, CheckoutRequestID: checkoutRequestId }),
  });
  const data = await res.json();
  // ResultCode "0" = completed successfully; "1032" = cancelled by user;
  // 1037/2001 etc = various failures; a query error before Daraja even
  // resolves the request means "still pending" — return null and try later.
  if (typeof data.ResultCode === "undefined") return null;
  return { resultCode: String(data.ResultCode), resultDesc: String(data.ResultDesc ?? "") };
}

/** Daraja's TransactionDate callback field: 20260305143022 -> Date, interpreted as Africa/Nairobi (UTC+3). */
export function parseDarajaTimestamp(raw: string | number): Date {
  const s = String(raw);
  const year = Number(s.slice(0, 4));
  const month = Number(s.slice(4, 6));
  const day = Number(s.slice(6, 8));
  const hour = Number(s.slice(8, 10));
  const minute = Number(s.slice(10, 12));
  const second = Number(s.slice(12, 14));
  return new Date(Date.UTC(year, month - 1, day, hour - 3, minute, second));
}
