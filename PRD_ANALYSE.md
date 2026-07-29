# PRD — Écran d'analyse « Mon bilan »

> **Mitsitsy** v2.0.3 · `com.rdh36.moneytracking`
> Document de référence pour Claude Code. Une phase à la fois, validation entre chaque.
> Rédigé après lecture du repo `RDH36/Money-tracking` @ `1d31a70`.

---

## 1. Contexte

Mitsitsy enregistre et restitue. Elle ne **guide** pas. L'utilisateur voit ses revenus, ses dépenses, ses budgets — mais doit interpréter seul. Le chiffre qui dit si le mois est réussi (le taux d'épargne) n'est affiché nulle part, alors que les deux termes de la soustraction le sont.

Cette feature ajoute une **couche d'interprétation locale** : un bouton « Analyser », un moteur de règles déterministes qui lit la base SQLite existante, et un écran qui sort **3 constats maximum + 1 action exécutable en un tap**.

### Contraintes non négociables

| | |
|---|---|
| **100 % hors-ligne** | Aucun appel réseau. Aucune donnée financière ne sort du téléphone. La déclaration Play « No data collected » reste vraie. |
| **Déterministe** | Pas de LLM. Fonctions pures, testables, résultat reproductible. |
| **Zéro nouvelle donnée** | Tout se calcule sur `transactions`, `categories`, `accounts`, `budget_history`. |
| **Non moralisateur** | Les constats énoncent des faits chiffrés. Jamais « attention », « trop », « mauvais ». |
| **i18n complet** | fr / en / mg dès la première ligne. Aucune chaîne codée en dur. |

### Principe directeur

> Le conseil s'appuie toujours sur **les chiffres de l'utilisateur**, jamais sur une règle générique.
> « Épargne 20 % » ne sert à rien. « Tu as gardé 180 000 en mars, tu es à 40 000 ce mois » est actionnable, parce que c'est déjà arrivé.

### Ce qui n'est pas dans ce PRD

- Pas de score global sur 100 (arbitraire, démoralisant sur revenus faibles)
- Pas de cycle de paie personnalisé (v2 — voir §8)
- Pas de nouvelle entrée dans la tab bar (les 4 slots sont pris)

---

## 2. Phase 0 — Correctifs préalables

**À faire avant tout le reste.** Trois bugs du code actuel faussent directement les calculs sur lesquels la feature va reposer. Les corriger après coup obligerait à réécrire le moteur.

### 0.1 — `avgPerDay` divise par les mauvais jours

`hooks/useTransactionStats.ts:43`

```ts
case 'month': {
  const ms = new Date(d.getFullYear(), d.getMonth(), 1);
  const me = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: ms, end: me, days: me.getDate() };   // ← 31, toujours
}
```

Ligne 99 : `avgPerDay: totalExpenses / days`.

Pour le mois courant, la moyenne est divisée par le nombre **total** de jours du mois, pas par les jours **écoulés**. Le 29 juillet elle est sous-estimée de 6,5 % ; le 5 du mois elle est fausse d'un facteur 6.

**Correctif** — `getPeriodRange` retourne désormais deux valeurs distinctes :

```ts
function getPeriodRange(period: PeriodType, date: Date): {
  start: Date; end: Date; days: number; elapsedDays: number;
}
```

- `days` — durée totale de la période (sert aux **projections**)
- `elapsedDays` — jours réellement écoulés, borné à `days` (sert aux **moyennes**)

Pour `month` : si la période est le mois courant, `elapsedDays = new Date().getDate()`, sinon `elapsedDays = days`.
Pour `year` : même logique via le jour de l'année.
Pour `day` et `week` : `elapsedDays` calculé pareil, jamais 0 (minimum 1).

Ligne 99 devient `avgPerDay: totalExpenses / elapsedDays`.

**Vérification :** sur la capture actuelle (29 juillet, 1 743 037 dépensés), `avgPerDay` doit passer de 56 227 à 60 105.

### 0.2 — Aucun index sur `transaction_date`

`lib/database/schema.ts` — les index existants sont tous mono-colonne (`sync_status`, `created_at`, `type`, `deleted_at`, `account_id`). La colonne de filtrage de toutes les requêtes analytiques n'en a aucun.

Le moteur d'analyse lancera une douzaine d'agrégats sur plusieurs cycles à chaque appui. Sans index, chaque agrégat scanne la table.

**Migration 24** :

