# PRD — Mitsitsy : « Mon bilan » (Partie I) et « Pilote » (Partie II)

> **Mitsitsy** v2.0.3 · `com.rdh36.moneytracking`
> Document de référence pour Claude Code. Une phase à la fois, validation entre chaque.
> Rédigé après lecture du repo `RDH36/Money-tracking` @ `1d31a70`.

---

# Partie I — Écran d'analyse « Mon bilan »

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
- Pas de cycle de paie personnalisé **en Partie I** — c'est la Phase 7 de la Partie II (§9)
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

## 7. Phase 5 — Analyse multi-cycles

### Constat de départ

Le PRD actuel analyse **un seul cycle** ; les précédents ne servent que de contexte (`bestCycle`, `categoryDrift`). Un mois isolé ne dit rien : un dépassement en juillet peut être un accident, une saison ou une habitude — et les trois appellent des réponses opposées. Ce qui porte une valeur de conseil, c'est ce qui **se répète**. La Phase 5 fait passer le moteur de « ce mois » à « ton comportement ».

### Nouveau contrat

Une règle historique lit plusieurs cycles à la fois :

```ts
type HistoryRule = (h: HistoryIndicators, cycles: Cycle[]) => Insight | null
```

`getHistoryIndicators(db, cycles)` agrège **N cycles en une seule passe**.

> **Piège à éviter, explicitement.** Ne JAMAIS appeler `getIndicators` en boucle sur 6 cycles : chaque appel fait ~7 requêtes, soit **42 requêtes** pour un seul écran. On agrège les N cycles dans **un seul `GROUP BY strftime('%Y-%m', transaction_date)`** (ou des sommes conditionnelles par bornes locales, comme `fetchMonthlyTotals` en Phase 1). Le même index partiel `idx_tx_analysis` reste exploité : filtre `deleted_at IS NULL AND transfer_id IS NULL`, `type IN (...)` pour garder le seek d'index.

### Trois règles historiques

| Règle | Déclenche quand | Message (exemple) |
|---|---|---|
| `recurringOverrun` | un même budget dépassé sur ≥ 60 % des cycles, min. 4 cycles | « Sur 6 cycles, tu dépasses Nourriture 5 fois, dépassement moyen 78 000. » |
| `savingsTrend` | pente du taux d'épargne **significative**, min. 4 cycles | « Ton taux d'épargne baisse depuis 4 cycles : 18 % → 9 %. » |
| `seasonality` | un cycle historiquement plus dépensier approche, min. 12 cycles | « Décembre est ton cycle le plus dépensier depuis 2 ans (+34 % vs ta moyenne). Il commence dans 12 jours. » |

**1. `recurringOverrun` — dépassements répétés d'un même budget.**
Action : **ajuster le budget à la dépense réelle médiane**. Point non négociable : l'action est d'**augmenter** le budget, pas de gronder. Un budget systématiquement dépassé n'est pas un problème de discipline, c'est un **budget faux** — la donnée dit que le plafond ne correspond pas à la vie de l'utilisateur. Seuil : dépassé sur **≥ 60 % des cycles**, minimum **4 cycles** d'historique. En dessous, se taire.

**2. `savingsTrend` — régression linéaire du taux d'épargne.**
Calcule la pente sur N cycles et affiche **la série, la moyenne et la pente**. N'affiche une direction (hausse / baisse) **que si la pente est significative**, au-dessus du bruit du nuage. Si le nuage est plat ou dispersé, dire « **pas de tendance nette** » plutôt que d'inventer une direction : une fausse tendance est pire que pas de tendance. Minimum **4 cycles**.

**3. `seasonality` — cycle dépensier récurrent qui approche.**
Compare chaque mois calendaire à la moyenne personnelle sur ≥ 2 ans, et ne se déclenche qu'à **l'approche** (quelques semaines) d'un mois historiquement au-dessus. Minimum **12 cycles** — donc réservé aux utilisateurs anciens. Se taire pour tous les autres : mieux vaut ne rien dire que d'extrapoler une saisonnalité sur 3 mois de données.

### Scoring

