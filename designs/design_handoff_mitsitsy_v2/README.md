# Handoff — Mitsitsy v2 (refonte UI/UX)

## Implementation Requirements (must-have for every screen)

> Règles non-négociables pour toute refonte v2. À lire **avant** d'écrire la moindre ligne — le HTML/JSX de ce bundle est mono-mode, mono-langue, mono-devise. Le codebase, lui, doit l'être tout autant que l'app v1.

1. **Dark mode** — chaque écran doit s'adapter aux deux schémas. Les tokens v2 exposent une variante claire ET une variante sombre via le hook `useV2()` de `constants/designTokensV2.ts` (basé sur `useEffectiveColorScheme`). **Les hex codés en dur dans les composants sont interdits**. Utiliser `const v2 = useV2()` puis `v2.bgBase`, `v2.brand`, etc.
2. **i18n (en / fr / mg)** — toute string visible passe par `useTranslation()` de `react-i18next`. Les nouvelles clés vont dans `lib/i18n/translations/{en,fr,mg}.json` (ajouter aux 3 locales). **Les chaînes françaises codées en dur sont interdites** — y compris les labels des composants v2 (`Compte`, `Catégorie`, `Voir tout`, `Choisir`, etc.).
3. **Devise** — utiliser le code devise actif via `useCurrency()` de `stores/settingsStore` et la fonction `formatMoney()` de `useAccounts`. Ne pas coder `Ar` en dur ; certains utilisateurs sont sur EUR/USD/MGA.
4. **Pluriels** — utiliser l'interpolation i18next (`{{count}}`) avec les variantes `_one` / `_other` (ex. `streakDays_one` / `streakDays_other`).
5. **Test minimal avant de fermer une refonte** — basculer le système en dark, basculer la langue (en/fr/mg), changer la devise. Si un seul écran casse → corriger avant de passer au suivant.

## Overview

Mitsitsy v2 est une **refonte complète** de l'app Money-tracking existante (`bubble-go.mg/money-tracking-app`, Expo + React Native + NativeWind + i18next). L'objectif : passer d'une app de tracking budgétaire générique à une app **éditoriale et émotionnelle** ciblée sur le marché malgache, avec une mascotte (Bubule), une typographie display sérif, une palette teal/ink confiante, et un onboarding empathique.

Le bundle contient **~30 écrans** organisés en 3 sections sur un design canvas :
1. **App principale** — Dashboard, Activité, Catégorie détail, Achievements, Settings, écrans secondaires
2. **States & flows** — alertes, modals, états vides, succès
3. **Onboarding** — flow émotionnel 9 étapes (Welcome → Quiz × 3 → Empathy → Solution → Wow demo → Setup soldes → Catégories)

## About the Design Files

Les fichiers de ce bundle sont des **références de design créées en HTML/JSX** (prototypes React inline transpilés via Babel standalone). Ce sont des **maquettes statiques pour montrer l'apparence et le comportement attendus**, **pas du code de production à copier tel quel**.

La mission est de **recréer ces designs dans le codebase Money-tracking existant** (Expo + React Native + NativeWind + TypeScript), en réutilisant ses patterns établis :
- Composants RN : `View`, `Text`, `Pressable`, `ScrollView`
- NativeWind / `theme.colors.*` pour les tokens
- `react-native-svg` + Lucide pour les icônes (le HTML utilise un SVG inline custom — voir `ui.jsx`)
- `i18next` pour les strings (toutes les copies du HTML sont en français — à intégrer dans `locales/fr/*.json`)
- `expo-router` pour la navigation
- Les illustrations Bubule existent déjà sous `assets/images/bubble-*.png` — **dans le HTML elles sont représentées par un SVG placeholder** (cercle jaune avec yeux/bouche), il faut les remplacer par les vraies images.

## Fidelity

**High-fidelity (hifi)** — couleurs, typo, espacements et tokens sont finaux et alignés sur le design system v2 documenté dans `tokens.js`. Les interactions (états selected/hover/disabled, badges, micro-animations) sont représentées statiquement mais doivent être implémentées en RN.

## Variantes choisies (Tweaks panel)

Le bundle expose un panneau de tweaks permettant d'explorer plusieurs directions visuelles. Les **valeurs validées** par le PO et à utiliser pour l'implémentation sont :

