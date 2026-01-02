# Technical Architecture: Money Tracker

## Architecture Overview

**Philosophy**: Offline-first, simplicité maximale, sync intelligent. L'app doit fonctionner parfaitement sans internet et synchroniser automatiquement dès qu'une connexion est disponible. Chaque décision technique priorise la rapidité d'exécution et la fiabilité.

**Tech Stack Summary**:
- **Framework**: Expo SDK 54 (managed workflow) + React Native
- **Package Manager**: pnpm
- **UI**: Gluestack UI
- **Local Database**: SQLite (expo-sqlite)
- **Cloud Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password) + PIN local (offline)
- **Notifications**: expo-notifications (local scheduled)
- **Platform**: Android uniquement (v1)

## Frontend Architecture

### Core Stack

| Tool | Choix | Pourquoi | Trade-off |
|------|-------|----------|-----------|
| Framework | **Expo SDK 54** | Managed workflow = setup simple, OTA updates, pas besoin de Xcode/Android Studio | Moins de contrôle sur le natif, mais suffisant pour ce projet |
| UI | **Gluestack UI v2** | Composants accessibles, theming facile, bonne DX | Moins populaire que NativeBase, mais plus moderne et performant |
| Navigation | **Expo Router** | File-based routing, deep linking automatique, cohérent avec Next.js | Nouveau mais stable, meilleure DX que React Navigation seul |

### State Management

- **Global State**: Zustand (léger, simple, persiste facilement)
  - **Why**: Plus simple que Redux, 1kb, API intuitive
  - **Alternative rejetée**: Redux (overkill pour ce projet)

- **Server State**: TanStack Query + custom sync hook
  - **Why**: Cache intelligent, refetch automatique, offline support

- **Local DB State**: expo-sqlite avec wrapper custom
  - **Why**: Données persistent même si app fermée/crashée

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      UI Components                       │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   Zustand Store                          │
│  (current balance, categories, UI state)                 │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              SQLite (Source of Truth)                    │
│  transactions, categories, settings                      │
└─────────────────────────┬───────────────────────────────┘
                          │ (when online)
┌─────────────────────────▼───────────────────────────────┐
│              Supabase (Backup/Sync)                      │
│  Same schema, synced incrementally                       │
└─────────────────────────────────────────────────────────┘
```

## Backend Architecture

### Sync Strategy: Offline-First

**Principe**: SQLite = source de vérité. Supabase = backup.

```
1. User crée une dépense
2. → Sauvegarde immédiate dans SQLite
3. → Marque comme "pending_sync"
4. → UI mis à jour instantanément

5. Quand connexion détectée:
6. → Récupère tous les "pending_sync"
7. → Envoie vers Supabase en batch
8. → Marque comme "synced"
```

**Gestion des conflits**: Last-write-wins basé sur `updated_at` timestamp. Simple et suffisant pour usage mono-utilisateur.

### Database Schema

#### SQLite Local

```sql
-- Transactions (dépenses et revenus)
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,           -- UUID généré localement
  type TEXT NOT NULL,            -- 'expense' | 'income'
  amount INTEGER NOT NULL,       -- En centimes (évite les floats)
  category_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL,      -- ISO 8601
  updated_at TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending', -- 'pending' | 'synced'
  deleted_at TEXT                -- Soft delete pour sync
);

-- Catégories
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,                     -- Emoji ou icon name
  color TEXT,                    -- Hex color
  is_default INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending'
);

