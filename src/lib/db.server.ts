import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

/**
 * Server-side database client.
 *
 * Reads env with fallbacks so the same code works on Lovable Cloud and on a
 * self-hosted deploy (Vercel), where the variables must be added manually.
 */
function pick(...names: string[]): string | undefined {
  const env = process.env as Record<string, string | undefined>;
  for (const n of names) {
    const v = env[n];
    if (v && v.trim()) return v.trim();
  }
  return undefined;
}

function isOpaqueKey(value: string) {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function makeFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (isOpaqueKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function create() {
  const url = pick("SUPABASE_URL", "VITE_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const key = pick("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "SERVICE_ROLE_KEY");

  if (!url || !key) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!key ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
    ].join(", ");
    throw new Error(
      `Server database is not configured. Add ${missing} to your hosting environment variables (Vercel → Settings → Environment Variables) and redeploy.`,
    );
  }

  return createClient<Database>(url, key, {
    global: { fetch: makeFetch(key) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

let _db: ReturnType<typeof create> | undefined;

export const db = new Proxy({} as ReturnType<typeof create>, {
  get(_t, prop, receiver) {
    if (!_db) _db = create();
    return Reflect.get(_db, prop, receiver);
  },
});
