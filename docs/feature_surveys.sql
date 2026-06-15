-- Table GÉNÉRIQUE des sondages in-app (réutilisable pour toute future feature).
-- À exécuter dans Supabase (SQL Editor). Même principe que `feedback` :
-- insertion anonyme via PostgREST + anon key, pas de lecture publique.
--
-- Chaque sondage est identifié par `survey_key` (ex. 'cloud_backup') et stocke
-- ses réponses dans `response` (jsonb) — la structure peut varier d'un sondage
-- à l'autre sans changer le schéma.

create table if not exists public.feature_surveys (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  survey_key      text not null,                 -- 'cloud_backup', futurs sondages...
  response        jsonb not null default '{}'::jsonb,
  currency        text,                          -- devise de l'utilisateur (MGA / EUR / USD ...)
  app_version     text,
  device_platform text,                          -- 'ios' | 'android'
  project         text                           -- 'mitsitsy'
);

-- Index pour filtrer/agréger rapidement par sondage.
create index if not exists feature_surveys_survey_key_idx
  on public.feature_surveys (survey_key);

-- Sécurité : insertion anonyme uniquement (aucune lecture publique).
alter table public.feature_surveys enable row level security;

create policy "anon can insert feature surveys"
  on public.feature_surveys
  for insert
  to anon
  with check (true);

-- Exemple de lecture des réponses du sondage cloud backup :
--   select response->>'wants_feature' as wants,
--          response->>'price_monthly' as monthly,
--          response->>'price_yearly'  as yearly,
--          response->>'sync_mode'     as mode,
--          currency, count(*)
--   from public.feature_surveys
--   where survey_key = 'cloud_backup'
--   group by 1,2,3,4,5;