Le scoring **mélange** règles de cycle (Phase 2) et règles d'historique (Phase 5). À poids égal, **priorité aux constats historiques** : « tu dépasses ce budget 5 mois sur 6 » pèse plus qu'une dérive ponctuelle, parce qu'un fait répété est plus solide qu'un fait isolé. Le reste ne bouge pas : toujours **3 constats maximum et 1 action**.

### Séquencement

La Phase 5 vient **après la 2.2.0 livrée et observée**, en **release 2.3.0**. Deux raisons :

- La Phase 4 apporte déjà `sinceLastAnalysis`, une **première forme de comparaison temporelle**. Il faut voir comment elle est accueillie avant d'empiler une couche multi-cycles par-dessus.
- Il ne sert à rien de construire une troisième couche d'analyse sur une feature **dont le bouton n'a pas encore été appuyé par un utilisateur réel**. On livre, on observe l'usage, on décide ensuite.

### Prérequis technique (bénéfice secondaire)

Le **calibrage personnel des seuils**, noté en fin de Phase 2, devient possible ici. `HistoryIndicators` expose l'historique **par cycle** : `burnSpeed` et `categoryDrift` peuvent enfin se comparer à la **moyenne personnelle** de l'utilisateur plutôt qu'à un seuil universel. Ce qui était un « seuil par défaut documenté » en Phase 2 devient un repère calibré sur le comportement réel — sans requête supplémentaire, puisque l'agrégat multi-cycles est déjà calculé.

### Prompt Claude Code — Phase 5

```
Lis PRD_ANALYSE.md, section « Phase 5 ».
Phases 0 à 4 validées, livrées (2.2.0) et observées.

Crée lib/analysis/history/ :
- historyIndicators.ts → getHistoryIndicators(db, cycles) EN UNE PASSE
  (un seul GROUP BY strftime, jamais getIndicators en boucle sur les cycles)
- rules/ → recurringOverrun, savingsTrend, seasonality
- intègre les règles d'historique au scoring existant (score.ts), avec
  priorité aux constats historiques à poids égal.

- Une règle historique = (HistoryIndicators, Cycle[]) => Insight | null
- savingsTrend n'affiche une direction que si la pente est significative,
  sinon « pas de tendance nette »
- seasonality se tait sous 12 cycles ; recurringOverrun/savingsTrend sous 4
- recurringOverrun propose d'AUGMENTER le budget à la médiane réelle
- Câble le calibrage personnel de burnSpeed/categoryDrift sur l'historique
- i18n analysis.* (fr/en/mg), params injectés, ton factuel

Release 2.3.0 : suis la checklist de la section « Releases ».

Quand tu as fini : montre-moi getHistoryIndicators et le SQL de son agrégat,
puis la règle recurringOverrun.
```

---

## 8. Phase 6 — Objectif, intentions et budgets (analyse à la demande)

> **Priorité : avant la Phase 5.** Retour propriétaire (août 2026) : l'analyse
> doit couvrir dépenses + revenus + **budgets**, se lancer **à volonté avec une
> raison**, et connaître le **but** de l'utilisateur pour donner des conseils
> utiles. La Phase 5 (multi-cycles) passe après — un moteur qui ne répond pas à
> la question que l'utilisateur se pose aujourd'hui n'a pas besoin de plus
> d'historique, il a besoin de contexte.

### Constat de départ

Le moteur actuel énonce des faits justes mais génériques. Trois manques :

1. **Les budgets sont invisibles.** Aucune règle ne lit `budget_limit` ni
   `budget_history` — alors que c'est la seule donnée où l'utilisateur a déjà
   exprimé une intention (« je ne veux pas dépasser X en nourriture »).
2. **Le but de l'utilisateur est inconnu.** « 17 % d'épargne » n'est ni bien ni
   mal dans l'absolu ; c'est bien si l'objectif est 10 %, insuffisant s'il est
   30 %. Sans but, pas de conseil — seulement des observations.
3. **L'analyse est un événement, pas un outil.** On la subit une fois par cycle
   au lieu de la consulter quand une question se pose.

### L'objectif utilisateur (le « but »)

