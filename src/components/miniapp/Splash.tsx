import { BOT_USERNAME } from "@/lib/telegram-client";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass w-full max-w-sm rounded-[2rem] px-8 py-10 text-center">{children}</div>
    </main>
  );
}

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <Shell>
      <div className="mx-auto mb-6 h-12 w-12 rounded-2xl gradient-primary animate-pulse" />
      <h1 className="text-xl font-bold tracking-tight">
        Ads <span className="text-gradient">Rewards</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{message ?? "Loading your account…"}</p>
      <div className="mt-6 flex justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </Shell>
  );
}

export function OpenInTelegram({ note }: { note?: string }) {
  return (
    <Shell>
      <div className="mx-auto mb-6 h-14 w-14 rounded-2xl gradient-primary" />
      <h1 className="text-xl font-bold tracking-tight">
        Ads <span className="text-gradient">Rewards</span>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {note ?? "This mini app runs inside Telegram. Tap below to open it."}
      </p>
      <a
        href={`https://t.me/${BOT_USERNAME}`}
        target="_blank"
        rel="noopener noreferrer"
        className="gradient-primary mt-6 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        Open in Telegram
      </a>
      <p className="mt-3 text-[11px] text-muted-foreground">@{BOT_USERNAME}</p>
    </Shell>
  );
}