```sql
CREATE INDEX IF NOT EXISTS idx_tx_analysis
  ON transactions(type, transaction_date)
  WHERE deleted_at IS NULL AND transfer_id IS NULL;
```

Index partiel — il colle exactement à la clause `WHERE` utilisée partout dans `useBudgets` et le futur `lib/analysis/`.

Incrémenter `DATABASE_VERSION` à `24` dans `lib/database/migrations.ts:28` et ajouter le bloc `migrateToV24` suivant le pattern existant.

### 0.3 — Le statut budget ignore le temps

`hooks/useBudgets.ts:37`

```ts
function getBudgetStatus(percentage: number): 'green' | 'orange' | 'red' {
  if (percentage >= 100) return 'red';
  if (percentage >= 70) return 'orange';
  return 'green';
}
```

Deux problèmes :

1. **Seuil à 70 %**, alors que `FEATURES.md` documente 80 % et que les notifications (`lib/notifications.ts`) utilisent bien 80. Deux sources de vérité divergentes.
2. **La signature ne peut pas savoir quel jour on est.** Le 29 juillet, un budget à 83 % est en avance ; le 5 juillet, le même 83 % est une urgence. Les deux affichent `orange`.

**Correctif :**

```ts
export function getBudgetStatus(
  percentage: number,
  elapsedRatio: number
): 'green' | 'orange' | 'red' {
  if (percentage >= 100) return 'red';
  const projected = elapsedRatio > 0 ? percentage / elapsedRatio : percentage;
  if (projected >= 100) return 'orange';
  return 'green';
}
```

`elapsedRatio = jourActuel / joursDuMois`. Les deux appels dans le fichier (`useBudgets` ligne ~88 et `useCategoryBudget` ligne ~186) passent le ratio ; pour un mois passé, `elapsedRatio = 1`.

**Les seuils 50/80/100 des notifications ne changent pas.** Franchir un seuil est un *événement* et mérite un ping. Le dashboard affiche un *état* et doit répondre à « est-ce que je vais tenir ».

**Ajout UI** — sur la carte budget du dashboard, une ligne sous la barre :

```
Fin de mois estimée : 534 000 · dans le budget
```

avec `projected = spent / elapsedRatio`, et un repère vertical à `elapsedRatio %` sur la barre de progression.

Clés i18n : `budgets.projected`, `budgets.onTrack`, `budgets.willExceed`, `budgets.paceMarker`.

### 0.4 — Deux bricoles dans `useBudgets.ts`

- `getTimeUntilReset()` est appelé une fois dans `fetchBudgets` et sa valeur copiée dans **chaque** ligne de budget → chaîne figée qui ne s'actualise jamais, dupliquée 30 fois dans le state. La sortir du tableau, la retourner à part, l'actualiser via un `useEffect` + `setInterval` (60 s).
- Ligne 32, `` return `${days}j ${hours}h` `` — `j` et `h` codés en dur. Passer par i18n (`common.durationDaysHours` / `common.durationHoursMinutes`).

### 0.5 — La version vit à trois endroits

```
app.json           → expo.version   = "2.0.3"
package.json       → version        = "2.0.3"
constants/app.ts   → APP_VERSION    = "2.0.3"   ← celui qui pilote la pastille
```

`constants/app.ts` alimente `useWhatsNew` :

```ts
setHasNew(result?.value !== APP_VERSION);
```

Si un bump oublie ce fichier, **la pastille « Quoi de neuf » ne se déclenche jamais** et personne ne voit le changelog. Panne silencieuse, impossible à repérer sans la chercher.

**Correctif** — `expo-constants` est déjà en dépendance (`~18.0.12`) :

```ts
import Constants from 'expo-constants';

export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
```

`app.json` devient l'unique source de vérité. Le problème disparaît pour toutes les releases suivantes.

### Prompt Claude Code — Phase 0

