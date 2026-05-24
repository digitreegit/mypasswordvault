export const config = {
  runtime: "edge",
};

type IpWhoPayload = {
  success?: boolean;
  city?: string;
  region?: string;
  country?: string;
  message?: string;
};

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || null;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (request.method !== "GET") {
    return json({ success: false, message: "Method not allowed" }, 405);
  }

  const ip = clientIp(request);
  const upstream = ip
    ? `https://ipwho.is/${encodeURIComponent(ip)}`
    : "https://ipwho.is/";

  try {
    const res = await fetch(upstream, {
      headers: { Accept: "application/json" },
    });
    const data = (await res.json()) as IpWhoPayload;
    return json(data, res.ok ? 200 : res.status);
  } catch {
    return json({ success: false, message: "Geo lookup failed" }, 502);
  }
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(body: IpWhoPayload, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
    },
  });
}
