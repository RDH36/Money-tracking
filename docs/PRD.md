# Product Requirements Document: Mitsitsy

## Product Vision

**Problem Statement**
À Madagascar, 99% des transactions se font en espèces. Les applications bancaires ne trackent que les retraits, pas les dépenses réelles. L'argent "disparaît" sans visibilité sur où il va. Excel est trop complexe à mettre en place pour un suivi quotidien.

**Solution**
Une application mobile simple permettant de saisir manuellement chaque dépense en temps réel, avec des rappels horaires pour ne rien oublier. L'utilisateur voit clairement où part son argent par catégorie et par période.

**Success Criteria**
- Tracker toutes les dépenses pendant 1 mois complet
- Visibilité sur chaque centime dépensé
- Temps de saisie d'une dépense < 10 secondes

## Target Users

### Primary Persona: Raymond (Usage Personnel)
- **Role**: Utilisateur individuel gérant ses finances personnelles
- **Context**: Économie cash à Madagascar
- **Pain Points**:
  - L'argent liquide "disparaît" sans trace
  - Excel trop complexe à configurer
  - Les apps bancaires ne voient pas les dépenses cash
  - Oubli des petites dépenses en fin de journée
- **Motivations**: Avoir une visibilité totale sur ses dépenses, chaque centime compte
- **Goals**: Savoir exactement où part son argent chaque mois

## Core Features (MVP)

### Must-Have Features

#### 1. Gestion du solde (Capital)
**Description**: L'utilisateur définit son solde initial (argent disponible). Chaque dépense saisie est automatiquement soustraite du solde. Possibilité d'ajouter de l'argent (retrait bancaire, salaire, etc.).
**User Value**: Voir en temps réel combien il reste à dépenser, pas juste ce qui est sorti.
**Success Metric**: Le solde affiché correspond au cash réel en poche à tout moment.

#### 2. Saisie rapide de dépense
**Description**: Interface simple pour enregistrer une dépense en quelques taps : montant, catégorie, note optionnelle. Doit être ultra-rapide.
**User Value**: Permet de tracker sur le moment sans friction, avant d'oublier.
**Success Metric**: Saisie complète en moins de 10 secondes.

#### 3. Catégorisation des dépenses
**Description**: Catégories prédéfinies (nourriture, transport, loisirs, factures, santé, autres) avec possibilité d'ajouter des catégories personnalisées.
**User Value**: Comprendre où va l'argent par type de dépense.
**Success Metric**: 100% des dépenses catégorisées.

#### 4. Rappels horaires
**Description**: Notifications push toutes les heures (personnalisable) rappelant de saisir les dépenses oubliées.
**User Value**: Ne jamais oublier une dépense, même petite.
**Success Metric**: Réduction des dépenses "oubliées" à zéro.

#### 5. Dashboard de visualisation
**Description**: Vue claire du solde actuel, des dépenses totales, par catégorie, et par période (jour/semaine/mois). Graphiques simples.
**User Value**: Répondre aux questions "combien me reste-t-il ?" et "où part mon argent ?" en un coup d'œil.
**Success Metric**: L'utilisateur consulte le dashboard au moins 1x/jour.

### Should-Have Features (Post-MVP)
- **Budgets et objectifs**: Définir des limites par catégorie
- **Export des données**: CSV/PDF pour analyse externe
- **Récurrence**: Dépenses fixes automatiques (loyer, abonnements)
- **Multi-devises**: Support Ariary + autres devises

## User Flows

### Onboarding: Configuration initiale
1. Première ouverture de l'app
2. Entre le solde initial (argent en poche actuellement)
3. Configure les rappels (fréquence)
4. Prêt à tracker

### Primary User Journey: Saisir une dépense
1. L'utilisateur reçoit un rappel ou ouvre l'app
2. Voit son solde actuel en haut
3. Tap sur "+" pour nouvelle dépense
4. Entre le montant
5. Sélectionne la catégorie
6. (Optionnel) Ajoute une note
7. Confirme → Dépense enregistrée, solde mis à jour

### Secondary User Journey: Ajouter de l'argent
1. Reçoit de l'argent (salaire, retrait, etc.)
2. Tap sur "+" puis "Ajouter au solde"
3. Entre le montant et la source
4. Confirme → Solde mis à jour

### Tertiary User Journey: Consulter ses finances
1. Ouvre l'app sur le dashboard
2. Voit le solde actuel en évidence
3. Voit le total dépensé (jour/semaine/mois)
4. Voit la répartition par catégorie
5. Peut filtrer par période
6. Peut voir le détail de chaque transaction

## Out of Scope (v1)

Explicitement NON inclus dans le MVP:
- Synchronisation bancaire
- Multi-utilisateurs / partage
- Budgets et objectifs d'épargne
- Reconnaissance de tickets (OCR)
- Version web/desktop
- Récurrence automatique

## Open Questions
- Quelles catégories par défaut inclure ?
- Fréquence des rappels configurable ou fixe à 1h ?
- Devise principale : Ariary (MGA) uniquement pour v1 ?

## Success Metrics

**Primary Metrics**:
- **Rétention 30 jours**: L'utilisateur saisit des dépenses pendant 30 jours consécutifs
- **Complétude**: 100% des dépenses réelles sont trackées (aucun "trou")

**Secondary Metrics**:
- **Fréquence de saisie**: Nombre de dépenses enregistrées par jour
- **Temps de saisie**: < 10 secondes par dépense
- **Consultation dashboard**: Au moins 1x/jour

## Timeline & Milestones
- **MVP Fonctionnel**: Le plus tôt possible
- **Test utilisateur**: Dès que les 4 features core sont prêtes
- **Itération**: Basée sur l'usage réel pendant 1 mois

## Technical Notes (pour ARCHI)
- Mobile-first (React Native avec Expo)
- Stockage local d'abord (offline-first, important pour Madagascar)
- Notifications push pour les rappels
- Base de données SQLite local + Supabase cloud sync