-- Settings utilisateur
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Sync metadata
CREATE TABLE sync_meta (
  id INTEGER PRIMARY KEY,
  last_sync_at TEXT,
  user_id TEXT
);
```

#### Supabase (PostgreSQL) - Même schema

```sql
-- Même structure avec Row Level Security
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount BIGINT NOT NULL,
  category_id UUID REFERENCES categories,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- RLS Policy: Users only see their own data
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);
```

### Authentication

| Aspect | Choix | Détail |
|--------|-------|--------|
| Provider | **Supabase Auth** | Gratuit, intégré, JWT |
| Méthode | **Email + Password** | Hashé avec bcrypt côté Supabase |
| Offline Auth | **PIN local (4-6 chiffres)** | Hashé avec expo-crypto, stocké SecureStore |
| Session | **JWT stocké SecureStore** | expo-secure-store pour le token |

### Auth Flow: Online + Offline

```
┌─────────────────────────────────────────────────────────────┐
│                    PREMIER LOGIN (Online requis)             │
├─────────────────────────────────────────────────────────────┤
│ 1. User entre email + password                               │
│ 2. → Supabase Auth vérifie                                   │
│ 3. → Succès: JWT reçu, stocké dans SecureStore               │
│ 4. → App demande de créer un PIN (4-6 chiffres)              │
│ 5. → PIN hashé (SHA-256) + stocké dans SecureStore           │
│ 6. → User redirigé vers onboarding                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 RETOUR DANS L'APP (Offline OK)               │
├─────────────────────────────────────────────────────────────┤
│ 1. App check si session existe (SecureStore)                 │
│ 2. → Si oui: demande PIN                                     │
│ 3. → PIN entré, hashé, comparé au hash stocké                │
│ 4. → Match: accès accordé (100% offline)                     │
│ 5. → Si online: refresh JWT en background                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PIN OUBLIÉ                                │
├─────────────────────────────────────────────────────────────┤
│ 1. Option "PIN oublié?" sur l'écran de PIN                   │
│ 2. → Requiert connexion internet                             │
│ 3. → Re-login avec email + password                          │
│ 4. → Création d'un nouveau PIN                               │
└─────────────────────────────────────────────────────────────┘
```

### PIN Security Implementation

```typescript
// Stockage sécurisé du PIN
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

async function hashPin(pin: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + SALT // Salt unique par installation
  );
}

async function savePin(pin: string): Promise<void> {
  const hashedPin = await hashPin(pin);
  await SecureStore.setItemAsync('user_pin_hash', hashedPin);
}

async function verifyPin(enteredPin: string): Promise<boolean> {
  const storedHash = await SecureStore.getItemAsync('user_pin_hash');
  const enteredHash = await hashPin(enteredPin);
  return storedHash === enteredHash;
}
```

### Données stockées dans SecureStore

| Clé | Contenu | Usage |
|-----|---------|-------|
| `supabase_jwt` | JWT token | Auth Supabase quand online |
| `supabase_refresh` | Refresh token | Renouveler JWT |
| `user_pin_hash` | SHA-256 du PIN | Vérification offline |
| `user_email` | Email (pour affichage) | UI seulement |
| `pin_salt` | Salt aléatoire | Sécurité hash PIN |

## Notifications Architecture

### Local Scheduled Notifications

**Librairie**: `expo-notifications`

**Pourquoi pas un serveur push ?**
- Les rappels sont périodiques et prévisibles
- Pas besoin d'internet
- Plus simple, plus fiable
- Gratuit

**Implementation**:
```typescript
// Schedule hourly reminder
await Notifications.scheduleNotificationAsync({
  content: {
    title: "N'oublie pas !",
    body: "As-tu des dépenses à enregistrer ?",
  },
  trigger: {
    hour: 10,
    repeats: true,
  },
});
```

**Permissions**: Demandées à l'onboarding, rappel si refusées.

## Charts & Visualization

### Choix: react-native-chart-kit

**Pourquoi ce choix**:
- Simple à utiliser, peu de config
- Léger (~50kb)
- Suffisant pour pie charts et bar charts basiques
- Bonne doc, communauté active

**Charts prévus**:
- Pie chart: Répartition par catégorie
- Bar chart: Dépenses par jour/semaine
- Simple number displays: Solde, total dépensé

## Infrastructure & Deployment

### Development Environment

| Outil | Usage |
|-------|-------|
| **Expo Go** | Dev rapide sur device physique |
| **Android Emulator** | Tests via Android Studio |
| **EAS Build** | Builds de production |

### Build & Distribution

```bash
# Dev
npx expo start

# Build APK preview
eas build --platform android --profile preview

