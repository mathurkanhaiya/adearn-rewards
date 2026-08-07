
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tg_id bigint NOT NULL UNIQUE,
  username text,
  first_name text,
  photo_url text,
  balance numeric(14,5) NOT NULL DEFAULT 0,
  total_earned numeric(14,5) NOT NULL DEFAULT 0,
  referral_earned numeric(14,5) NOT NULL DEFAULT 0,
  ads_watched_total integer NOT NULL DEFAULT 0,
  ads_watched_today integer NOT NULL DEFAULT 0,
  ads_day date NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed integer NOT NULL DEFAULT 0,
  referrals_count integer NOT NULL DEFAULT 0,
  referred_by bigint,
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'channel',
  link text NOT NULL,
  chat_username text,
  reward numeric(14,5) NOT NULL DEFAULT 0,
  user_limit integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  is_live boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  reward numeric(14,5) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, player_id)
);
GRANT ALL ON public.task_completions TO service_role;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ad_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  reward numeric(14,5) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ad_views_player_idx ON public.ad_views(player_id, created_at DESC);
GRANT ALL ON public.ad_views TO service_role;
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  bonus numeric(14,5) NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_id)
);
CREATE INDEX referrals_referrer_idx ON public.referrals(referrer_id, created_at DESC);
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  amount numeric(14,5) NOT NULL,
  fee numeric(14,5) NOT NULL DEFAULT 0.05,
  net_amount numeric(14,5) NOT NULL,
  method text NOT NULL,
  address text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX withdrawals_status_idx ON public.withdrawals(status, created_at DESC);
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  kind text NOT NULL,
  amount numeric(14,5) NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_player_idx ON public.transactions(player_id, created_at DESC);
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.app_settings (
  id integer PRIMARY KEY DEFAULT 1,
  ad_reward_min numeric(14,5) NOT NULL DEFAULT 0.001,
  ad_reward_max numeric(14,5) NOT NULL DEFAULT 0.005,
  ref_reward_min numeric(14,5) NOT NULL DEFAULT 0.005,
  ref_reward_max numeric(14,5) NOT NULL DEFAULT 0.01,
  commission_rate numeric(6,4) NOT NULL DEFAULT 0.35,
  min_withdraw numeric(14,5) NOT NULL DEFAULT 0.15,
  withdraw_fee numeric(14,5) NOT NULL DEFAULT 0.05,
  req_referrals integer NOT NULL DEFAULT 3,
  req_tasks integer NOT NULL DEFAULT 5,
  req_daily_ads integer NOT NULL DEFAULT 15,
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.app_settings (id) VALUES (1);
