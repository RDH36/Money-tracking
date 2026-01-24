# Features Tracker: Mitsitsy

## Features Complétées (v1.0)

### Core Features

#### 1. Gestion du solde (Capital)
- **Status**: ✅ Terminé
- **Description**: L'utilisateur définit son solde initial à l'onboarding. Chaque transaction est automatiquement ajoutée/soustraite du solde.
- **Fichiers**: `hooks/useBalance.ts`, `app/onboarding/balance.tsx`

#### 2. Saisie rapide de dépense
- **Status**: ✅ Terminé
- **Description**: Interface simple pour enregistrer une dépense en quelques taps : montant, catégorie, note optionnelle.
- **Fichiers**: `app/(tabs)/add.tsx`, `hooks/useTransactions.ts`

#### 3. Catégorisation des dépenses
- **Status**: ✅ Terminé
- **Description**: Catégories prédéfinies avec icônes et couleurs. Sélection via CategoryPicker horizontal.
- **Fichiers**: `components/CategoryPicker.tsx`, `constants/categories.ts`, `hooks/useCategories.ts`

#### 4. Dashboard de visualisation
- **Status**: ✅ Terminé
- **Description**: Vue du solde actuel, dépenses totales par catégorie avec graphique camembert, transactions récentes.
- **Fichiers**: `app/(tabs)/index.tsx`, `components/ExpenseChart.tsx`, `hooks/useExpensesByCategory.ts`

#### 5. Historique des transactions
- **Status**: ✅ Terminé
- **Description**: Liste paginée des transactions groupées par date avec infinite scroll.
- **Fichiers**: `app/(tabs)/history.tsx`, `components/TransactionCard.tsx`

#### 6. Thèmes de couleur
- **Status**: ✅ Terminé
- **Description**: 4 thèmes disponibles (Turquoise, Bleu, Violet, Orange) avec persistance.
- **Fichiers**: `constants/colors.ts`, `contexts/ThemeContext.tsx`, `stores/settingsStore.ts`

#### 7. Masquer le solde
- **Status**: ✅ Terminé
- **Description**: Toggle pour cacher le solde (confidentialité).
- **Fichiers**: `app/(tabs)/settings.tsx`, `hooks/useSettings.ts`

#### 8. Rappels de notifications
- **Status**: ✅ Terminé
- **Description**: Notifications locales configurables (1h, 2h, 4h) pour rappeler de saisir les dépenses.
- **Fichiers**: `lib/notifications.ts`, `app/(tabs)/settings.tsx`

#### 9. Simulation de dépenses
- **Status**: ✅ Terminé
- **Description**: Tester des scénarios "What-if" sans enregistrer les dépenses. Voir l'impact sur le solde projeté.
- **Fichiers**: `app/(tabs)/simulation.tsx`, `hooks/useSimulation.ts`

---

## Features v2 (À venir)

### Synchronisation Cloud

#### 1. Setup Supabase
- **Status**: 🔜 Planifié
- **Description**: Configuration du projet Supabase (auth + database)
- **Priorité**: Haute

#### 2. Authentification
- **Status**: 🔜 Planifié
- **Description**: Login/Register avec email + password via Supabase Auth
- **Priorité**: Haute

#### 3. PIN local pour auth offline
- **Status**: 🔜 Planifié
- **Description**: PIN 4-6 chiffres hashé pour accès offline après premier login
- **Priorité**: Haute

#### 4. Sync automatique
- **Status**: 🔜 Planifié
- **Description**: Synchronisation des transactions locales vers Supabase en background
- **Priorité**: Haute

#### 5. Détection réseau
- **Status**: 🔜 Planifié
- **Description**: Détection de la connectivité pour déclencher la sync
- **Priorité**: Moyenne

---

## Features Post-MVP (Backlog)

### Budgets et objectifs
- **Status**: 💡 Idée
- **Description**: Définir des limites par catégorie, alertes quand budget dépassé

### Export des données
- **Status**: 💡 Idée
- **Description**: Export CSV/PDF pour analyse externe

### Récurrence
- **Status**: 💡 Idée
- **Description**: Dépenses fixes automatiques (loyer, abonnements)

### Multi-devises
- **Status**: 💡 Idée
- **Description**: Support Ariary + autres devises avec conversion

### Catégories personnalisées
- **Status**: 💡 Idée
- **Description**: Créer/modifier/supprimer des catégories custom

### Statistiques avancées
- **Status**: 💡 Idée
- **Description**: Graphiques par période, comparaisons mois par mois, tendances

---

## Légende

| Symbole | Signification |
|---------|---------------|
| ✅ | Terminé |
| 🔜 | Planifié (prochaine version) |
| 💡 | Idée (backlog) |
| 🚧 | En cours |

---

## Notes de version

### v1.0.0 (MVP)
- Gestion du solde
- Saisie de dépenses/revenus
- Catégorisation
- Dashboard avec graphique
- Historique paginé
- Thèmes de couleur
- Masquer le solde
- Rappels de notifications
- Simulation de dépenses

### v2.0.0 (Prévu)
- Authentification Supabase
- PIN local
- Synchronisation cloud
- Backup automatique
