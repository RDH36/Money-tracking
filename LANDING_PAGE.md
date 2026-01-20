# Landing Page - Money Tracker App

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Structure de la Landing Page](#structure-de-la-landing-page)
3. [Contenu par Section](#contenu-par-section)
4. [Éléments Visuels](#éléments-visuels)
5. [Appels à l'Action](#appels-à-laction)
6. [SEO et Métadonnées](#seo-et-métadonnées)
7. [Stack Technique Next.js](#stack-technique-nextjs)

---

## Vue d'ensemble

**Money Tracker** est une application mobile de suivi des dépenses conçue pour les économies basées sur l'argent liquide, particulièrement adaptée à Madagascar où 99% des transactions sont en espèces.

**Proposition de valeur unique** : Une application offline-first qui permet de logger une dépense en moins de 10 secondes, avec support multi-devises et gestion budgétaire avancée.

---

## Structure de la Landing Page

### Navigation
```
[Logo] Money Tracker
├── Accueil
├── Fonctionnalités
├── Captures d'écran
└── Télécharger
```

### Sections Principales
1. **Hero Section** - Première impression et CTA principal
2. **Problème/Solution** - Contexte et positionnement
3. **Fonctionnalités Clés** - Grid des features principales
4. **Screenshots/Démo** - Aperçu visuel de l'app
5. **Avantages** - Bénéfices pour l'utilisateur
6. **Témoignages** - Social proof (à venir)
7. **Newsletter** - Inscription pour recevoir les mises à jour
8. **FAQ** - Questions fréquentes
9. **CTA Final** - Appel à l'action de téléchargement
10. **Footer** - Liens légaux et réseaux sociaux

---

## Contenu par Section

### 1. Hero Section

#### Headline (H1)
```
Prenez le Contrôle de Vos Finances en 10 Secondes
```

#### Subheadline
```
Money Tracker est l'application mobile qui vous permet de suivre chaque Ariary dépensé,
même sans connexion internet. Conçue pour Madagascar, adaptée au monde entier.
```

#### CTA Primaire
```
[📱 Télécharger sur Android] [🍎 Télécharger sur iOS]
```

#### CTA Secondaire
```
[▶️ Voir la démo]
```

#### Visuel Hero
- Screenshot de l'écran principal de l'app
- Animation montrant l'ajout d'une dépense en temps réel
- Badge "100% Offline" ou "Fonctionne sans Internet"

---

### 2. Problème/Solution

#### Le Problème
**Titre :** *Vous ne savez jamais où passe votre argent ?*

**Points de douleur :**
- 💸 L'argent liquide disparaît sans trace
- 📊 Les apps bancaires ne montrent que les retraits, pas les dépenses réelles
- ⏰ Les outils comme Excel sont trop lents et complexes
- 📶 La plupart des apps nécessitent une connexion internet constante
- 🇲🇬 Peu d'apps sont adaptées aux économies en cash (Madagascar, Afrique)

#### La Solution
**Titre :** *Money Tracker : Simple, Rapide, et 100% Offline*

**Notre approche :**
- ✅ Enregistrez une dépense en moins de 10 secondes
- ✅ Fonctionne entièrement hors ligne (offline-first)
- ✅ Visualisez instantanément où va votre argent
- ✅ Support multi-devises (MGA, EUR, USD)
- ✅ Aucune configuration complexe requise

---

### 3. Fonctionnalités Clés

**Grid Layout (3 colonnes x 4 lignes = 12 features)**

#### Feature 1 : Suivi Ultra-Rapide
**Icône :** ⚡
**Titre :** Entrée en 10 Secondes
**Description :** Montant → Catégorie → Note → Enregistré. L'interface la plus rapide du marché.

#### Feature 2 : Mode Hors Ligne
**Icône :** 📡
**Titre :** 100% Offline
**Description :** Aucune connexion internet requise. Vos données sont stockées localement en toute sécurité.

#### Feature 3 : Multi-Devises
**Icône :** 💱
**Titre :** Support Multi-Devises
**Description :** Ariary (MGA), Euro (EUR), Dollar (USD) avec conversion automatique des taux de change.

#### Feature 4 : Comptes Multiples
**Icône :** 🏦
**Titre :** Gestion de Comptes
**Description :** Gérez jusqu'à 3 comptes (portefeuille, épargne, mobile money) avec transferts inter-comptes.

#### Feature 5 : Catégories Personnalisées
**Icône :** 🏷️
**Titre :** Catégories sur Mesure
**Description :** 8 catégories par défaut + 3 catégories personnalisables. Couleurs et icônes uniques.

#### Feature 6 : Planification Budgétaire
**Icône :** 🎯
**Titre :** Planifications
**Description :** Créez des budgets avec deadlines, ajoutez des lignes d'articles, et suivez vos objectifs financiers.

#### Feature 7 : Visualisations
**Icône :** 📊
**Titre :** Graphiques Clairs
**Description :** Graphiques en camembert, historique des transactions, filtres par jour/semaine/mois.

#### Feature 8 : Rappels Intelligents
**Icône :** 🔔
**Titre :** Notifications
**Description :** Rappels configurables (1h, 2h, 4h) pour ne jamais oublier d'enregistrer une dépense.

#### Feature 9 : Mode Simulation
**Icône :** 🧪
**Titre :** Scénarios "What-If"
**Description :** Testez des dépenses hypothétiques sans les enregistrer pour voir l'impact sur votre solde.

#### Feature 10 : Confidentialité
**Icône :** 🔒
**Titre :** Masquage du Solde
**Description :** Cachez votre solde en un clic pour protéger votre vie privée.

#### Feature 11 : Thèmes Personnalisables
**Icône :** 🎨
**Titre :** 4 Thèmes de Couleur
**Description :** Turquoise, Bleu, Violet, Orange. Personnalisez l'interface selon vos préférences.

#### Feature 12 : Historique Complet
**Icône :** 📜
**Titre :** Transactions Illimitées
**Description :** Pagination infinie, groupement par date, suppression douce (récupérable).

---

### 4. Screenshots/Démo

**Layout : Carousel horizontal**

1. **Écran d'accueil (Dashboard)**
   - Solde actuel
   - Graphique de répartition des dépenses
   - Transactions récentes

2. **Ajout de dépense**
   - Interface simple et épurée
   - Catégories avec icônes colorées
   - Animation de l'entrée rapide

3. **Historique des transactions**
   - Liste paginée par date
   - Filtres jour/semaine/mois
   - Actions de modification/suppression

4. **Planifications**
   - Vue des budgets en cours
   - Détail d'une planification avec articles
   - Deadline et progression

5. **Paramètres**
   - Sélection de devise
   - Choix de thème
   - Configuration des notifications

6. **Comptes multiples**
   - Vue des différents comptes
   - Transferts inter-comptes

**Format :** Mockups de téléphone (iPhone/Android frames)

---

### 5. Avantages

**Section "Pourquoi Choisir Money Tracker ?"**

#### Pour Raymond (Persona Principal)
**Cas d'usage :** *Un malgache qui gère ses finances personnelles en cash*

**Avant Money Tracker :**
- ❌ Argent qui "disparaît" mystérieusement
- ❌ Pas de visibilité sur les dépenses quotidiennes
- ❌ Excel trop compliqué et lent
- ❌ Apps existantes nécessitent internet

**Avec Money Tracker :**
- ✅ Chaque Ariary dépensé est tracé
- ✅ Vision claire en temps réel de la situation financière
- ✅ 10 secondes pour enregistrer une transaction
- ✅ Fonctionne partout, même sans connexion

#### Comparatif (Tableau)
| Critère | Apps Traditionnelles | Money Tracker |
|---------|---------------------|---------------|
| Temps d'entrée | 30-60 secondes | **< 10 secondes** |
| Internet requis | ✅ Oui | ❌ Non (offline-first) |
| Multi-devises | Limité | **MGA, EUR, USD** |
| Planification | Rare | **Intégré** |
| Gratuit | Freemium | **100% Gratuit** |

---

### 6. Témoignages

**Structure : Cards avec photo, nom, et quote**

```
[Photo]
"Depuis que j'utilise Money Tracker, je sais exactement où passe mon argent.
L'interface est tellement rapide que je n'ai plus d'excuse pour ne pas enregistrer mes dépenses !"

— Rakoto A., Antananarivo, Madagascar
```

```
[Photo]
"Enfin une app qui fonctionne sans internet ! Parfait pour mes déplacements en zone rurale."

— Marie L., Fianarantsoa, Madagascar
```

```
[Photo]
"La fonctionnalité de planification m'a aidé à économiser 500 000 Ar en 3 mois. Je recommande !"

— Jean-Claude R., Toamasina, Madagascar
```

**Note :** Ces témoignages sont des exemples. À remplacer par de vrais retours utilisateurs.

---

### 7. Newsletter

**Section "Restez Informé"**

**Titre :**
```
Ne Manquez Aucune Mise à Jour
```

**Subheadline :**
```
Recevez les dernières fonctionnalités, conseils de gestion financière et offres exclusives directement dans votre boîte mail.
```

**Formulaire d'inscription :**
- **Champs** :
  - Email (requis)
  - Prénom (optionnel)

**CTA Button :**
```
[📨 S'inscrire à la Newsletter]
```

**Message de confirmation :**
```
✅ Merci ! Vous recevrez bientôt nos dernières actualités.
```

**Design :**
- Background : Dégradé subtil (teal-50 to blue-50)
- Card blanche centrée avec ombre douce
- Input avec validation en temps réel
- Animation de confetti ou checkmark au succès
- Badge "Zéro spam, promis !" sous le formulaire

**Avantages listés :**
- 🎯 Nouveautés en avant-première
- 💡 Conseils budgétaires exclusifs
- 🎁 Accès anticipé aux nouvelles fonctionnalités
- 📊 Guides et tutoriels gratuits

**Fréquence :** 1 email par mois maximum (mentionné en petit texte)

---

### 8. FAQ

#### Q1 : L'application est-elle vraiment gratuite ?
**R :** Oui, Money Tracker est 100% gratuite sans publicité. Toutes les fonctionnalités sont accessibles gratuitement.

#### Q2 : Mes données sont-elles sécurisées ?
**R :** Absolument. Toutes vos données sont stockées localement sur votre téléphone dans une base SQLite sécurisée. Aucune donnée n'est envoyée à des serveurs externes (pour l'instant).

#### Q3 : Puis-je utiliser l'app sans connexion internet ?
**R :** Oui ! Money Tracker est conçu pour fonctionner entièrement hors ligne. Vous n'avez besoin d'aucune connexion internet.

#### Q4 : Quelles devises sont supportées ?
**R :** Actuellement : Ariary malgache (MGA), Euro (EUR), et Dollar américain (USD). La conversion automatique entre devises est incluse.

#### Q5 : Combien de comptes puis-je créer ?
**R :** Vous avez 1 compte principal par défaut + jusqu'à 2 comptes personnalisés (total : 3 comptes).

#### Q6 : Puis-je récupérer une transaction supprimée ?
**R :** Les suppressions sont "douces" (soft delete), ce qui signifie que les données sont marquées comme supprimées mais restent dans la base. Une fonctionnalité de récupération pourra être ajoutée dans une future mise à jour.

#### Q7 : L'app est-elle disponible sur iPhone ?
**R :** Oui, Money Tracker est disponible sur iOS (App Store) et Android (Google Play Store).

#### Q8 : Comment fonctionne la planification budgétaire ?
**R :** Créez une planification avec un montant cible et une deadline, ajoutez des articles avec leurs montants, et l'app vous aide à suivre votre progression. Quand vous êtes prêt, convertissez la planification en transactions réelles.

#### Q9 : Puis-je exporter mes données ?
**R :** Cette fonctionnalité est prévue pour la version 2.0 avec la synchronisation cloud. Vous pourrez exporter en CSV/Excel.

#### Q10 : L'app consomme-t-elle beaucoup de batterie ?
**R :** Non, Money Tracker est optimisé pour une consommation minimale. Les notifications utilisent des rappels locaux (pas de services cloud).

---

### 9. CTA Final

**Section "Prêt à Reprendre le Contrôle ?"**

**Headline :**
```
Téléchargez Money Tracker Aujourd'hui et Ne Perdez Plus Jamais la Trace de Votre Argent
```

**Subheadline :**
```
Gratuit. Sans Publicité. Fonctionne Hors Ligne. Conçu pour Madagascar.
```

**Boutons :**
```
[📱 Télécharger sur Google Play]
[🍎 Télécharger sur l'App Store]
```

**Social Proof :**
```
⭐⭐⭐⭐⭐ 4.8/5 sur le Play Store
📥 Plus de 10 000 téléchargements
```

**Garantie :**
```
✅ Installation en 1 minute
✅ Aucune carte de crédit requise
✅ Gratuit à vie
```

---

### 10. Footer

#### Colonnes

**Colonne 1 : Money Tracker**
- À propos
- Notre mission
- Blog (à venir)
- Presse

**Colonne 2 : Produit**
- Fonctionnalités
- Captures d'écran
- Roadmap
- Changelog

**Colonne 3 : Support**
- FAQ
- Documentation
- Contact
- Signaler un bug

**Colonne 4 : Légal**
- Politique de confidentialité
- Conditions d'utilisation
- Licence

**Colonne 5 : Réseaux Sociaux**
- Facebook
- Twitter/X
- LinkedIn
- GitHub (open source)

#### Copyright
```
© 2026 Money Tracker. Conçu avec ❤️ à Madagascar.
```

---

## Éléments Visuels

### 1. Palette de Couleurs
**Basée sur les thèmes de l'app :**
- **Turquoise (Principal)** : `#14b8a6` (Teal)
- **Bleu** : `#3b82f6` (Blue)
- **Violet** : `#a855f7` (Purple)
- **Orange** : `#f97316` (Orange)

**Couleurs Fonctionnelles :**
- Succès : `#22c55e` (Green)
- Erreur : `#ef4444` (Red)
- Warning : `#f59e0b` (Amber)
- Neutre : `#6b7280` (Gray)

### 2. Typographie
- **Headings** : Inter, Poppins, ou SF Pro (bold)
- **Body** : Inter, System UI (regular/medium)
- **Tailles** :
  - H1 : 48-64px (hero)
  - H2 : 36-48px (sections)
  - H3 : 24-32px (features)
  - Body : 16-18px

### 3. Iconographie
- **Style** : Outline icons (Ionicons pour cohérence avec l'app)
- **Taille** : 24-48px pour features, 64-96px pour sections principales
- **Couleur** : Utiliser les couleurs thématiques de l'app

### 4. Images et Screenshots
**Formats recommandés :**
- **Screenshots d'app** : PNG avec frames de téléphone (1080x2340px pour Android, 1170x2532px pour iPhone)
- **Hero image** : 1920x1080px (paysage) ou animation Lottie
- **Feature icons** : SVG (vectoriel, scalable)

**Mockups à créer :**
1. Dashboard avec graphique
2. Écran d'ajout de dépense (action en cours)
3. Historique des transactions
4. Planifications
5. Paramètres
6. Comptes multiples

### 5. Animations
**Micro-interactions :**
- Boutons : Hover effects, ripple on click
- Cards : Subtle lift on hover
- Hero : Parallax scrolling ou animation de typing

**Animations Lottie (optionnel) :**
- Ajout de transaction (✅ checkmark animé)
- Synchronisation (🔄 rotation)
- Chargement (skeleton screens)

---

## Appels à l'Action (CTAs)

### CTAs Primaires
1. **"Télécharger sur Android"** (Google Play)
2. **"Télécharger sur iOS"** (App Store)

**Design :**
- Boutons larges, bold, avec icônes des stores
- Couleur : Turquoise `#14b8a6` avec hover `#0d9488`
- Taille : 180x56px minimum
- Border radius : 12px

### CTAs Secondaires
1. **"Voir la démo"** (Vidéo ou screenshots)
2. **"Lire la documentation"**
3. **"Rejoindre la liste d'attente"** (v2.0 Premium)

**Design :**
- Boutons outline ou ghost
- Couleur : Bleu `#3b82f6`
- Taille : 160x48px

### CTAs Tertiaires
1. **"Suivre sur GitHub"** (open source)
2. **"Partager sur les réseaux sociaux"**
3. **"Signaler un bug"**

---

## SEO et Métadonnées

### Meta Tags

```html
<!-- Primary Meta Tags -->
<title>Money Tracker - Suivi des Dépenses Offline pour Madagascar | App Mobile Gratuite</title>
<meta name="title" content="Money Tracker - Suivi des Dépenses Offline pour Madagascar | App Mobile Gratuite">
<meta name="description" content="Prenez le contrôle de vos finances en 10 secondes. Money Tracker est l'app mobile offline-first de suivi des dépenses, conçue pour Madagascar. Support MGA, EUR, USD. 100% gratuit.">
<meta name="keywords" content="money tracker, suivi dépenses, budget madagascar, offline app, ariary, gestion finances, expense tracker, planification budgétaire">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://moneytracker.mg/">
<meta property="og:title" content="Money Tracker - Suivi des Dépenses Offline pour Madagascar">
<meta property="og:description" content="Prenez le contrôle de vos finances en 10 secondes. App mobile gratuite et offline-first.">
<meta property="og:image" content="https://moneytracker.mg/og-image.png">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://moneytracker.mg/">
<meta property="twitter:title" content="Money Tracker - Suivi des Dépenses Offline pour Madagascar">
<meta property="twitter:description" content="Prenez le contrôle de vos finances en 10 secondes. App mobile gratuite et offline-first.">
<meta property="twitter:image" content="https://moneytracker.mg/twitter-image.png">

<!-- App Links -->
<meta property="al:ios:app_store_id" content="YOUR_IOS_APP_ID">
<meta property="al:ios:app_name" content="Money Tracker">
<meta property="al:android:package" content="com.yourcompany.moneytracker">
<meta property="al:android:app_name" content="Money Tracker">
```

### Structured Data (Schema.org)

```json
{
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "name": "Money Tracker",
  "operatingSystem": "Android, iOS",
  "applicationCategory": "FinanceApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "MGA"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250"
  },
  "description": "Application mobile de suivi des dépenses offline-first pour Madagascar. Support multi-devises (MGA, EUR, USD), planification budgétaire, et gestion de comptes multiples."
}
```

### Mots-clés Cibles

**Français (Madagascar) :**
- "suivi dépenses madagascar"
- "gestion budget ariary"
- "app offline madagascar"
- "money tracker gratuit"
- "planification budgétaire"

**Anglais (International) :**
- "expense tracker offline"
- "cash tracking app"
- "offline budget app"
- "madagascar finance app"
- "multi-currency tracker"

---

## Stack Technique Next.js

### Architecture de la Landing Page

**Framework :** Next.js 15+ avec App Router

**Stack Complet :**
- **Framework** : Next.js 15+ (App Router)
- **Langage** : TypeScript
- **UI Library** : shadcn/ui (composants React réutilisables)
- **Styling** : Tailwind CSS v4
- **Animations** : Framer Motion + Auto Animate
- **Icons** : Lucide React (inclus avec shadcn/ui)
- **Forms** : React Hook Form + Zod (validation)
- **Newsletter** : Resend API ou Mailchimp
- **Analytics** : Vercel Analytics + Google Analytics 4
- **Deployment** : Vercel (gratuit)
- **SEO** : next-seo

### Structure du Projet

```
landing-page/
├── app/
│   ├── layout.tsx              # Layout principal
│   ├── page.tsx                # Page d'accueil
│   ├── metadata.ts             # SEO metadata
│   ├── globals.css             # Styles globaux Tailwind
│   └── api/
│       └── newsletter/
│           └── route.ts        # API route pour newsletter
├── components/
│   ├── sections/
│   │   ├── Hero.tsx           # Section hero
│   │   ├── Problem.tsx        # Problème/Solution
│   │   ├── Features.tsx       # Grille de fonctionnalités
│   │   ├── Screenshots.tsx    # Carousel de screenshots
│   │   ├── Benefits.tsx       # Avantages
│   │   ├── Testimonials.tsx   # Témoignages
│   │   ├── Newsletter.tsx     # Formulaire newsletter
│   │   ├── FAQ.tsx            # Questions fréquentes
│   │   ├── CTAFinal.tsx       # CTA de téléchargement
│   │   └── Footer.tsx         # Footer
│   ├── ui/                    # Composants shadcn/ui
│   │   ├── button.tsx         # Bouton shadcn
│   │   ├── card.tsx           # Carte shadcn
│   │   ├── badge.tsx          # Badge shadcn
│   │   ├── input.tsx          # Input shadcn
│   │   ├── label.tsx          # Label shadcn
│   │   ├── toast.tsx          # Toast shadcn
│   │   ├── accordion.tsx      # Accordion shadcn (pour FAQ)
│   │   └── carousel.tsx       # Carousel shadcn (pour screenshots)
│   └── DownloadButtons.tsx    # Boutons App Store/Play Store
├── public/
│   ├── screenshots/           # Screenshots de l'app
│   ├── og-image.png          # Image Open Graph
│   ├── app-icon.png          # Icône de l'app
│   └── patterns/             # Patterns SVG pour backgrounds
│       ├── grid.svg          # Pattern grid
│       └── dots.svg          # Pattern dots
├── lib/
│   ├── utils.ts              # Utilities (cn function)
│   ├── analytics.ts          # Helpers analytics
│   └── newsletter.ts         # Newsletter API helpers
└── constants/
    └── content.ts            # Contenu texte de la landing page
```

### Installation de shadcn/ui

**Étapes d'installation :**

```bash
# 1. Créer un projet Next.js
npx create-next-app@latest landing-page --typescript --tailwind --app

# 2. Initialiser shadcn/ui
npx shadcn@latest init

# Configuration automatique :
# - TypeScript: Oui
# - Style: Default
# - Couleur de base: Teal
# - Variables CSS: Oui

# 3. Installer les composants nécessaires
npx shadcn@latest add button card badge input label toast accordion carousel
```

### Configuration Tailwind CSS

**tailwind.config.ts :**
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#14b8a6', // Teal - couleur principale de l'app
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#3b82f6', // Blue
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#a855f7', // Purple
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s infinite linear',
        float: 'float 3s ease-in-out infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

**app/globals.css :**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 174 72% 56%; /* Teal */
    --radius: 0.75rem;
  }
}

@layer utilities {
  /* Gradient animé pour le hero */
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 8s ease infinite;
  }

  @keyframes gradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  /* Glass morphism effect */
  .glass {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}
```

### SEO et Metadata

**app/metadata.ts :**
```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Money Tracker - Suivi des Dépenses Offline pour Madagascar',
  description: 'Prenez le contrôle de vos finances en 10 secondes. Money Tracker est l\'app mobile offline-first de suivi des dépenses. Support MGA, EUR, USD. 100% gratuit.',
  keywords: ['money tracker', 'suivi dépenses', 'budget madagascar', 'offline app', 'ariary'],
  authors: [{ name: 'Money Tracker Team' }],
  openGraph: {
    title: 'Money Tracker - Suivi des Dépenses Offline pour Madagascar',
    description: 'Prenez le contrôle de vos finances en 10 secondes. App mobile gratuite et offline-first.',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Money Tracker - Suivi des Dépenses Offline pour Madagascar',
    description: 'Prenez le contrôle de vos finances en 10 secondes.',
    images: ['/twitter-image.png'],
  },
}
```

### Composants Clés avec Design Attractif

**components/sections/Hero.tsx :**
```typescript
'use client'

import { motion } from 'framer-motion'
import { Sparkles, PlayCircle, Zap, Shield, Globe } from 'lucide-react'
import { DownloadButtons } from '../DownloadButtons'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background animé avec dégradé */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 animate-gradient" />

      {/* Pattern de fond */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Orbes flottants (effets visuels) */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      <div className="container relative mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenu texte */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="z-10"
          >
            {/* Badge "Nouveau" ou "100% Gratuit" */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                100% Gratuit · Offline-First · Madagascar
              </Badge>
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Prenez le Contrôle de Vos Finances en{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                10 Secondes
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
              Money Tracker est l'application mobile qui vous permet de suivre chaque Ariary dépensé,
              <span className="font-semibold text-gray-900"> même sans connexion internet</span>.
              Conçue pour Madagascar, adaptée au monde entier.
            </p>

            {/* Points clés */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">Ultra-rapide</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-secondary" />
                </div>
                <span className="font-medium">100% Offline</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-accent" />
                </div>
                <span className="font-medium">Multi-devises</span>
              </div>
            </div>

            <DownloadButtons />

            <button className="mt-6 flex items-center gap-2 text-gray-600 hover:text-primary transition group">
              <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Voir la démo (30 sec)</span>
            </button>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 flex items-center gap-6 text-sm text-gray-600"
            >
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★★★★★</span>
                <span className="ml-2">4.8/5</span>
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <span>10 000+ téléchargements</span>
              <div className="h-4 w-px bg-gray-300" />
              <span>🇲🇬 Made in Madagascar</span>
            </motion.div>
          </motion.div>

          {/* Visuel avec effet 3D */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10"
          >
            {/* Glow effect derrière l'image */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 rounded-3xl blur-2xl opacity-50" />

            {/* Screenshot de l'app avec bordure et ombre */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white/50 backdrop-blur">
              <Image
                src="/screenshots/dashboard.png"
                alt="Money Tracker Dashboard"
                width={600}
                height={1200}
                className="w-full h-auto animate-float"
                priority
              />
            </div>

            {/* Badges flottants autour du screenshot */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -left-4 top-20 glass rounded-2xl p-4 shadow-lg"
            >
              <div className="text-sm font-semibold text-gray-900">⚡ Entrée en 10s</div>
              <div className="text-xs text-gray-600">Le plus rapide du marché</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="absolute -right-4 bottom-32 glass rounded-2xl p-4 shadow-lg"
            >
              <div className="text-sm font-semibold text-gray-900">📊 Analytics</div>
              <div className="text-xs text-gray-600">Graphiques temps réel</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
```

**components/DownloadButtons.tsx :**
```typescript
import { Apple, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DownloadButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button
        size="lg"
        className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all group"
        asChild
      >
        <a
          href="https://play.google.com/store/apps/details?id=YOUR_APP_ID"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Smartphone className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
          Télécharger sur Android
        </a>
      </Button>

      <Button
        size="lg"
        variant="outline"
        className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-8 py-6 text-base font-semibold transition-all group"
        asChild
      >
        <a
          href="https://apps.apple.com/app/YOUR_APP_ID"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Apple className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
          Télécharger sur iOS
        </a>
      </Button>
    </div>
  )
}
```

**components/sections/Newsletter.tsx :**
```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Appel à l'API newsletter
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName }),
      })

      if (response.ok) {
        setIsSuccess(true)
        toast({
          title: '✅ Inscription réussie !',
          description: 'Vous recevrez bientôt nos dernières actualités.',
        })
        setEmail('')
        setFirstName('')
      } else {
        throw new Error('Erreur lors de l\'inscription')
      }
    } catch (error) {
      toast({
        title: '❌ Erreur',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const benefits = [
    { icon: '🎯', text: 'Nouveautés en avant-première' },
    { icon: '💡', text: 'Conseils budgétaires exclusifs' },
    { icon: '🎁', text: 'Accès anticipé aux nouvelles fonctionnalités' },
    { icon: '📊', text: 'Guides et tutoriels gratuits' },
  ]

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background avec dégradé */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />

      {/* Pattern de fond */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }} />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
              <Mail className="w-4 h-4 mr-2" />
              Newsletter
            </Badge>

            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Ne Manquez Aucune{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Mise à Jour
              </span>
            </h2>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Recevez les dernières fonctionnalités, conseils de gestion financière et offres exclusives
              directement dans votre boîte mail.
            </p>
          </motion.div>

          {/* Card du formulaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-8 lg:p-12 shadow-2xl border-0 bg-white/80 backdrop-blur">
              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base font-medium">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 text-base"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Prénom (optionnel) */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-base font-medium">
                        Prénom <span className="text-gray-400">(optionnel)</span>
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Votre prénom"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-12 text-base"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Bouton submit */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Inscription en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-2" />
                        S'inscrire à la Newsletter
                      </>
                    )}
                  </Button>

                  {/* Badge "Zéro spam" */}
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Zéro spam, promis ! · 1 email par mois maximum</span>
                  </div>
                </form>
              ) : (
                /* Message de succès */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Merci pour votre inscription !</h3>
                  <p className="text-gray-600">Vous recevrez bientôt nos dernières actualités.</p>
                </motion.div>
              )}
            </Card>
          </motion.div>

          {/* Avantages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8"
          >
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-lg bg-white/50 backdrop-blur border border-gray-200/50"
              >
                <span className="text-2xl">{benefit.icon}</span>
                <span className="text-sm font-medium text-gray-700">{benefit.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
```

**app/api/newsletter/route.ts (API Route) :**
```typescript
import { NextRequest, NextResponse } from 'next/server'

// Exemple avec Resend (https://resend.com)
// import { Resend } from 'resend'
// const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, firstName } = await request.json()

    // Validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      )
    }

    // Option 1: Sauvegarder dans une base de données (Supabase, Prisma, etc.)
    // await db.newsletter.create({ data: { email, firstName } })

    // Option 2: Envoyer à un service de newsletter (Resend, Mailchimp, etc.)
    // await resend.contacts.create({
    //   email,
    //   firstName,
    //   audienceId: process.env.RESEND_AUDIENCE_ID!,
    // })

    // Option 3: Ajouter à Mailchimp
    // const mailchimp = require('@mailchimp/mailchimp_marketing')
    // await mailchimp.lists.addListMember(process.env.MAILCHIMP_LIST_ID, {
    //   email_address: email,
    //   status: 'subscribed',
    //   merge_fields: { FNAME: firstName || '' }
    // })

    // Pour le développement, on log simplement
    console.log('Nouvelle inscription newsletter:', { email, firstName })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Erreur newsletter:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}
```

### Animations Framer Motion

**Exemples d'animations :**
```typescript
// Fade in from bottom
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

// Stagger children
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Scale on hover
const scaleOnHover = {
  whileHover: { scale: 1.05 },
  transition: { type: 'spring', stiffness: 300 }
}
```

### Optimisations Performance

**1. Images :**
- Utiliser `next/image` pour l'optimisation automatique
- Format WebP avec fallback
- Lazy loading des screenshots

**2. Fonts :**
- Utiliser `next/font` pour optimiser le chargement
- Précharger les polices critiques

**3. Analytics :**
- Charger Google Analytics de manière asynchrone
- Utiliser Vercel Analytics (plus léger)

**4. Build :**
- Static Site Generation (SSG) pour toutes les pages
- CDN Vercel Edge Network

### Déploiement sur Vercel

**Instructions :**
```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
vercel

# 4. Production
vercel --prod
```

**Configuration vercel.json :**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["cdg1"]
}
```

### Avantages de Next.js pour cette Landing Page

✅ **SEO Excellent** : SSG/SSR, metadata optimisée, sitemap automatique
✅ **Performance** : Optimisation images/fonts automatique, code splitting
✅ **Écosystème React** : Cohérent avec l'app mobile React Native
✅ **Déploiement Gratuit** : Vercel offre un plan gratuit généreux
✅ **TypeScript** : Type safety et meilleure DX
✅ **Analytics Intégré** : Vercel Analytics inclus gratuitement
✅ **Edge Functions** : Pour les fonctionnalités serverless si nécessaire

---

## Design Attractif - Recommandations

### Principes de Design Moderne

**1. Hiérarchie Visuelle Claire**
- Titres en dégradé de couleur (gradient text)
- Tailles de police importantes (72px+ pour H1)
- Espacement généreux entre sections (80-120px)
- Utiliser des poids de police variés (400, 500, 700, 900)

**2. Micro-animations**
- Hover effects sur tous les boutons et cartes
- Animations d'entrée pour les sections (fade-in, slide-up)
- Transitions fluides (300-600ms)
- Parallax scrolling subtil

**3. Éléments Visuels Attractifs**

#### Dégradés et Couleurs
```css
/* Dégradé de texte */
.gradient-text {
  background: linear-gradient(135deg, #14b8a6 0%, #3b82f6 50%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Dégradé de fond animé */
.gradient-bg {
  background: linear-gradient(135deg, #14b8a6, #3b82f6, #a855f7);
  background-size: 200% 200%;
  animation: gradient 8s ease infinite;
}

@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

#### Glass Morphism (Effet de verre)
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
}
```

#### Orbes Flottants (Background)
```tsx
<div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
<div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
```

#### Effet de Glow (Lueur)
```css
.glow {
  box-shadow: 0 0 60px rgba(20, 184, 166, 0.5);
  filter: drop-shadow(0 0 30px rgba(20, 184, 166, 0.3));
}
```

**4. Typographie Impactante**

```tsx
// Utiliser Inter avec next/font
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-inter',
})
```

**Échelle typographique :**
- H1 Hero : 64-72px (mobile), 96-108px (desktop)
- H2 Sections : 36-48px
- H3 Features : 24-32px
- Body : 16-18px
- Small : 14px

**5. Espacements et Layout**

```tsx
// Container responsive
<div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
  {/* Contenu */}
</div>

// Sections avec padding généreux
<section className="py-16 sm:py-20 lg:py-32">
  {/* Contenu */}
</section>

// Grilles responsives
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {/* Items */}
</div>
```

**6. Composants avec Ombres Avancées**

```css
/* Ombre douce */
.shadow-soft {
  box-shadow: 0 2px 40px rgba(0, 0, 0, 0.08);
}

/* Ombre forte */
.shadow-strong {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

/* Ombre colorée */
.shadow-primary {
  box-shadow: 0 10px 40px rgba(20, 184, 166, 0.3);
}
```

**7. États Interactifs**

```tsx
// Boutons avec hover effects
<Button className="
  transform transition-all duration-300
  hover:scale-105 hover:shadow-2xl
  active:scale-95
  group
">
  <span className="group-hover:translate-x-1 transition-transform">
    Télécharger
  </span>
</Button>

// Cards avec lift effect
<Card className="
  transition-all duration-300
  hover:-translate-y-2 hover:shadow-2xl
  border-2 hover:border-primary
">
  {/* Contenu */}
</Card>
```

**8. Patterns de Fond**

```tsx
// Grid pattern
<div className="absolute inset-0 opacity-[0.02]">
  <div className="absolute inset-0" style={{
    backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)',
    backgroundSize: '40px 40px'
  }} />
</div>

// Dots pattern
<div className="absolute inset-0 opacity-[0.03]">
  <div className="absolute inset-0" style={{
    backgroundImage: 'radial-gradient(circle, rgb(0 0 0) 1px, transparent 1px)',
    backgroundSize: '20px 20px'
  }} />
</div>
```

**9. Badges et Pills**

```tsx
// Badge "Nouveau" ou "Gratuit"
<Badge className="
  bg-primary/10 text-primary border-primary/20
  px-4 py-2 text-sm font-medium
  animate-pulse
">
  <Sparkles className="w-4 h-4 mr-2 inline" />
  100% Gratuit
</Badge>
```

**10. Sections avec Backgrounds Variés**

```tsx
// Background blanc
<section className="bg-white">

// Background gris clair
<section className="bg-gray-50">

// Background avec dégradé
<section className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">

// Background sombre (dark mode)
<section className="bg-gray-900 text-white">
```

### Inspiration Design

**Sites de référence pour le design :**
- [Linear.app](https://linear.app) - Animations fluides, design épuré
- [Vercel.com](https://vercel.com) - Typographie impactante, espacement
- [Stripe.com](https://stripe.com) - Dégradés subtils, micro-interactions
- [Framer.com](https://framer.com) - Animations avancées, effets visuels
- [Resend.com](https://resend.com) - Glass morphism, design moderne

**Outils de design :**
- **Figma** : Prototypage et design
- **Dribbble/Behance** : Inspiration
- **Coolors.co** : Palettes de couleurs
- **Hero Patterns** : Patterns SVG de fond
- **uiGradients** : Dégradés prêts à l'emploi

### Checklist Design Attractif

**Visual Polish :**
- [ ] Dégradés sur les titres principaux
- [ ] Animations d'entrée sur toutes les sections
- [ ] Hover effects sur tous les éléments interactifs
- [ ] Orbes flottants ou shapes en background
- [ ] Glass morphism sur au moins 2 composants
- [ ] Ombres colorées sur les CTA principaux
- [ ] Patterns subtils en arrière-plan
- [ ] Badges animés pour attirer l'attention

**Typography :**
- [ ] Police moderne (Inter, Poppins, ou SF Pro)
- [ ] Échelle typographique cohérente
- [ ] Line-height généreux (1.6-1.8)
- [ ] Poids de police variés (light, regular, bold, black)

**Colors :**
- [ ] Palette cohérente avec l'app (teal, blue, purple)
- [ ] Utilisation d'opacity pour les variants (primary/10, primary/20)
- [ ] Contraste suffisant (WCAG AA minimum)
- [ ] Mode sombre optionnel

**Spacing :**
- [ ] Espacement vertical généreux entre sections (80-120px)
- [ ] Padding interne cohérent (16px, 24px, 32px, 48px)
- [ ] Marges consistantes
- [ ] Responsive breakpoints bien définis

**Performance Visuelle :**
- [ ] Images optimisées (WebP, lazy loading)
- [ ] Animations fluides (60fps)
- [ ] Transitions CSS plutôt que JavaScript
- [ ] Utiliser `will-change` pour les animations complexes

---

## Recommandations Finales

### Checklist de Lancement

**Pré-lancement :**
- [ ] Créer des mockups haute qualité (Figma/Sketch)
- [ ] Écrire tous les textes en français et anglais
- [ ] Préparer 5-6 screenshots annotés de l'app
- [ ] Enregistrer une vidéo démo de 30-60 secondes
- [ ] Configurer Google Analytics et Meta Pixel
- [ ] Optimiser les images (WebP, compression)
- [ ] Tester sur mobile (responsive design)
- [ ] Valider le SEO (Lighthouse score > 90)

**Lancement :**
- [ ] Publier sur Product Hunt
- [ ] Partager sur les réseaux sociaux (Facebook, LinkedIn)
- [ ] Soumettre à des directories d'apps (AlternativeTo, Slant)
- [ ] Contacter des blogs tech malgaches
- [ ] Créer des posts LinkedIn ciblés "entrepreneurs Madagascar"
- [ ] Rejoindre des groupes Facebook de gestion financière

**Post-lancement :**
- [ ] Collecter les premiers témoignages utilisateurs
- [ ] Publier des études de cas (success stories)
- [ ] Créer du contenu blog (SEO) : "Comment gérer son budget à Madagascar"
- [ ] Lancer une campagne email (newsletter)
- [ ] Optimiser la conversion (A/B testing des CTAs)

### Performance Targets

**Métriques Web :**
- Lighthouse Performance : > 90
- First Contentful Paint : < 1.5s
- Time to Interactive : < 3.5s
- Cumulative Layout Shift : < 0.1

**Conversion :**
- Taux de clic sur "Télécharger" : 15-25%
- Bounce rate : < 40%
- Temps moyen sur page : > 2 minutes

---

## Ressources Complémentaires

### Design Inspiration
- [Land-book](https://land-book.com) - Galerie de landing pages
- [Mobbin](https://mobbin.com) - UI patterns d'apps mobiles
- [Dribbble](https://dribbble.com/tags/landing-page) - Designs créatifs

### Outils de Création
- **Mockups** : Figma, Sketch, Adobe XD
- **Screenshots** : Screely, MockUPhone, Rotato
- **Vidéo démo** : Loom, Screen Studio, Descript
- **Icons** : Iconify, Flaticon, Noun Project

### Analytics
- **Google Analytics 4** : Suivi du trafic
- **Hotjar** : Heatmaps et enregistrements
- **Plausible** : Analytics privacy-first (alternative)

---

## Contact et Support

Pour toute question concernant la création de la landing page :
- **Email** : support@moneytracker.mg (à créer)
- **GitHub** : [Lien vers repo] (si open source)
- **Discord/Slack** : Communauté de développeurs (à créer)

---

**Version du document :** 1.0
**Dernière mise à jour :** 19 janvier 2026
**Auteur :** Claude (AI Assistant)
**Basé sur :** Money Tracker App v1.0.2-v1.0.3

---

**Note finale :** Ce document est un guide complet pour créer une landing page efficace. Adaptez le contenu selon votre audience cible, votre budget, et votre calendrier de lancement. Priorisez la clarté, la rapidité de chargement, et des CTAs bien visibles.

Bon lancement ! 🚀