| Tweak | Valeur retenue | Implication |
|---|---|---|
| `headerStyle` | **`sans`** | Les **titres principaux et headlines utilisent `fontUI` (Inter)** en gras/extra-bold, **pas** la version sérif italique. Réservez `fontDisplay` (Instrument Serif) uniquement aux **KPI hero** (gros montants), aux **pull quotes** éditoriales (écran Empathy), et à quelques accents italiques ponctuels. La hiérarchie principale est sans-serif. |
| `background` | **`paper`** | Fond app `#F4F4F1` (warm off-white légèrement teinté), **pas** un blanc pur ni un fond sombre. C'est la valeur `bgBase` du `tokens.js`. Garde un toucher "papier" / éditorial. |
| `accent` | **`teal`** | Couleur d'accent = `brand: #0E8C82` (teal confident). C'est la valeur par défaut — pas d'autre teinte d'accent à appliquer. |

**À retenir côté implémentation RN :**
- Ne pas appliquer Instrument Serif sur les titres d'écran, les labels de section ou la nav. Inter partout, sauf KPI / pull quotes.
- Le fond global de toutes les pages est `#F4F4F1` (`bgBase`), surfaces élevées en blanc pur (`bgSurface: #FFFFFF`).
- L'accent teal `#0E8C82` est la seule couleur de marque active — pas de variantes coral/violet à supporter.

## Design Tokens

Source de vérité : `tokens.js` (objet `window.MTS_TOKENS`).

### Couleurs

| Token | Hex | Usage |
|---|---|---|
| `bgBase` | `#F4F4F1` | Fond app (warm off-white) |
| `bgSurface` | `#FFFFFF` | Cards, surfaces élevées |
| `bgRaised` | `#EDEDE7` | Sous-surfaces, inputs |
| `bgInk` | `#16201E` | Surfaces hero / dark accent |
| `bgInkSoft` | `#1F2A28` | Variante hero |
| `brand` | `#0E8C82` | Teal de marque (confident, less neon) |
| `brandDeep` | `#0A6B63` | Teal foncé pour text/borders |
| `brandSoft` | `rgba(14,140,130,0.10)` | Background tint |
| `brandTint` | `#E6F2F0` | Background tint plus solide |
| `ink` | `#0F1311` | Texte principal |
| `inkMuted` | `#5C6664` | Texte secondaire |
| `inkSubtle` | `#8B9491` | Captions, labels micro |
| `inkOnDark` | `#F5F5F1` | Texte sur surfaces ink |
| `inkOnDarkM` | `rgba(245,245,241,0.62)` | Texte secondaire sur ink |
| `good` | `#16A371` | Positif (revenus, success) |
| `warn` | `#C8851A` | Attention (75-90% budget) |
| `bad` | `#C8442C` | Danger (dépassement, dépenses) |
| `hairline` | `rgba(15,19,17,0.08)` | Borders subtils |
| `hairlineStrong` | `rgba(15,19,17,0.14)` | Borders visibles |

### Typographie

| Token | Stack | Usage |
|---|---|---|
| `fontDisplay` | `Instrument Serif, Cormorant Garamond, Georgia, serif` | Headlines, KPI, montants hero, titres éditoriaux |
| `fontUI` | `Inter, -apple-system, sans-serif` | UI, labels, body, micro-copy |
| `fontMono` | `JetBrains Mono, ui-monospace, monospace` | Codes, metadata technique |

**Patterns typographiques récurrents :**
- KPI hero : `fontDisplay` 38–48px, `letterSpacing: -1`, italique parfois
- Headlines : `fontDisplay` 24–28px, `letterSpacing: -0.5`
- Section labels : `fontUI` 10–11px, `fontWeight: 700`, `letterSpacing: 1.4–1.5`, `textTransform: uppercase`
- Body : `fontUI` 12–14px, `lineHeight: 1.4–1.5`
- Tabular numbers (montants) : `fontVariantNumeric: 'tabular-nums'` — **toujours** sur les chiffres financiers

### Spacing & radii

- Padding écran : 20px horizontal, 64px top, 36px bottom (safe area iOS comprise)
- Cards : `borderRadius: 14–18px`, `padding: 14–18px`
- Pills / badges : `borderRadius: 999px`, `padding: 6–10px × 10–14px`
- Buttons : `borderRadius: 14–999px` selon contexte
- Gap entre cards : 8–12px
- Gap entre sections : 16–24px

### Devise

Tous les montants en **MGA (Ariary malgache)**, format `1 420 000 Ar` (espace milliers FR + suffixe `Ar`). Le picker de devise (Wow demo) propose MGA / EUR / USD mais MGA est la valeur par défaut systématique.

## Screens / Views

### Section 01 — App principale

Tous les écrans sont en frame iPhone 400×870 avec status bar iOS. Tab bar 4 entrées en bas : Dashboard / Activité / Achievements / Settings.

