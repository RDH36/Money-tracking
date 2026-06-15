-- Table GÉNÉRIQUE des sondages in-app (réutilisable pour toute future feature).
-- À exécuter dans Supabase (SQL Editor). Même principe que `feedback` :
-- insertion anonyme via PostgREST + anon key, pas de lecture publique.
--
-- Chaque sondage est identifié par `survey_key` (ex. 'cloud_backup') et stocke
-- ses réponses dans `response` (jsonb) — la structure peut varier d'un sondage
-- à l'autre sans changer le schéma.
--
-- `response` contient :
--   - items   : [{ key, question, value, answer }]  ← LISIBLE pour le back-office
--                (question + libellé de réponse, dans la langue du répondant ;
--                 `value` garde le code brut pour l'analyse)
--   - comment : avis libre éventuel (texte)

create table if not exists public.feature_surveys (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  survey_key      text not null,                 -- 'cloud_backup', futurs sondages...
  response        jsonb not null default '{}'::jsonb,
  currency        text,                          -- devise de l'utilisateur (MGA / EUR / USD ...)
  email           text,                          -- email optionnel du répondant (recontact)
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

-- Lecture LISIBLE (1 ligne par question/réponse) — idéale pour un back-office :
--   select s.created_at, s.currency, s.email,
--          item->>'question' as question,
--          item->>'answer'   as reponse
--   from public.feature_surveys s,
--        jsonb_array_elements(s.response->'items') as item
--   where s.survey_key = 'cloud_backup'
--   order by s.created_at desc;
--
-- Avis libre + email d'un répondant :
--   select email, currency, response->>'comment' as opinion, created_at
--   from public.feature_surveys
--   where survey_key = 'cloud_backup' and response->>'comment' is not null;
--
-- Analyse quantitative (compter par réponse brute), ex. prix mensuel :
--   select item->>'value' as price_monthly, count(*)
--   from public.feature_surveys s,
--        jsonb_array_elements(s.response->'items') as item
--   where s.survey_key='cloud_backup' and item->>'key'='price_monthly'
--   group by 1 order by 2 desc;
