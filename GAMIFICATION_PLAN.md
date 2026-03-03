# Plan de Gamification — Mitsitsy

## Contexte

Mitsitsy est une app de finance personnelle offline-first (SQLite, Expo Router, Gluestack UI). Tracker ses depenses est une corvee, pas un plaisir. L'objectif est d'ajouter un systeme de gamification pour creer une boucle d'engagement et augmenter la retention.

**Decisions :**
- Streak = ouvrir l'app OU ajouter une transaction
- Affichage = sous la carte du solde total (dashboard)
- Badges = dans la page Historique avec un tab switcher (Historique | Succes)
- Scope = Complet (Streaks + XP/Niveaux + Badges + Defi quotidien)

---

## REGLE CRITIQUE : Protection des donnees en production

**L'app est en production avec des utilisateurs reels.** Toute modification doit respecter ces regles :

- **JAMAIS de DROP TABLE** — ne jamais supprimer ou recreer une table existante
- **JAMAIS de modification destructive** — pas de ALTER TABLE DROP COLUMN, pas de suppression de colonnes
- **Migration incrementale uniquement** — utiliser le systeme de migrations existant (v16) avec `CREATE TABLE IF NOT EXISTS` et `ALTER TABLE ADD COLUMN` apres verification via `PRAGMA table_info`
- **Pas de modification des tables existantes** (transactions, accounts, categories, settings, planifications, planification_items, sync_meta) — on ajoute uniquement de NOUVELLES tables (`gamification`, `badges`)
- **Soft delete** — utiliser `deleted_at` pour les suppressions, jamais de DELETE physique
- **Tester la migration sur une base existante** — s'assurer qu'un utilisateur avec des donnees existantes peut migrer sans perte
- **Rollback safe** — si la migration echoue a mi-chemin, les donnees existantes doivent rester intactes (utiliser des transactions SQL si necessaire)
- **Pas de donnees par defaut dans les tables existantes** — ne jamais INSERT/UPDATE dans les tables existantes lors de la migration gamification

---

## Phase 1 : Base de donnees (Migration v16)

### Fichiers a modifier
- `lib/database/schema.ts` — Ajouter les constantes SQL
- `lib/database/migrations.ts` — Ajouter `migrateToV16()`, bumper `DATABASE_VERSION` a 16

### Nouvelles tables