Demandé à la **première ouverture** de « Mon bilan » (3 choix + montant le cas
échéant), modifiable depuis l'écran ensuite. Stocké dans `settings`
(`analysis_goal`, `analysis_goal_param`) — donc exporté dans le backup sans
travail supplémentaire.

| Goal | Question | Param |
|---|---|---|
| `saveAmount` | « Mettre de côté chaque mois » | montant cible (centimes) |
| `keepBudgets` | « Tenir mes budgets » | — |
| `understand` | « Comprendre où va mon argent » | — |

Effet : le but ajoute une **règle dédiée** et repondère le scoring.
`saveAmount` active `goalGap` : « Objectif 200 000/mois · ce cycle : 120 000
(60 %) » → action : virement du reliquat. `keepBudgets` monte le poids des
règles budget. `understand` laisse le scoring neutre.

### Les intentions (la « raison » du lancement)

En tête de l'écran, une rangée de chips — « Tu regardes pourquoi ? » :

| Intention | Libellé | Règles favorisées (+30 poids) |
|---|---|---|
| `overview` (défaut) | Vue d'ensemble | — (scoring neutre) |
| `overspend` | « Je dépense trop ? » | burnSpeed, microSpending, categoryDrift, projection |
| `budgets` | « Où en sont mes budgets ? » | budgetOverrun, budgetUnused |
| `savings` | « Épargner plus » | savingsRate, goalGap, fixedCosts |

Changer d'intention **re-score sans requête** (les indicateurs sont déjà en
mémoire) : l'utilisateur peut relancer l'analyse autant qu'il veut, chaque
raison donne un angle différent. La limite « 1/semaine » ne concerne QUE la
persistance et l'XP — jamais la consultation.

### Deux règles budget (le manquant)

1. **`budgetOverrun`** — budgets dépassés ou en trajectoire de dépassement
   (réutilise `projected` / `elapsedRatio` de la Phase 0). « Nourriture :
   420 000 dépensés sur 400 000 » ou « à ce rythme, dépassé le 24 ». Action :
   voir la catégorie, ou relever le budget à la projection.
2. **`budgetUnused`** — budget très sous-utilisé en fin de cycle (« Loisirs
   utilisé à 12 % — un plafond jamais approché ne protège rien »). Action :
   abaisser le budget au réalisé + marge.

Les indicateurs gagnent un bloc `budgets[]` (limite, dépensé, projeté, statut
par catégorie) calculé en une requête (jointure `categories`/`budget_history`
déjà écrite dans useBudgets — la reprendre côté `lib/analysis/queries.ts`).

### Rejet réversible

« Ce constat ne m'aide pas » masque 60 jours — sans annulation possible,
l'utilisateur qui explore vide son bilan sans comprendre (vécu en test).
Ajouter : après rejet, la carte se réduit en une ligne « Constat masqué ·
Annuler » pendant la session.

### Ce qui ne change pas

Fonctions pures, evidence obligatoire, 3 constats max, 1 action, ton factuel,
i18n ×3, aucune requête en boucle. Le moteur reste déterministe — le but et
l'intention ne font que **pondérer** des règles existantes et en ajouter trois.

### Prompt Claude Code — Phase 6

```
Lis PRD_ANALYSE.md, section « Phase 6 ».
Phases 0 à 4 livrées (2.2.0). La Phase 5 attendra la 2.4.0.

1. lib/analysis/queries.ts : bloc budgets[] (une requête).
2. Règles budgetOverrun + budgetUnused + goalGap (goal saveAmount).
3. score.ts : scoreInsights(indicators, cycle, dismissedIds, opts) avec
   opts = { intent, goal } — bonus de poids +30 aux règles favorisées.
4. app/analysis.tsx : chips d'intention (re-score local, pas de requête),
   question du but à la première ouverture (modifiable ensuite),
   rejet réversible (« Annuler » en session).
5. settings : analysis_goal / analysis_goal_param.
6. i18n fr/en/mg. Release 2.3.0.

Quand tu as fini : montre-moi la règle budgetOverrun, la signature de
scoreInsights, et une capture des chips d'intention.
```

---

# Partie II — Mitsitsy Pilote : finir le cycle dans le vert