```
Contexte : repo Money-tracking (Mitsitsy 2.0.3), Expo Router + SQLite.
Lis d'abord PRD_ANALYSE.md à la racine, section « Phase 0 ».

Applique les 4 correctifs décrits (0.1 à 0.4), dans cet ordre :

1. hooks/useTransactionStats.ts — getPeriodRange retourne elapsedDays
   en plus de days ; avgPerDay divise par elapsedDays. Traite les 4
   PeriodType. elapsedDays ne doit jamais valoir 0.

2. lib/database/schema.ts + migrations.ts — migration 24, index partiel
   idx_tx_analysis. Incrémente DATABASE_VERSION. Suis exactement le
   pattern des migrations existantes (migrateToV23).

3. hooks/useBudgets.ts — getBudgetStatus prend elapsedRatio ; logique
   de projection. Mets à jour les 2 appels. Ajoute projected au type
   BudgetData. Ne touche PAS aux seuils de lib/notifications.ts.

4. hooks/useBudgets.ts — getTimeUntilReset sorti du tableau + i18n
   des unités de durée (fr, en, mg).

5. constants/app.ts — APP_VERSION dérivé de Constants.expoConfig.version
   au lieu de la chaîne en dur.

6. Release 2.0.4 : bump app.json + package.json, entrée en tête de
   constants/changelog.ts, clés changelog.* dans fr/en/mg.
   NE TOUCHE PAS au versionCode : eas.json est en appVersionSource
   remote + autoIncrement, EAS le gère côté serveur.

Contraintes :
- Aucune migration destructive (app en production)
- Toute nouvelle chaîne passe par i18n, les 3 langues
- Ne modifie aucun composant UI dans cette phase, sauf la carte budget
  du dashboard pour la ligne « fin de mois estimée » + le repère de rythme

Quand tu as fini : liste les fichiers modifiés et montre-moi le diff de
getPeriodRange et getBudgetStatus. Ne passe pas à la phase suivante.
```

---

## 3. Phase 1 — Socle de calcul

Aucune UI. On construit les indicateurs et on les rend testables.

### Arborescence

```
lib/analysis/
  types.ts          → Cycle, Indicators, Insight, Analysis
  cycle.ts          → bornes du cycle courant et des N précédents
  indicators.ts     → les 12 calculs, fonctions pures
  queries.ts        → les requêtes SQL agrégées
```

### Notion de cycle

En v1, **le cycle = le mois calendaire** (cohérent avec `useBudgets`, `budget_history`, les rapports).

```ts
interface Cycle {
  start: string;        // ISO UTC, borne incluse
  end: string;          // ISO UTC, borne exclue
  label: string;        // '2026-07'
  totalDays: number;
  elapsedDays: number;  // = totalDays si cycle passé
  elapsedRatio: number; // elapsedDays / totalDays, dans ]0,1]
  isCurrent: boolean;
}
```

`getCurrentCycle()` et `getPreviousCycles(n)` construisent les bornes en local puis `.toISOString()` — **le pattern actuel de `getLocalMonthBounds` est correct**, le conserver tel quel.

### Les 12 indicateurs

Tous filtrent `deleted_at IS NULL AND transfer_id IS NULL`.

**Structure**

| Clé | Calcul |
|---|---|
| `savingsRate` | `(revenus − dépenses) / revenus` sur le cycle |
| `keptAmount` | `revenus − dépenses` en centimes |
| `fixedShare` | somme des dépenses récurrentes détectées ÷ revenus |
| `realDisposable` | revenus − dépenses récurrentes |
| `monthsCovered` | solde total liquide ÷ moyenne des dépenses sur 3 cycles |

**Comportement**

| Clé | Calcul |
|---|---|
| `burnSpeed` | part des dépenses tombées dans les 7 premiers jours du cycle ÷ revenus du cycle |
| `microCount` / `microTotal` | nb et somme des dépenses `< microThreshold` |
| `noSpendDays` | jours du cycle sans aucune dépense |
| `concentration` | part de la 1ʳᵉ catégorie dans les dépenses totales |

**Trajectoire**

| Clé | Calcul |
|---|---|
| `categoryDrift[]` | par catégorie : `dépense cycle / moyenne 3 cycles précédents` |
| `projectedEnd` | `dépenses / elapsedRatio` |
| `bestCycle` | cycle des 6 derniers au meilleur `savingsRate` |
| `sinceLastAnalysis` | delta des indicateurs clés depuis la dernière analyse (Phase 4) |

### Calibrage des seuils

Les seuils fixes ne conviennent pas à tous les niveaux de revenu. Sur un revenu bas, dépenser 50 % du salaire dans la semaine peut être parfaitement normal si le loyer tombe le jour de la paie.