**Table `gamification`** (key-value dedie gamification)
```sql
CREATE TABLE IF NOT EXISTS gamification (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

**Table `badges`** (badges gagnes par l'utilisateur)
```sql
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  badge_type TEXT NOT NULL,
  earned_at TEXT NOT NULL
);
```

**Donnees initiales dans gamification :**

| Key | Default | Description |
|-----|---------|-------------|
| `current_streak` | `0` | Streak actuel |
| `longest_streak` | `0` | Meilleur streak |
| `last_activity_date` | `null` | Derniere date d'activite (YYYY-MM-DD) |
| `total_xp` | `0` | XP total accumule |
| `streak_freeze_available` | `1` | Nombre de streak freezes disponibles |
| `streak_freeze_used_date` | `null` | Date du dernier freeze utilise |
| `daily_challenge_date` | `null` | Date du defi actuel |
| `daily_challenge_type` | `null` | Type du defi actuel |
| `daily_challenge_completed` | `0` | Defi complete ? |

---

## Phase 2 : Store Zustand + Hook

### Nouveau fichier : `stores/gamificationStore.ts`

Store Zustand pour l'etat de gamification en memoire :

```typescript
interface GamificationState {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  totalXP: number;
  currentLevel: number;      // derive de totalXP
  xpToNextLevel: number;     // derive de totalXP
  xpProgress: number;        // 0-1, derive de totalXP
  streakFreezeAvailable: number;
  dailyChallengeType: string | null;
  dailyChallengeCompleted: boolean;
  badges: string[];           // IDs des badges gagnes
  isInitialized: boolean;
}
```

**Formule de niveau :** `level = floor(sqrt(totalXP / 100)) + 1`
- Level 1 : 0 XP
- Level 2 : 100 XP
- Level 3 : 400 XP
- Level 4 : 900 XP
- Level 5 : 1600 XP

### Nouveau fichier : `hooks/useGamification.ts`

Hook principal qui gere toute la logique.

**Fonctions exposees :**
- `recordActivity()` — Appele quand l'utilisateur ouvre l'app ou ajoute une transaction. Met a jour le streak et attribue XP
- `awardXP(amount, reason)` — Ajoute XP et verifie level up + nouveaux badges
- `checkDailyChallenge()` — Verifie si le defi quotidien est complete
- `generateDailyChallenge()` — Genere un nouveau defi si la date a change
- `useStreakFreeze()` — Utilise un streak freeze
- `checkBadges()` — Verifie et attribue les badges non encore gagnes

**Systeme XP (revenu > depense pour encourager le suivi des entrees d'argent) :**

| Action | XP |
|--------|----|
| Ouvrir l'app (1x/jour) | +5 |
| Enregistrer une depense | +5 |
| Enregistrer un transfert | +8 |
| Enregistrer un revenu | +15 |
| Completer le defi quotidien | +50 |
| Maintenir un streak de 7 jours | +100 |
| Maintenir un streak de 30 jours | +300 |

**Defis quotidiens (pool de 4 types) :**

1. `log_expense` — "Enregistre au moins 1 depense"
2. `log_3_transactions` — "Enregistre 3 transactions"
3. `check_planification` — "Consulte tes planifications"
4. `log_income` — "Enregistre un revenu"
5. `create_planification` — "Cree une planification"

Selection aleatoire chaque jour, stocke dans la table gamification.

**Logique de streak :**
```
Si lastActivityDate == aujourd'hui → rien (deja actif)
Si lastActivityDate == hier → streak + 1
Si lastActivityDate < hier && streak_freeze_available > 0 → utiliser freeze, streak maintenu
Si lastActivityDate < hier → streak = 1 (recommence)
```

---

## Phase 3 : Badges

### Nouveau fichier : `constants/badges.ts`

7 badges pour la v1 :

| ID | Nom (fr) | Condition | Icone Ionicons |
|----|----------|-----------|----------------|
| `first_expense` | Premiere depense | 1 transaction creee | `receipt-outline` |
| `streak_3` | 3 jours d'affile | Streak >= 3 | `flame-outline` |
| `streak_7` | Une semaine | Streak >= 7 | `flame` |
| `streak_30` | Un mois | Streak >= 30 | `bonfire` |
| `xp_500` | 500 XP | Total XP >= 500 | `star-outline` |
| `level_5` | Niveau 5 | Level >= 5 | `star` |
| `transactions_50` | 50 transactions | 50 tx creees | `layers-outline` |

Chaque badge a : `id`, `nameKey` (cle i18n), `descriptionKey`, `icon`, `color`, `condition`.

---

## Phase 4 : Composants UI

### `components/GamificationBar.tsx`

Widget compact affiche sous la carte de solde sur le dashboard.

```
[🔥 7j]  [Niv. 3]  [████░░ 450/900 XP]  [⭐ Defi]
```

- Streak counter avec icone flame (rouge si actif, gris si 0)
- Badge de niveau
- Barre de progression XP (couleur `theme.colors.accent1`)
- Indicateur defi quotidien (coche si complete, etoile sinon)
- Tap = navigation vers onglet Succes dans Historique

### `components/BadgeCard.tsx`

Card pour un badge individuel :
- Icone Ionicons
- Nom et description
- Etat : gagne (couleur) ou verrouille (gris + cadenas)
- Date d'obtention si gagne

### `components/AchievementsTab.tsx`

Contenu de l'onglet "Succes" dans la page Historique :
- Stats en haut (streak, niveau, XP total, badges gagnes)
- Section "Defi du jour" avec progres
- Grille de badges (2 colonnes)
- Streak freeze info en bas

### `components/LevelUpModal.tsx`

Modal de celebration lors d'un passage de niveau :
- Animation scale + opacity
- Numero du nouveau niveau
- Bouton "Continuer"

### `components/XPToast.tsx`

Toast anime affiche apres attribution d'XP :
- "+10 XP" avec animation slide up + fade out
- Affiche pendant 1.5 secondes
- Positionne en haut de l'ecran

---

## Phase 5 : Integration dans les ecrans existants

### `app/(tabs)/index.tsx` (Dashboard)
- Importer `useGamification` et `GamificationBar`
- Appeler `recordActivity()` dans le `useFocusEffect`
- Ajouter `<GamificationBar />` juste apres la carte de solde
- Ajouter le refresh gamification dans `handleRefresh`

### `app/(tabs)/history.tsx` (Historique → Historique + Succes)
- Ajouter un state `activeTab: 'history' | 'achievements'`
- Tab switcher sous le heading (2 boutons segmentes)
- Conditionner le rendu : `SectionList` si history, `AchievementsTab` si achievements

### `app/(tabs)/add.tsx` (Ajout transaction)
- Apres `createTransaction()` reussie → `awardXP(10, 'transaction')`
- Appeler `recordActivity()`
- Verifier si le defi quotidien est complete
- Afficher `XPToast` apres l'ajout

---

## Phase 6 : Traductions i18n

### Modifier `fr.json`, `en.json`, `mg.json`

Ajouter la section `"gamification"` :

```json
{
  "gamification": {
    "streak": "Serie",
    "streakDays": "{{count}}j",
    "level": "Niv. {{level}}",
    "xp": "XP",
    "dailyChallenge": "Defi du jour",
    "challengeCompleted": "Defi complete !",
    "achievements": "Succes",
    "badges": "Badges",
    "badgesEarned": "{{count}}/{{total}} badges",
    "locked": "Verrouille",
    "earnedOn": "Obtenu le {{date}}",
    "levelUp": "Niveau {{level}} !",
    "levelUpMessage": "Felicitations ! Continuez comme ca !",
    "continue": "Continuer",
    "streakFreeze": "Protection serie",
    "streakFreezeDesc": "{{count}} disponible",
    "streakFreezeUsed": "Serie protegee !",
    "challengeLogExpense": "Enregistre au moins 1 depense",
    "challengeLog3": "Enregistre 3 transactions",
    "challengeCheckPlan": "Consulte tes planifications",
    "challengeLogIncome": "Enregistre un revenu",
    "challengeCreatePlan": "Cree une planification",
    "stats": "Statistiques",
    "longestStreak": "Meilleure serie",
    "totalXP": "XP total",
    "currentLevel": "Niveau actuel"
  }
}
```

Plus les noms/descriptions des 7 badges dans chaque langue.

---

## Ordre d'implementation

| Etape | Fichier | Action |
|-------|---------|--------|
| 1 | `lib/database/schema.ts` | Ajouter SQL des nouvelles tables |
| 2 | `lib/database/migrations.ts` | Ajouter `migrateToV16()` |
| 3 | `constants/badges.ts` | Creer definitions des badges |
| 4 | `stores/gamificationStore.ts` | Creer le store Zustand |
| 5 | `stores/index.ts` | Exporter le nouveau store |
| 6 | `hooks/useGamification.ts` | Creer le hook principal |
| 7 | `hooks/index.ts` | Exporter le hook |
| 8 | `components/XPToast.tsx` | Creer le toast XP |
| 9 | `components/GamificationBar.tsx` | Creer la barre dashboard |
| 10 | `components/BadgeCard.tsx` | Creer la card badge |
| 11 | `components/AchievementsTab.tsx` | Creer l'onglet succes |
| 12 | `components/LevelUpModal.tsx` | Creer le modal level up |
| 13 | `app/(tabs)/index.tsx` | Integrer GamificationBar |
| 14 | `app/(tabs)/history.tsx` | Ajouter tab switcher + AchievementsTab |
| 15 | `app/(tabs)/add.tsx` | Integrer XP + streak sur ajout |
| 16 | `lib/i18n/translations/*.json` | Ajouter traductions FR/EN/MG |

---

## Fichiers a creer (8)

- `constants/badges.ts`
- `stores/gamificationStore.ts`
- `hooks/useGamification.ts`
- `components/GamificationBar.tsx`
- `components/BadgeCard.tsx`
- `components/AchievementsTab.tsx`
- `components/LevelUpModal.tsx`
- `components/XPToast.tsx`

## Fichiers a modifier (9)

- `lib/database/schema.ts`
- `lib/database/migrations.ts`
- `stores/index.ts`
- `hooks/index.ts`
- `app/(tabs)/index.tsx`
- `app/(tabs)/history.tsx`
- `app/(tabs)/add.tsx`
- `lib/i18n/translations/fr.json`
- `lib/i18n/translations/en.json`
- `lib/i18n/translations/mg.json`

---

## Phase Future : Defis personnalises (v2)

> **Statut : A implementer dans une version future**
> Cette phase est planifiee mais pas encore developpee. Elle depend des phases 1-6 deja implementees.

### Concept

L'utilisateur peut creer ses propres defis financiers avec une date limite. S'il reussit avant l'echeance, il gagne de l'XP bonus et debloque des badges speciaux. L'objectif est de transformer la gestion d'argent en objectifs concrets et motivants.

### Types de defis personnalises

| Type | Exemple | Verification |
|------|---------|--------------|
| **Epargne** | "Economiser 200 000 Ar avant le 30 juin" | Comparer le solde total au debut vs a la date limite |
| **Limite depense** | "Ne pas depenser plus de 50 000 Ar en nourriture ce mois" | Somme des depenses dans la categorie sur la periode |
| **Objectif revenu** | "Enregistrer 500 000 Ar de revenus ce mois" | Somme des revenus sur la periode |
| **Frequence** | "Enregistrer mes depenses chaque jour pendant 2 semaines" | Verifier la presence d'au moins 1 transaction par jour sur la periode |
| **Reduction** | "Depenser 20% de moins que le mois dernier" | Comparer total depenses mois courant vs mois precedent |

### Nouvelle table : `personal_challenges`

```sql
CREATE TABLE IF NOT EXISTS personal_challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  category_id TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  initial_value INTEGER DEFAULT 0,
  current_value INTEGER DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  deleted_at TEXT
);
```

- `type` : 'savings', 'expense_limit', 'income_goal', 'frequency', 'reduction'
- `target_value` : montant cible en centimes ou nombre de jours selon le type
- `category_id` : optionnel, pour cibler une categorie specifique (ex: "nourriture")
- `status` : 'active', 'completed', 'failed', 'abandoned'
- `initial_value` : valeur de reference au debut du defi (ex: solde initial)
- `current_value` : progression actuelle (mis a jour periodiquement)
- `xp_reward` : XP gagne si le defi est reussi (par defaut 100, plus si le defi est ambitieux)

### Systeme de recompenses

| Resultat | Recompense |
|----------|------------|
| Defi reussi | +100 a +500 XP (selon difficulte) |
| Premier defi reussi | Badge "Objectif atteint" |
| 3 defis reussis | Badge "Strategiste" |
| 10 defis reussis | Badge "Maitre de ses finances" |
| Defi d'epargne reussi | Badge "Epargnant" |

### Badges additionnels (v2)

| ID | Nom (fr) | Condition | Icone |
|----|----------|-----------|-------|
| `goal_first` | Objectif atteint | 1er defi perso reussi | `flag-outline` |
| `goal_3` | Strategiste | 3 defis perso reussis | `trophy-outline` |
| `goal_10` | Maitre financier | 10 defis perso reussis | `trophy` |
| `saver` | Epargnant | 1 defi d'epargne reussi | `wallet-outline` |

### UI prevue

**Ecran de creation de defi :**
- Choix du type (5 options avec icones)
- Titre personnalise
- Montant cible / objectif
- Categorie (optionnel, picker existant)
- Date limite (DateTimePicker existant)
- Preview de l'XP a gagner

**Widget dans AchievementsTab :**
- Section "Mes defis" entre les stats et les badges
- Liste des defis actifs avec barre de progression
- Indicateur de temps restant
- Defis termines (reussis en vert, echoues en gris)

**Notifications :**
- Rappel quand un defi approche de sa date limite (J-3, J-1)
- Notification de reussite avec animation
- Notification d'echec encourageante ("Pas grave, fixe un nouvel objectif !")

### Verification automatique

Un job periodique (a chaque ouverture de l'app) verifie :
1. Les defis actifs dont la date limite est passee → marquer `failed`
2. Les defis actifs dont la condition est remplie → marquer `completed`, attribuer XP + badge
3. Mettre a jour `current_value` pour chaque defi actif (requete SQL selon le type)

### Points a decider plus tard

- [ ] Peut-on avoir plusieurs defis actifs en meme temps ? (recommande : max 3)
- [ ] Les defis echoues donnent-ils un peu d'XP quand meme ? (ex: 25% si progress > 50%)
- [ ] Peut-on prolonger un defi avant son echeance ?
- [ ] Ajouter des defis pre-definis ("templates") pour aider les debutants ?
- [ ] Partage social des defis reussis ? (hors scope offline-first)

---

## Verification

1. Lancer l'app — migration v16 s'execute sans erreur
2. Dashboard — `GamificationBar` s'affiche sous le solde avec "0j streak, Niv. 1"
3. Ajouter une transaction — toast "+10 XP" apparait, streak passe a 1j
4. Retourner au dashboard — barre mise a jour
5. Historique — tab switcher fonctionne, onglet "Succes" affiche les badges
6. Badge "Premiere depense" est gagne
7. Traductions FR/EN/MG presentes
8. Pas de regression sur les fonctionnalites existantes