> Pivot d'août 2026, après test des phases 0–6 sur données réelles. Le but de
> l'app n'a jamais été « un écran de bilan » : c'est **un petit agent qui aide à
> garder le contrôle de son argent, quel que soit le revenu, pour ne pas finir
> rouge** — adossé à la saisie rapide (Mitsitsy = mettre de côté). Le bilan est
> un miroir : il parle après. Il faut un GPS : il parle pendant, au moment où
> l'argent sort.

### Le diagnostic qui impose ce pivot

| Constat (données réelles, 5 mois) | Conséquence |
|---|---|
| L'app découpe tout au **mois calendaire** alors que la paye tombe le 28 | Un cycle de vie réel (28 → 27) est coupé en deux ; budgets, rapports, « gardé ce mois » sont faux pour la moitié des utilisateurs |
| Le revenu n'est pas saisi certains mois (juillet : 0) | Le moteur devient aveugle alors qu'il « sait » que le revenu est ~2,1 M depuis 4 mois |
| Rien ne dit **avant** la fin du cycle qu'on va finir rouge | Le seul retour arrive quand l'argent est déjà parti |
| Aucune notion de **charge fixe** | L'argent du loyer et des factures est compté comme disponible |

### Principes (inchangés + deux nouveaux)

- 100 % hors-ligne, déterministe, non moralisateur, i18n fr/en/mg — comme la Partie I.
- **Calculer d'abord, demander ensuite.** Tout ce que l'historique permet de déduire (jour de paye, revenu, charges fixes) est proposé pré-rempli et confirmé d'un tap. On ne demande que ce qu'on ne peut pas calculer.
- **Les utilisateurs existants passent en premier.** Les phases 7 à 9 se construisent sur l'historique ; l'onboarding des nouveaux (Phase 10) vient en dernier, une fois le modèle stabilisé.

### Indicateur de succès

Un seul : **la part d'utilisateurs qui finissent leur cycle en positif** (`cycle_end_state` dans PostHog). Tout le reste est un moyen.

---

## 9. Phase 7 — Cycle personnel et revenu attendu

### Notion de cycle

Le cycle = **d'une paye à la suivante**. Trois modes, stockés dans `settings` :

| `cycle_mode` | Cas | Bornes du cycle |
|---|---|---|
| `payday` | Salaire à jour fixe (ex. le 28) | du jour de paye au jour précédent la paye suivante (28 → 27) |
| `irregular` | Freelance, commerce, revenus par à-coups | mois calendaire pour les rapports ; le pilotage passe par le **runway** (Phase 9) |
| `calendar` (défaut) | Rien de connu | 1ᵉʳ → fin de mois, comportement actuel |

Clés : `cycle_mode`, `cycle_pay_day` (1–31 ; si le mois est plus court, `min(jour, joursDuMois)`), `expected_income` (centimes), `expected_income_source` (`detected` \| `manual`).

`getCurrentCycle()` / `getPreviousCycles()` (Phase 1) sont **déjà** le seul point qui décide des bornes — c'est pour ça qu'on les avait isolées. En mode `payday`, `start` = dernier jour de paye ≤ aujourd'hui, `end` = jour de paye suivant, `label` = date ISO de `start` (`'2026-07-28'`) ; `totalDays`, `elapsedDays`, `elapsedRatio` inchangés dans leur sens. Tout ce qui consomme un `Cycle` (bilan, hero, notification) suit sans modification.

### Détection depuis l'historique (existants d'abord)

Sur les revenus des 6 derniers mois (`type = 'income'`, hors virements) :

- Regrouper par montant ±10 % et écart 25–35 jours — **réutiliser `longestMonthlyChain` d'`indicators.ts`** (déjà écrit pour les dépenses), pas le réécrire.
- `cycle_pay_day` = médiane du jour du mois des occurrences ; `expected_income` = médiane des montants ; confiance = occurrences ÷ cycles observés.
- Chaîne de ≥ 3 occurrences → mode `payday` proposé. Sinon, revenus présents mais dispersés → `irregular` proposé. Aucun revenu → `calendar`, rien à proposer.

### Écran de confirmation

À la première ouverture du dashboard après mise à jour, une carte sous le hero :