- `microThreshold` — par défaut `revenuMensuel / 200`, plancher 1 000 Ar, arrondi au millier. Jamais une constante en dur.
- Dès que **3 cycles d'historique** existent, `burnSpeed` et `categoryDrift` se comparent à la moyenne personnelle de l'utilisateur, pas à un seuil universel.
- En dessous de 3 cycles, seuils par défaut documentés dans `indicators.ts`, et l'écran le signale (« repères provisoires, ils s'affineront »).

### Détection des dépenses récurrentes

Heuristique, dans `indicators.ts` :

> même `category_id`, montant à ±15 %, écart 25–35 jours, **au moins 3 occurrences** sur 4 cycles.

Retourne `{ categoryId, avgAmount, dayOfMonth, occurrences, confidence }`. `confidence` = `occurrences / 4`, borné à 1.

### Livrable

- `getIndicators(db, cycle): Promise<Indicators>` — un seul appel, requêtes groupées
- Aucune requête dans une boucle
- Chaque indicateur peut valoir `null` si données insuffisantes ; jamais `NaN`, jamais `Infinity` (garder les divisions par zéro)

### Prompt Claude Code — Phase 1

```
Lis PRD_ANALYSE.md, section « Phase 1 ».
La Phase 0 est validée et mergée.

Crée lib/analysis/ avec types.ts, cycle.ts, queries.ts, indicators.ts.

- Fonctions pures. Aucune dépendance React, aucun hook.
- getIndicators(db, cycle) fait le minimum de requêtes possible :
  groupe les agrégats, ne boucle jamais sur du SQL.
- Tout indicateur non calculable retourne null, jamais NaN ni Infinity.
- microThreshold est dérivé du revenu, pas une constante.
- Réutilise getLocalMonthBounds de useBudgets comme modèle pour les
  bornes de cycle (le comportement timezone actuel est correct).

Aucun composant, aucun écran, aucune chaîne i18n dans cette phase.

Quand tu as fini : montre-moi types.ts en entier et la signature de
chaque fonction exportée. Ne passe pas à la phase suivante.
```

---

## 4. Phase 2 — Moteur de règles et scoring

### Structure

```
lib/analysis/
  rules/
    index.ts
    burnSpeed.ts
    microSpending.ts
    fixedCosts.ts
    categoryDrift.ts
    bestCycle.ts
    projection.ts
    savingsRate.ts
    noSpendStreak.ts
  score.ts
```

### Contrat d'une règle

```ts
type Rule = (i: Indicators, cycle: Cycle) => Insight | null;

interface Insight {
  id: string;
  severity: 'info' | 'watch' | 'urgent';
  weight: number;            // 0–100, calculé par la règle
  titleKey: string;          // clé i18n
  params: Record<string, number | string>;  // valeurs injectées
  evidence: string;          // le calcul, affiché en clair
  action?: InsightAction;
}

interface InsightAction {
  type: 'createBudget' | 'createPlanification' | 'createTransfer' | 'openScreen';
  labelKey: string;
  payload: Record<string, unknown>;
}
```

**Le champ `evidence` est obligatoire.** Chaque constat doit montrer son calcul — « 500 000 ÷ 29 jours × 31 » — pour que l'utilisateur puisse le vérifier. Un verdict opaque ne sera jamais suivi.

### Scoring

`score.ts` évalue toutes les règles, puis :

1. Écarte les `Insight` déjà rejetés récemment (table `analysis_dismissed`, fenêtre 60 jours)
2. Trie par `weight` décroissant
3. Garde **3 constats maximum**
4. Garde **1 seule action** — celle du constat de plus fort poids qui en propose une

Si moins de 2 constats se déclenchent, l'écran bascule en mode « mois calme » : on affiche le taux d'épargne, la comparaison au meilleur cycle, et rien d'autre. Un mois sans problème est une information, pas un échec de la feature.

### Ton des messages

| Interdit | À la place |
|---|---|
| « Attention, tu dépenses trop » | « 42 % de ton revenu dépensé en 6 jours » |
| « Mauvais mois » | « 3 % gardés · ton meilleur cycle : 15 % » |
| « Tu devrais… » | « Mettre 120 000 de côté le jour de la paie » |

Les constats énoncent des faits chiffrés et laissent l'utilisateur conclure. Aucun superlatif, aucun point d'exclamation, aucun emoji.

### Actions exécutables

Chaque action doit s'exécuter **en un tap**, sans quitter l'écran, en réutilisant l'existant :

