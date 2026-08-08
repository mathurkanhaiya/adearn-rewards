import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fnLoadState } from "@/lib/api.functions";
import { getInitData, getStartParam, tg, waitForTelegram } from "@/lib/telegram-client";

export type TgEnv = "checking" | "telegram" | "browser";

/** Boots the Telegram WebApp SDK and reports whether we're really inside Telegram. */
export function useTelegramEnv(): TgEnv {
  const [env, setEnv] = useState<TgEnv>("checking");

  useEffect(() => {
    let alive = true;
    void (async () => {
      const ok = await waitForTelegram();
      const app = tg();
      app?.ready();
      app?.expand();
      if (!alive) return;
      // In dev preview there is no Telegram host; the server allows a preview session.
      setEnv(ok || import.meta.env.DEV ? "telegram" : "browser");
    })();
    return () => {
      alive = false;
    };
  }, []);

  return env;
}

export function useAppState(enabled = true) {
  return useQuery({
    queryKey: ["state"],
    enabled,
    retry: 1,
    queryFn: async () =>
      fnLoadState({ data: { initData: getInitData(), startParam: getStartParam() } }),
  });
}

export function useRefreshState() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["state"] });
  };
}