```
D'après tes derniers mois
Tu es payé vers le 28 · ~2 100 000
[ C'est ça ]   [ Modifier ]   [ Mes revenus sont irréguliers ]
```

« C'est ça » écrit les réglages et la carte disparaît. « Modifier » ouvre le même formulaire que **Paramètres → Mon cycle** (jour, montant, mode). Un tap suffit quand l'app a vu juste.

### Ce qui change immédiatement

- Hero : « Gardé **ce cycle** » + libellé du cycle (« 28 juil. → 27 août »).
- Bilan : analyse le cycle personnel ; le repli sur le dernier cycle complet (déjà codé) s'aligne.
- Notification « ton bilan est prêt » : programmée le jour de paye, pas le 1ᵉʳ.
- Revenu du cycle absent → **revenu attendu** utilisé et affiché comme estimé (« revenu estimé 2 100 000 d'après tes mois précédents ») ; l'état `noIncome` ne s'applique plus qu'à l'absence totale d'historique. Ceci remplace le point A de la Phase 6.1.

Budgets et rapports restent calendaires dans cette phase (migration en Phase 9).

### Prompt Claude Code — Phase 7

```
Lis PRD_ANALYSE.md, Partie II, section « Phase 7 ».
Phases 0 à 6 livrées. Utilisateurs EXISTANTS d'abord.

1. lib/analysis/cycle.ts : getCurrentCycle / getPreviousCycles lisent les
   réglages (cycle_mode, cycle_pay_day) — fonction pure avec les réglages
   en paramètre + un hook mince qui les fournit.
2. lib/analysis/payday.ts : detectPayday(db) — réutilise longestMonthlyChain
   sur les revenus ; retourne { mode, payDay, expectedIncome, confidence }.
3. Écran Paramètres → Mon cycle + carte de confirmation sous le hero
   (une fois, disparaît après réponse).
4. Revenu attendu : injecté dans getIndicators quand le revenu du cycle
   est nul ; flag incomeEstimated affiché dans le bilan.
5. Hero : libellé du cycle. Notification bilan : jour de paye.
6. i18n fr/en/mg. Aucun changement sur budgets/rapports.

Quand tu as fini : montre-moi detectPayday sur ma base (jour et montant
détectés), le nouveau getCurrentCycle, et une capture de la carte.
```

---

## 10. Phase 8 — Charges fixes

### Pourquoi une brique à part

Une charge fixe n'est ni une transaction (elle est attendue avant d'exister) ni une planification (ponctuelle). C'est **de l'argent déjà engagé** : tant qu'elle n'est pas réglée, elle ne doit jamais être comptée comme disponible. C'est la pièce qui manquait entre « ce que je gagne » et « ce que je peux dépenser ».

### Migration 26

```sql
CREATE TABLE IF NOT EXISTS fixed_charges (
  id TEXT PRIMARY KEY,
  category_id TEXT,
  label TEXT NOT NULL,
  amount INTEGER NOT NULL,          -- centimes
  day_of_month INTEGER NOT NULL,    -- 1–31
  source TEXT NOT NULL,             -- 'detected' | 'manual'
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS fixed_charge_settlements (
  charge_id TEXT NOT NULL,
  cycle_label TEXT NOT NULL,
  transaction_id TEXT,              -- null si « payé » manuel
  settled_at TEXT NOT NULL,
  PRIMARY KEY (charge_id, cycle_label)
);
```