| Type | Réutilise |
|---|---|
| `createBudget` | `hooks/useBudgets` → `budget_limit` sur la catégorie |
| `createPlanification` | `hooks/usePlanifications` → crée planif + items |
| `createTransfer` | `hooks/useAccounts` → transfert entre comptes |
| `openScreen` | `expo-router` |

Après exécution : `useDataRefreshStore.getState().bumpAll()`, feedback inline sur la carte, pas de navigation.

Une analyse qui se termine par un conseil que l'utilisateur doit aller appliquer ailleurs ne sera jamais appliquée.

### Prompt Claude Code — Phase 2

```
Lis PRD_ANALYSE.md, section « Phase 2 ».
Phases 0 et 1 validées.

Crée lib/analysis/rules/ (8 règles) et lib/analysis/score.ts.

- Une règle = une fonction pure (Indicators, Cycle) => Insight | null
- Chaque Insight porte un champ evidence lisible montrant le calcul
- score.ts retourne au maximum 3 constats et 1 action
- Ajoute les clés i18n dans fr.json, en.json, mg.json sous analysis.*
- Ton descriptif, jamais moralisateur : relis le tableau du PRD avant
  d'écrire les libellés

Toujours aucune UI dans cette phase.

Quand tu as fini : montre-moi score.ts, une règle représentative
(burnSpeed), et la liste des clés i18n ajoutées.
```

---

## 5. Phase 3 — Écran et point d'entrée

### Point d'entrée

**Pas de nouvel onglet** — les 4 slots visibles sont pris (`index`, `simulation`, `history`, `settings` ; `add` est le `+` central, `achievements` a `href: null`).
**Pas de bulle flottante** — le `+` noir occupe déjà cette zone, et deux éléments flottants font perdre l'action principale.

**Carte pleine largeur sur le dashboard, juste sous le hero.** Un tap depuis l'écran par défaut, on ne fera pas plus rapide.

Elle ne s'affiche **que** si une analyse est pertinente :

```
si (cycle terminé non analysé) OU (≥ 25 jours depuis la dernière analyse)
   ET (≥ 1 cycle complet de données OU ≥ 30 transactions)
```

Sinon la carte disparaît et Streak/Niveau remontent. Une carte permanente redevient du décor en trois jours.

Entrée secondaire : bouton en bas de `app/reports.tsx` — « Que disent ces chiffres ? ». L'utilisateur qui regarde ses chiffres bruts est exactement celui qui veut une interprétation.

### Ajout au hero

Le hero affiche `income` et `expenses` mais pas leur différence — le seul nombre qui dit si le mois est réussi. Remplacer la ligne par :

```
GARDÉ CE MOIS        TAUX D'ÉPARGNE
+356 963             17 %
```

Vert si positif, rouge si négatif. Clés : `dashboard.kept`, `dashboard.savingsRate`.

### Écran `app/analysis.tsx`

Écran secondaire (pattern de `reports.tsx`), pas un onglet.

```
┌──────────────────────────────┐
│  Bubule — animation 2 s      │   skippable au tap
└──────────────────────────────┘

Ce cycle, tu as gardé
356 963 Ar sur 2 100 000 — 17 %
Ton meilleur cycle : 24 % (mars)

── CE QUI PÈSE ─────────────────
1. 247 petites dépenses    310 000
   500 000 ÷ 29 j × 31
2. Restaurants  +65 % vs habitude
3. 6 dépenses fixes = 52 % du revenu

── À FAIRE MAINTENANT ──────────
Bloquer 120 000 le jour de la paie
[ Créer le virement automatique ]
```

- Animation Bubule 2 s max, skippable, **jamais bloquante**
- Constats révélés en cascade (`react-native-reanimated`, déjà présent)
- Le bloc action est le seul élément accentué de l'écran
- Bouton discret « Ce constat ne m'aide pas » → `analysis_dismissed`

### Garde-fous

- **Blocage si données insuffisantes** — afficher « Encore 12 jours de données et ton premier bilan sera prêt » plutôt qu'une analyse creuse. Une première analyse fausse tue la confiance définitivement.
- **Fréquence limitée** — une analyse par semaine maximum. Si le résultat est identique à cinq minutes d'intervalle, la feature paraît cassée.
- **Pas de score sur 100** — comparer l'utilisateur à son propre passé, jamais à un idéal.

### Prompt Claude Code — Phase 3

