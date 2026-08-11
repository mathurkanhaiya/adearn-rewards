import { createFileRoute } from "@tanstack/react-router";

import { sendDailyReport } from "@/lib/games.server";

async function run(request: Request) {
  const key = request.headers.get("apikey") ?? "";
  const expected = process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
  if (!expected || key !== expected) return new Response("Unauthorized", { status: 401 });
  try {
    const result = await sendDailyReport();
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/cron/daily-report")({
  server: {
    handlers: {
      POST: async ({ request }) => run(request),
      GET: async ({ request }) => run(request),
    },
  },
});
