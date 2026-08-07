import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fnLoadState } from "@/lib/api.functions";
import { getInitData, getStartParam, tg } from "@/lib/telegram-client";

export function useTelegramReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const app = tg();
    app?.ready();
    app?.expand();
    setReady(true);
  }, []);
  return ready;
}

export function useAppState() {
  const ready = useTelegramReady();
  return useQuery({
    queryKey: ["state"],
    enabled: ready,
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
