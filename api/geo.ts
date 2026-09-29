export const config = { runtime: "edge" };

/** Visitor country hint from Vercel's edge geo header; the PHP API does the final currency pick. */
export default function handler(request: Request): Response {
  const raw = (request.headers.get("x-vercel-ip-country") ?? "").trim().toUpperCase();
  const country = /^[A-Z]{2}$/.test(raw) && raw !== "XX" ? raw : null;
  return new Response(JSON.stringify({ country }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, max-age=3600",
      Vary: "x-vercel-ip-country",
    },
  });
}
