
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS adr_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adr_earned numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS energy numeric NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS energy_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS games_day date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS spins_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spin_extra integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scratch_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS scratch_extra integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS taps_today integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS login_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login date,
  ADD COLUMN IF NOT EXISTS usdt_withdrawn numeric NOT NULL DEFAULT 0;

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS adr_rate numeric NOT NULL DEFAULT 0.00015,
  ADD COLUMN IF NOT EXISTS min_swap_adr numeric NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS tap_reward numeric NOT NULL DEFAULT 0.1,
  ADD COLUMN IF NOT EXISTS energy_max integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS energy_regen_sec integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS game_min numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS game_max numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS free_spins integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS free_scratch integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_extra_spins integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_extra_scratch integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS login_reward numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '{"spin":true,"scratch":true,"tap":true,"promo":true,"daily":true,"contest":true,"tasks":true,"ads":true}'::jsonb;

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'adr',
  amount numeric NOT NULL DEFAULT 0,
  max_uses integer NOT NULL DEFAULT 0,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promo_id, player_id)
);
GRANT ALL ON public.promo_redemptions TO service_role;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  metric text NOT NULL DEFAULT 'invites',
  reward_type text NOT NULL DEFAULT 'adr',
  reward_amount numeric NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.contests TO service_role;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.game_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  game text NOT NULL,
  reward numeric NOT NULL DEFAULT 0,
  doubled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.game_plays TO service_role;
ALTER TABLE public.game_plays ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_game_plays_created ON public.game_plays (created_at);

CREATE TABLE IF NOT EXISTS public.daily_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT CURRENT_DATE,
  streak integer NOT NULL DEFAULT 1,
  reward numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, day)
);
GRANT ALL ON public.daily_logins TO service_role;
ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;