```
Lis PRD_ANALYSE.md, section « Phase 3 ».
Phases 0 à 2 validées.

1. app/analysis.tsx — nouvel écran secondaire, pattern de reports.tsx
2. hooks/useAnalysis.ts — orchestre cycle → indicators → score
3. components/ — carte d'entrée sur le dashboard, cartes de constat,
   bloc action
4. app/(tabs)/index.tsx — carte d'entrée conditionnelle sous le hero,
   + ligne « gardé ce mois / taux d'épargne » dans le hero
5. app/reports.tsx — bouton d'entrée secondaire en bas

Respecte le design system existant (Gluestack + NativeWind, tokens de
tailwind.config.js, ThemeContext). L'écran doit fonctionner avec les
11 thèmes et en mode sombre.

Animation Bubule : 2 s max, skippable au tap, jamais bloquante.
Les 3 langues, aucune chaîne en dur.

Release 2.1.0 : suis la checklist du PRD, section « Releases ».

Quand tu as fini : liste les fichiers créés et donne-moi les commandes
adb pour tester sur Redmi Note 8 Pro.
```

---

## 6. Phase 4 — Historique et boucle de progression

C'est la phase qui transforme un outil de diagnostic en **boucle comportementale**. Sans elle, chaque analyse répète la précédente.

### Migration 25

```sql
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  cycle_label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  indicators_json TEXT NOT NULL,
  insight_ids TEXT NOT NULL,
  action_type TEXT,
  action_applied_at TEXT
);

CREATE TABLE IF NOT EXISTS analysis_dismissed (
  insight_id TEXT PRIMARY KEY,
  dismissed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analyses_created
  ON analyses(created_at DESC);
```

### Ce que ça débloque

La deuxième analyse ne dit plus la même chose que la première :

> Depuis ta dernière analyse (il y a 32 jours), tu as suivi le conseil
> sur les petites dépenses.
> **310 000 → 190 000 Ar.** Tu as gardé 120 000 de plus ce mois.

Voir que ce qu'on a fait a marché, c'est ce qui change un comportement. Aucun dashboard passif ne peut produire cette phrase : il n'a jamais rien recommandé à un instant précis.

### Branchements

- **Sauvegarde** — ajouter `analyses` et `analysis_dismissed` aux tables exportées dans `lib/backup/serialize.ts` et `deserialize.ts`, et incrémenter la version du format `.mitsitsy`. **Ne pas oublier**, sinon un changement de téléphone efface l'historique de progression.
- **Gamification** — XP à chaque analyse, badge « 6 bilans mensuels », quête « appliquer 3 actions ». Suivre le pattern de `lib/gamification/badgeConditions.ts`.
- **Notifications** — un rappel en fin de cycle, « ton bilan est prêt ». Un seul, via `lib/notifications.ts`.

### Prompt Claude Code — Phase 4

```
Lis PRD_ANALYSE.md, section « Phase 4 ».
Phases 0 à 3 validées.

1. Migration 25 : tables analyses + analysis_dismissed + index.
   DATABASE_VERSION passe à 25. Non destructif.
2. Persistance d'une analyse à chaque génération.
3. Comparaison avec l'analyse précédente → bloc « depuis la dernière
   fois » en tête de l'écran quand une analyse antérieure existe.
4. lib/backup/ : ajoute les 2 tables à l'export ET à l'import,
   incrémente la version du format .mitsitsy, garde la
   rétro-compatibilité avec les sauvegardes existantes.
5. Gamification : XP par analyse, badge 6 bilans, quête 3 actions.
6. Notification de fin de cycle, une seule.

Le point 4 est le plus risqué : montre-moi le diff de serialize.ts et
deserialize.ts en premier, avant le reste.

Release 2.2.0 : suis la checklist du PRD, section « Releases ».
```

---

## 7. Récapitulatif

| Phase | Contenu | Fichiers | Release |
|---|---|---|---|
| **0** | Correctifs `avgPerDay`, index, statut budget, i18n durée, `APP_VERSION` | 6 | **2.0.4** |
| **1** | `lib/analysis/` — cycle, indicateurs, requêtes | 4 créés | — |
| **2** | Règles + scoring + i18n | 10 créés, 3 modifiés | — |
| **3** | Écran, carte d'entrée, hero | 5–7 | **2.1.0** |
| **4** | Historique, backup, gamification, notif | 8 | **2.2.0** |

Phase 0 en premier, sans exception : les trois bugs corrigés faussent les calculs sur lesquels tout le reste repose.

---

## 8. Releases

### Trois livraisons, pas une