Soft delete, non destructif. Les deux tables entrent dans `BACKUP_TABLES` / `BACKUP_WIPE_TABLES`, `BACKUP_FILE_VERSION` → 3 (rétro-compatible, même mécanique qu'en Phase 4).

### Détection (existants d'abord)

`detectRecurring` (Phase 1) trouve déjà les dépenses qui reviennent (montant ±15 %, 25–35 j, ≥ 3 occurrences). Celles à `confidence ≥ 0.75` sont proposées dans un écran **« Charges fixes repérées »** : une ligne par récurrence (catégorie, montant moyen, jour), cochée par défaut, montant éditable. Valider insère en `source = 'detected'`. Apprentissage continu : une nouvelle récurrence absente de la table → suggestion « Ajouter X en charge fixe ? » (carte dashboard, une fois).

### Règlement d'une charge

Une charge est **réglée** pour un cycle si :
- une dépense de même catégorie, montant ±15 %, tombe dans le cycle → rattachée automatiquement (`transaction_id`), ou
- l'utilisateur tape « Payé » (règlement manuel).

État par cycle : `réglée ✓` / `à venir (dans N jours)` / `en retard`. Total **engagé** = charges non réglées du cycle — c'est ce montant que la Phase 9 retire du disponible.

### Écran « Charges fixes »

Accessible depuis Paramètres et depuis le dashboard (ligne « Charges fixes : 3 réglées · 2 à venir · 410 000 engagés »). Liste, ajout manuel (catégorie, montant, jour), activation/désactivation, suppression douce.

### Prompt Claude Code — Phase 8

```
Lis PRD_ANALYSE.md, Partie II, section « Phase 8 ».
Phase 7 livrée. Existants d'abord — la saisie à l'onboarding vient en Phase 10.

1. Migration 26 (fixed_charges + fixed_charge_settlements), DATABASE_VERSION 26.
   Backup : les 2 tables, BACKUP_FILE_VERSION 3, rétro-compatible.
2. lib/fixedCharges/ : détection (réutilise detectRecurring), état par cycle
   (réglée / à venir / en retard), total engagé. Fonctions pures.
3. Écran « Charges fixes repérées » (confirmation en un tap) + écran
   « Charges fixes » (liste, ajout, payé manuel).
4. Rattachement automatique à la saisie d'une dépense correspondante.
5. Notification J-3 avant une charge non réglée (une par charge).
6. i18n fr/en/mg.

Montre-moi d'abord le diff backup (constants), puis la détection sur ma base.
```

---

## 11. Phase 9 — Reste à vivre et l'agent à la saisie

C'est le produit. Tout ce qui précède existe pour rendre ce chiffre juste.

### Le calcul

```
disponible      = revenu du cycle (saisi, sinon attendu)
                  − charges fixes du cycle (réglées + à venir)
                  − épargne visée (objectif saveAmount, Phase 6)
dépensé libre   = dépenses du cycle − charges fixes réglées
restant         = disponible − dépensé libre
jours restants  = totalDays − elapsedDays + 1
reste à vivre   = restant ÷ jours restants
```

Recalculé chaque jour à partir du **restant réel** : ce qui n'est pas dépensé un jour se reporte naturellement sur les suivants, sans mécanique de report à part. Trois états : **vert** (reste à vivre ≥ plan du début de cycle), **orange** (en dessous), **rouge** (restant ≤ 0 — on vit sur les réserves).

Mode `irregular` : le chiffre devient le **runway** = (solde liquide − charges à venir sous 30 j) ÷ dépense moyenne par jour sur 3 cycles → « Avec ce que tu as, tu tiens 47 jours ».

### Le chiffre du jour (hero)

Un seul chiffre en haut du dashboard, plus gros que le solde :

```
AUJOURD'HUI TU PEUX DÉPENSER
42 000 Ar
Cycle 28 juil. → 27 août · jour 11/31 · 1 235 000 restants
```

Il **remplace** le duo « gardé / taux » de la Phase 3 (ces deux chiffres passent dans le bilan). Le solde net reste visible dessous.

### L'agent à la saisie

Après l'enregistrement d'une dépense (`add.tsx`), une ligne apparaît sous la confirmation, 3 s, non bloquante, jamais moralisatrice :

| Situation | Message |
|---|---|
| Dans le jour | « Il te reste 17 000 pour aujourd'hui » |
| Jour dépassé | « Tu dépasses le jour de 23 000 → demain tu auras 19 000 » |
| Charge fixe reconnue | « Factures réglée ✓ · 410 000 restants pour le cycle » |
| Restant ≤ 0 | « Tu es sur tes réserves : −65 000 sur ce cycle » |

Ton : le chiffre, jamais « attention », « trop », « mauvais ». C'est la Phase 2 appliquée à la seconde où l'argent sort.

### Budgets et rapports sur le cycle personnel

- `budget_history.year_month` devient la **clé de cycle** (`cycle_label`) — `ensureCurrentMonthBudgetHistory` et `useBudgets` lisent `getCurrentCycle()`. Migration de données : les clés `'YYYY-MM'` existantes restent valides en mode `calendar` ; en mode `payday`, le cycle courant est re-seedé depuis `categories.budget_limit`.
- `PeriodSelector` gagne une période **« Cycle »**, par défaut quand `cycle_mode ≠ calendar`.
- Le calendrier reste un calendrier ; ses totaux de période suivent le cycle.

### Événements PostHog

`daily_number_shown` (état vert/orange/rouge), `entry_feedback_shown` (type), `cycle_end_state` (positive \| negative, envoyé au premier lancement après la fin d'un cycle) — le KPI de la Partie II.

### Prompt Claude Code — Phase 9

```
Lis PRD_ANALYSE.md, Partie II, section « Phase 9 ».
Phases 7 et 8 livrées.

1. lib/pilot/ : computeDailyBudget(indicators, fixedCharges, goal, cycle)
   et computeRunway(...) — fonctions pures, null jamais NaN, gardes sur les
   dénominateurs.
2. Hero : le chiffre du jour remplace gardé/taux (qui migrent dans le bilan).
3. add.tsx : ligne de retour après enregistrement (3 s, non bloquante),
   4 cas du PRD, rattachement des charges fixes.
4. Budgets et rapports sur le cycle : budget_history par cycle_label,
   période « Cycle » dans PeriodSelector.
5. PostHog : daily_number_shown, entry_feedback_shown, cycle_end_state.
6. i18n fr/en/mg. Release 3.0.0 (le hero change de sens).

Montre-moi computeDailyBudget sur ma base (le chiffre du jour), puis une
capture du hero et une de la ligne de retour à la saisie.
```

---

## 12. Phase 10 — Alertes, onboarding remodelé, bilan-réglage

### Alertes de trajectoire (déterministes, max une par jour)

| Déclencheur | Message | Action |
|---|---|---|
| Projection du cycle < 0 | « À ce rythme : −150 000 le 27 » | voir le bilan |
| Charge fixe non réglée à J-3 | « Factures 233 000 dans 3 jours · tu as 410 000 » | marquer payé / voir |
| Paye attendue non saisie à J+2 | « Ta paye du 28 n'est pas enregistrée — reçue ? » | saisir le revenu |
| Revenu reçu en mode irrégulier | « 300 000 reçus — on les ajoute au disponible ? » | oui / plus tard |

Via `lib/notifications.ts`, identifiants stables, cancel-then-schedule.

### Onboarding remodelé (nouveaux utilisateurs)

Trois questions, une minute, chacune passable :

1. « Quand reçois-tu ton argent ? » → jour fixe (le …) / c'est irrégulier
2. « À peu près combien ? » → montant, optionnel
3. « Tes charges fixes ? » → liste prête (loyer, électricité, eau, internet, transport, école, téléphone…), un montant sur celles qui concernent l'utilisateur

Écrit `settings` (cycle) + `fixed_charges` (`source = 'manual'`). Tout est passable : sans réponse, mode `calendar`, et l'app **apprend** ensuite (Phases 7–8) en proposant ce qu'elle détecte. Le WOW moment de l'onboarding actuel devient le **premier chiffre du jour**.

### Le bilan devient le réglage du cycle suivant

En fin de cycle, l'écran « Mon bilan » propose d'ajuster, un tap chacun :
- **revenu attendu** si le revenu réel s'en écarte de > 10 %,
- **charges fixes** dont le montant réel diffère (« Factures : 233 000 prévu, 251 000 réel — on met à jour ? »),
- **budgets** sur 3 cycles (plafond > 2× le **max** des 3 derniers cycles → abaisser ; **max** et non moyenne, pour ne pas piéger Vacances),
- **objectif d'épargne** si tenu 3 cycles de suite (« tu tiens 200 000 depuis 3 cycles — passer à 250 000 ? »).

Et le nettoyage issu de la Phase 6.1 : retrait de `noSpendStreak` (artefact de saisie en rafale), règles de base `uncategorized` / `topCategories` / `monthOverMonth`, dérive de catégorie → action « voir la catégorie » (jamais un budget sous la dépense courante), garde de pertinence ≥ 5 % des dépenses.

### Prompt Claude Code — Phase 10

```
Lis PRD_ANALYSE.md, Partie II, section « Phase 10 ».
Phases 7 à 9 livrées et observées.

1. Alertes : 4 déclencheurs, max 1/jour, identifiants stables.
2. Onboarding : 3 questions passables, écrit settings + fixed_charges ;
   WOW moment = premier chiffre du jour.
3. Bilan-réglage : 4 propositions ajustables en un tap ; nettoyage 6.1
   (retrait noSpendStreak, 3 règles de base, action dérive → voir catégorie).
4. i18n fr/en/mg. Release 3.1.0.

Montre-moi les 3 écrans d'onboarding et le bloc « réglage » du bilan.
```

---

## 13. Récapitulatif

| Phase | Contenu | Fichiers | Release |
|---|---|---|---|
| **0** | Correctifs `avgPerDay`, index, statut budget, i18n durée, `APP_VERSION` | 6 | **2.0.4** |
| **1** | `lib/analysis/` — cycle, indicateurs, requêtes | 4 créés | — |
| **2** | Règles + scoring + i18n | 10 créés, 3 modifiés | — |
| **3** | Écran, carte d'entrée, hero | 5–7 | **2.1.0** |
| **4** | Historique, backup, gamification, notif | 8 | **2.2.0** |
| **6** | Objectif, intentions, règles budget — analyse à la demande | ~6 | **2.3.0** |
| **5** | Analyse multi-cycles — règles d'historique + calibrage perso | ~5 créés | après 3.1.0 |
| **7** | Cycle personnel (jour de paye), revenu attendu, détection depuis l'historique | ~5 | **2.4.0** |
| **8** | Charges fixes : migration 26, détection, règlement, écrans | ~8 | **2.5.0** |
| **9** | Reste à vivre du jour + agent à la saisie, budgets/rapports sur le cycle | ~8 | **3.0.0** |
| **10** | Alertes, onboarding remodelé, bilan-réglage (+ nettoyage 6.1) | ~8 | **3.1.0** |

Phase 0 en premier, sans exception : les trois bugs corrigés faussent les calculs sur lesquels tout le reste repose.

---

## 14. Releases

### Quatre livraisons, pas une

| Version | Type | Contenu |
|---|---|---|
| **2.0.4** | patch | Phase 0 seule |
| **2.1.0** | minor | Phases 1–3 — l'analyse fonctionne, sans persistance |
| **2.2.0** | minor | Phase 4 — historique, boucle, gamification |
| **2.3.0** | minor | Phase 6 — objectif, intentions, règles budget |
| **2.4.0** | minor | Phase 7 — cycle personnel, revenu attendu |
| **2.5.0** | minor | Phase 8 — charges fixes (migration 26, backup v3) |
| **3.0.0** | major | Phase 9 — reste à vivre du jour, agent à la saisie, budgets/rapports sur le cycle (le hero change de sens) |
| **3.1.0** | minor | Phase 10 — alertes, onboarding remodelé, bilan-réglage |
| ensuite | minor | Phase 5 — analyse multi-cycles |

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

## 15. Hors périmètre — pistes v2

- **Répartition à la saisie du revenu** — bottom sheet de découpage en enveloppes quand un revenu est enregistré.

---

## 16. Points de vigilance

**Vérifier la complétude des données avant de se fier aux constats.** Sur le device de test, le compte Cash est à 0 et Mvola à 434 Ar — tout passe par Bank. Si les utilisateurs réels font pareil, les dépenses en espèces ne sont pas saisies et l'analyse portera sur une image partielle. Regarder dans PostHog la répartition des transactions par type de compte avant de construire dessus, et envisager un constat dédié : « aucune dépense en espèces enregistrée ce cycle ».

**Les seuils sont des repères, pas des vérités.** Formuler les constats comme des observations, jamais comme des lignes à ne pas franchir.

**Une seule action par analyse.** La tentation sera d'en proposer plusieurs puisque le moteur en calcule douze. Y résister : la difficulté n'est pas de calculer, c'est de choisir lequel mérite d'être dit ce mois-ci.
