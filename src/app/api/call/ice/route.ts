/**
 * Returns ICE servers for WebRTC. Uses Twilio's Network Traversal Service
 * (STUN + TURN) when Twilio credentials are present — TURN makes calls connect
 * across restrictive NATs. Falls back to public Google STUN otherwise (works on
 * many but not all networks).
 */

const PUBLIC_STUN = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

export async function GET() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (sid && token) {
    try {
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Tokens.json`,
        { method: "POST", headers: { Authorization: `Basic ${auth}` } },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          ice_servers?: { url?: string; urls?: string; username?: string; credential?: string }[];
        };
        const iceServers = (data.ice_servers ?? []).map((s) => ({
          urls: s.urls ?? s.url ?? "",
          username: s.username,
          credential: s.credential,
        }));
        if (iceServers.length) {
          return Response.json({ iceServers });
        }
      }
    } catch {
      // fall through to public STUN
    }
  }

  return Response.json({ iceServers: PUBLIC_STUN });
}