#### Dashboard (`screens-dashboard.jsx` → `MTS_DashboardA`, `MTS_DashboardB`)
- **A** : Hero KPI "solde du mois" en `fontDisplay` 48px, sparkline mini, 3 stats inline (revenus / dépenses / épargne), liste 4 transactions récentes
- **B** : variante avec card "Cette semaine" en haut + ring chart de répartition catégories

#### Activité (`screens-activity.jsx` → `MTS_Activity`)
Page **unifiée** (Today + bouton Rapports/Calendrier en haut → liste budgets par catégorie au milieu → CTA "Voir tout"). Les transactions récentes ont été retirées de cette page (elles vivent sur le Dashboard).

Budgets affichés en **mode seuil** : barre de progression colorée selon le % consommé (`good` < 75%, `warn` 75–90%, `bad` > 90%), montant restant à droite.

#### Catégorie détail (`screens-categories.jsx`)
- Header avec icône + nom + budget mensuel
- Graphe d'évolution mensuelle (barres)
- Liste des transactions de la catégorie groupées par jour

#### Achievements (`screens-achievements.jsx`)
- Streak counter en hero
- Grille de badges 3 colonnes (locked/unlocked)
- Liste de challenges actifs avec progress bars
- Section "Cette semaine" avec mini-stats

#### Settings (`screens-settings.jsx`)
Liste éditoriale style menu Notion : sections **Compte / Préférences / Notifications / Données / Légal**, chaque ligne en `fontDisplay` italique + chevron.

#### Autres écrans (`screens-other.jsx`)
- Écran calendrier mensuel (heatmap des dépenses)
- Écran rapports plein (graphes annuels)
- Modal d'ajout transaction (clavier numérique custom)

### Section 02 — States & flows
Modals d'alerte budget, états vides (pas encore de transactions), confirmation de suppression, success states (objectif atteint).

### Section 03 — Onboarding (`screens-onboarding-1.jsx` + `screens-onboarding-2.jsx`)

Flow 9 étapes, progress dots en haut de chaque écran.

1. **Welcome** (`MTS_OnbWelcome`) — Bubule jaune centrée, speech bubble "Salama ! Je suis Bubule…", emojis flottants en filigrane (💰📊🎯), CTA "Commencer"
2. **Quiz Frustration** (`MTS_OnbQuiz1`) — "Qu'est-ce qui te frustre le plus avec l'argent ?" 4 options émoji avec sous-titre hint, selected state teal
3. **Quiz Durée** (`MTS_OnbQuiz2`) — "Tu veux changer ça pour combien de temps ?" 4 options "Quelques semaines → Toute ma vie"
4. **Quiz Objectif** (`MTS_OnbQuiz3`) — "Tu épargnes pour quoi ?" voyage / logement / épargne sécurité / études
5. **Empathy** (`MTS_OnbEmpathy`) — Pull quote éditoriale "72%" en `fontDisplay` italique sur fond ink, sous-titre "des Malgaches finissent le mois sans savoir où est passé l'argent"
6. **Solution** (`MTS_OnbSolution`) — 3 bénéfices personnalisés numérotés 01/02/03 (Visualise / Alertes / Habitudes)
7. **Wow demo** (`MTS_OnbWow`) — Picker devise (MGA actif) + solde live teal (1 000 000 → 977 000 après 2 dépenses cochées) + 4 dépenses tap-to-add
8. **Wow Report** (`MTS_OnbWowReport`) — Bottom sheet avec confettis, mini-rapport 3 catégories façon ticket de caisse
9. **Balance setup** (`MTS_OnbBalance`) — 2 cartes : Banque (1 420 000 Ar avec curseur clignotant) + Cash (vide), tip card teal "Tu pourras ajouter d'autres comptes…"
10. **Categories** (`MTS_OnbCategories`) — Grille 2 colonnes, 8 catégories (5 sélectionnées par défaut + 3 en pointillé non-sél), bouton "Créer sur-mesure", CTA "Terminer · 5 catégories"

## Interactions & Behavior

### Animations attendues
- **Solde live** (Wow demo) : count-up sur changement de balance, easing `easeOutCubic`, ~400ms
- **Tap sur dépense** : check apparaît, opacity passe à 0.55, balance recalcule
- **Progress dots** : transition douce du dot actif (largeur 24px → 8px sur les inactifs)
- **Modal d'alerte budget** : slide up depuis le bas + dim background
- **Bottom sheet Wow Report** : slide up + confettis SVG en fade-in stagger
- **Curseur clignotant** sur input balance : `animation: blink 1s infinite`

### Navigation
- Onboarding : flow linéaire avec back button discret en haut à gauche (sauf Welcome)
- App principale : tab bar en bas, header par écran avec optionnel back button + actions (filtre, +)