# Build production
eas build --platform android --profile production
```

### Supabase Setup

- **Projet**: Free tier (500MB database, 1GB storage)
- **Region**: Europe (Frankfurt) - plus proche de Madagascar
- **Limites free tier**:
  - 500MB database
  - 2GB bandwidth/month
  - 50,000 monthly active users

## Architecture Decision Records

### ADR-001: SQLite + Supabase (Offline-First)
- **Context**: Connexion internet instable à Madagascar
- **Decision**: SQLite comme source de vérité, Supabase pour backup
- **Rationale**: Meilleur des deux mondes - fiabilité offline + sécurité cloud

### ADR-002: Expo Managed Workflow
- **Context**: Dev solo sur Linux, Android only, MVP rapide
- **Decision**: Expo managed (pas de bare workflow)
- **Rationale**: Expo couvre 100% des besoins

### ADR-003: Montants en centimes (Integer)
- **Context**: Éviter les erreurs de calcul avec les floats
- **Decision**: Stocker tous les montants en centimes (INTEGER)
- **Example**: 15000 MGA = 1500000 centimes stockés

### ADR-004: PIN Local pour Auth Offline
- **Context**: App doit fonctionner offline
- **Decision**: PIN local (4-6 chiffres) hashé pour authentification offline
- **Rationale**: PIN rapide à entrer, sécurisé (hashé + salé), offline natif

### ADR-005: Zustand pour State Management
- **Context**: Besoin de state global léger
- **Decision**: Zustand au lieu de Redux/Context
- **Rationale**: API simple, persist middleware, 1kb, très performant

## Folder Structure

```
money-tracker/
├── app/                      # Expo Router pages
│   ├── (tabs)/              # Tab navigation
│   │   ├── index.tsx        # Dashboard (home)
│   │   ├── add.tsx          # Add transaction
│   │   ├── history.tsx      # Transaction list
│   │   └── settings.tsx     # Settings
│   ├── (auth)/              # Auth screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── _layout.tsx          # Root layout
│   └── onboarding.tsx       # First-time setup
│
├── components/              # UI Components
│   ├── ui/                  # Gluestack primitives
│   ├── TransactionCard.tsx
│   ├── CategoryPicker.tsx
│   └── BalanceDisplay.tsx
│
├── lib/                     # Core logic
│   ├── database/
│   │   ├── sqlite.ts
│   │   ├── schema.ts
│   │   └── migrations.ts
│   ├── sync/
│   │   ├── supabase.ts
│   │   └── syncManager.ts
│   ├── notifications.ts
│   └── utils.ts
│
├── stores/                  # Zustand stores
│   ├── transactionStore.ts
│   ├── categoryStore.ts
│   └── settingsStore.ts
│
├── hooks/                   # Custom hooks
│   ├── useDatabase.ts
│   ├── useSync.ts
│   └── useNetworkStatus.ts
│
├── constants/
│   ├── categories.ts
│   └── theme.ts
│
├── types/
│   └── index.ts
│
├── docs/                    # Documentation
│   ├── PRD.md
│   └── ARCHI.md
│
├── app.json
├── eas.json
├── package.json
└── tsconfig.json
```

## Cost Estimation

| Service | Coût | Limite |
|---------|------|--------|
| Supabase | **0€** | 500MB DB, 2GB bandwidth |
| Expo/EAS | **0€** | 30 builds/month |
| Google Play | **25$ one-time** | Publication unique |
| **Total mensuel** | **0€** | Largement suffisant |

## Implementation Priority

### Phase 1: Foundation
1. Init projet Expo avec TypeScript + pnpm
2. Setup Gluestack UI + theming
3. Setup SQLite avec schema initial
4. Setup Supabase projet + auth

### Phase 2: Core Features
1. Écran d'auth (login/register + PIN)
2. Onboarding (solde initial)
3. Saisie de dépense rapide
4. Liste des transactions
5. Dashboard avec solde

### Phase 3: Offline & Sync
1. Détection réseau
2. Logique de sync
3. Queue de transactions pending

### Phase 4: Notifications & Polish
1. Setup notifications locales
2. Écran settings
3. Graphiques basiques
4. Tests sur device réel
