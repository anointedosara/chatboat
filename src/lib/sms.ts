/**
 * SMS sending abstraction.
 *
 * DEV MODE (current): the message is logged to the server console and the
 * caller is told delivery "succeeded". No real SMS is sent and no provider
 * credentials are required.
 *
 * GOING LIVE: implement the body of `sendSms` with a provider (e.g. Twilio).
 * Nothing else in the app needs to change — the OTP route already calls this.
 *
 *   Example (Twilio):
 *     import twilio from "twilio";
 *     const client = twilio(
 *       process.env.TWILIO_ACCOUNT_SID,
 *       process.env.TWILIO_AUTH_TOKEN,
 *     );
 *     await client.messages.create({
 *       to: phone,
 *       from: process.env.TWILIO_FROM_NUMBER,
 *       body: message,
 *     });
 */

export type SmsResult = { delivered: boolean };

export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  // eslint-disable-next-line no-console
  console.log(`[Chatboat SMS · dev] → +${phone}\n  ${message}`);
  return { delivered: true };
}

/** True while we are in dev mode and may safely echo the code to the client. */
export const SMS_DEV_MODE = process.env.NODE_ENV !== "production";