| Version | Type | Contenu |
|---|---|---|
| **2.0.4** | patch | Phase 0 seule |
| **2.1.0** | minor | Phases 1–3 — l'analyse fonctionne, sans persistance |
| **2.2.0** | minor | Phase 4 — historique, boucle, gamification |

**La Phase 0 part seule et vite.** Une cinquantaine de lignes, aucune nouvelle surface UI, et elle corrige un signal actuellement faux pour tous les utilisateurs dans la seconde moitié de chaque mois. Aucune raison de la retenir derrière une feature de plusieurs semaines. Bénéfice secondaire : si la logique de rythme a un cas limite, il se trouve sur une release de 6 fichiers plutôt que noyé dans une de trente.

**La coupure 2.1.0 / 2.2.0 est nette** parce que la migration 25 appartient à la Phase 4 : les phases 1 à 3 ne persistent rien. On livre une analyse qui marche, on observe si les gens appuient sur le bouton, on construit la boucle ensuite.

*Note semver* — le correctif 0.3 modifie un comportement visible (orange → vert). Au sens strict ça se discuterait, mais c'est une correction de bug : patch. Le décrire explicitement dans le changelog pour que ça ne passe pas pour une régression.

### Checklist de bump

1. `app.json` → `expo.version`
2. `package.json` → `version`
3. `constants/changelog.ts` → nouvelle entrée **en tête** du tableau, avec ses clés i18n
4. `lib/i18n/translations/{fr,en,mg}.json` → les clés `changelog.*` correspondantes
5. `DATABASE_VERSION` — **indépendant de la version d'app**, ne bouge qu'avec une migration (24 en 2.0.4, 25 en 2.2.0)

`constants/app.ts` disparaît de cette liste dès que le correctif 0.5 est appliqué.

**Le point 4 est celui qu'on oublie.** Une clé manquante en malgache et l'écran « Quoi de neuf » affiche la clé brute.

### Ce à quoi on ne touche pas

`eas.json` est en `appVersionSource: "remote"` avec `autoIncrement: true` — EAS gère le `versionCode` Android côté serveur. C'est pourquoi il n'apparaît nulle part dans `app.json`. **Ne jamais l'ajouter à la main**, cela créerait un conflit avec le compteur distant.

### Dette : `CHANGELOG.md`

Le fichier s'arrête à **1.1.0** alors que l'app est en **2.0.3** — quatre releases non documentées. Le changelog vivant est `constants/changelog.ts`.

Trancher : le régénérer depuis `constants/changelog.ts`, ou le supprimer. Un changelog périmé à la racine est pire que pas de changelog. Les dates y sont par ailleurs incohérentes (1.1.0 daté 2026-03-03, 1.0.6 daté 2025-02-26 — les 1.0.x sont probablement des 2026).

---

## 9. Hors périmètre — pistes v2

- **Cycle de paie détecté** — repérer un revenu récurrent (montant ±10 %, ~30 j, 3 occurrences) et faire commencer le cycle au jour de paie. Quelqu'un payé le 28 vit du 28 au 27 ; aujourd'hui tous les calculs coupent son cycle en deux. C'est la plus grosse amélioration de justesse possible, mais elle touche budgets, rapports et calendrier — un chantier à part entière.
- **Reste à vivre du jour** — un seul chiffre en haut du dashboard : ce qu'on peut dépenser aujourd'hui sans casser le mois, avec report du non-dépensé sur le lendemain.
- **Répartition à la saisie du revenu** — bottom sheet de découpage en enveloppes quand un revenu est enregistré.

---

## 10. Points de vigilance

**Vérifier la complétude des données avant de se fier aux constats.** Sur le device de test, le compte Cash est à 0 et Mvola à 434 Ar — tout passe par Bank. Si les utilisateurs réels font pareil, les dépenses en espèces ne sont pas saisies et l'analyse portera sur une image partielle. Regarder dans PostHog la répartition des transactions par type de compte avant de construire dessus, et envisager un constat dédié : « aucune dépense en espèces enregistrée ce cycle ».

**Les seuils sont des repères, pas des vérités.** Formuler les constats comme des observations, jamais comme des lignes à ne pas franchir.

**Une seule action par analyse.** La tentation sera d'en proposer plusieurs puisque le moteur en calcule douze. Y résister : la difficulté n'est pas de calculer, c'est de choisir lequel mérite d'être dit ce mois-ci.
