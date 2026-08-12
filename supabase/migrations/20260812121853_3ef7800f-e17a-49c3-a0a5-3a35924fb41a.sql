ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS ad_reward_adr_min numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS ad_reward_adr_max numeric NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS ref_reward_adr_min numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS ref_reward_adr_max numeric NOT NULL DEFAULT 150;

UPDATE public.tasks SET reward = GREATEST(round(reward * 6667), 10) WHERE reward < 5;