### États
- **Selected** (quiz options) : fond `brandSoft`, border `brand`, check teal
- **Disabled** : opacity 0.4
- **Pressed** : opacity 0.7 (Pressable RN par défaut)
- **Empty** : illustration Bubule + copy + CTA primaire

## State Management

À implémenter avec les patterns du codebase existant (probablement Zustand ou React Context — vérifier dans `money-tracking-app`).

État onboarding nécessaire :
- `onboarding.completed: boolean`
- `onboarding.currentStep: 1..9`
- `onboarding.answers: { frustration, duration, goal }` (utilisés pour personnaliser la page Solution)
- `onboarding.demoExpenses: string[]` (ids des dépenses tap dans Wow)
- `onboarding.balances: { bank: number, cash: number }`
- `onboarding.selectedCategories: string[]`

## Assets

### À créer / lifter depuis le codebase existant
- **Mascotte Bubule** : déjà dans `assets/images/bubble-*.png` du codebase. Le HTML a un placeholder SVG (cercle jaune avec yeux + bouche) — utilisez les **vraies illustrations** : `bubble-happy.png`, `bubble-help.png`, `bubble-thinking.png`, `bubble-sad.png` selon le mood passé en prop.
- **Icônes** : le HTML utilise un système custom dans `ui.jsx` (SVG inline). Dans le codebase, utilisez **Lucide React Native** ou les icônes existantes. Mapping :
  - `fork` → `Utensils`
  - `car` → `Car`
  - `bag` → `ShoppingBag`
  - `home2` → `Home`
  - `leaf` → `Leaf`
  - `sparkle` → `Sparkles`
  - `receipt` → `Receipt`
  - `bank` → `Building2` ou `Landmark`
  - `cash` → `Banknote`
  - `bell2` → `Bell`
  - `trophy` → `Trophy`
  - `pulse` → `Activity`
  - `arrowDown` → `ArrowDown`

### Fonts
- **Instrument Serif** : Google Fonts (`@expo-google-fonts/instrument-serif`)
- **Inter** : déjà probablement chargée dans le codebase
- Pour RN, charger via `useFonts` de `expo-font`

## Files (HTML reference bundle)

| Fichier | Contenu |
|---|---|
| `Mitsitsy v2.html` | Entry point — design canvas + tous les imports JSX |
| `tokens.js` | Design tokens (colors, fonts) — **source de vérité** |
| `ui.jsx` | Icônes SVG inline + helpers (`Money`, `Card`, `Icon`) |
| `design-canvas.jsx` | Starter component du canvas (ne pas porter — outil de présentation uniquement) |
| `ios-frame.jsx` | Bezel iPhone (ne pas porter) |
| `tweaks-panel.jsx` | Panneau de tweaks dev (ne pas porter) |
| `screens-dashboard.jsx` | Dashboard A & B |
| `screens-activity.jsx` | Page Activité unifiée (budgets + today) |
| `screens-categories.jsx` | Détail catégorie + grille catégories |
| `screens-achievements.jsx` | Streaks, badges, challenges |
| `screens-settings.jsx` | Settings menu éditorial |
| `screens-other.jsx` | Calendrier, rapports, modals, états |
| `screens-onboarding-1.jsx` | Welcome + 3 quiz + Empathy |
| `screens-onboarding-2.jsx` | Solution + Wow + Wow Report + Balance + Categories |

**Pour ouvrir le bundle :** ouvrir `Mitsitsy v2.html` dans un navigateur — vous verrez tous les écrans sur un canvas zoomable, et pouvez cliquer sur n'importe quel artboard pour le mettre en focus plein écran (← / → / Esc pour naviguer).

## Notes pour l'implémentation

- **Ne pas copier le code JSX du bundle directement** : il utilise des props inline-style + des helpers spécifiques au prototype (window.MTS_*). Recréez chaque écran en composants RN propres avec NativeWind.
- **Branche budgets** : la version actuelle utilise les **budgets à seuil** (limite par catégorie + barre de progression + alertes), **pas les enveloppes**. La logique métier reste celle du codebase existant.
- **i18n** : toutes les copies sont en français. Extrayez-les dans `locales/fr/*.json` et créez les clés en/mg correspondantes.
- **Accessibilité** : ajoutez `accessibilityLabel`, `accessibilityRole`, et respectez les hit targets ≥ 44px (déjà respecté dans le design).
- **Tests visuels** : comparez chaque écran RN avec son équivalent HTML côte-à-côte, en particulier les KPI hero (taille, italique, tabular-nums) et les progress bars de budget.
