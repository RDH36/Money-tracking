# Mitsitsy — Fonctionnalités de l'application

> **Mitsitsy** · _épargner avec intention_
> Application mobile de suivi de dépenses **100 % hors-ligne** (Expo Router 6 / React Native 0.81 / React 19, SQLite local, Zustand, Gluestack UI + NativeWind, i18next).
> Version **2.0.3** · Bundle `com.rdh36.moneytracking` · Construite à Antananarivo.

Ce document recense **l'ensemble des fonctionnalités** de l'application, organisées par domaine.

---

## 1. Navigation & structure

L'app s'organise autour d'une **barre d'onglets** avec un bouton **+ central flottant** :

| Onglet | Écran | Rôle |
|--------|-------|------|
| 🏠 Accueil | `(tabs)/index` | Tableau de bord (soldes, budgets du mois, transactions récentes) |
| ➕ Ajouter | `(tabs)/add` | Saisie d'une dépense, d'un revenu ou d'un transfert |
| 📅 Plan | `(tabs)/simulation` | Planifications + simulateur de solde futur |
| 🕓 Historique | `(tabs)/history` | Liste des transactions avec filtres |
| 🏆 Succès | `(tabs)/achievements` | Gamification (défis, quêtes, badges) |
| ⚙️ Réglages | `(tabs)/settings` | Accessible aussi depuis l'icône ⚙ du dashboard |

**Écrans secondaires :** Rapports (`reports`), Calendrier (`calendar`), Détail catégorie (`category/[id]`), Détail planification (`planification/[id]`), Quoi de neuf (`whats-new`), Mes autres apps (`other-apps`), Tutoriel (`tutorial`), Onboarding.

---

## 2. Transactions

- **Trois types de saisie** : dépense, revenu, transfert entre comptes.
- **Catégorie** avec sélecteur (barre de recherche incluse) — 12 catégories de base + catégories personnalisées.
- **Compte** : le **compte principal est présélectionné** pour une saisie plus rapide.
- **Note** optionnelle.
- **Date personnalisée** : possibilité de saisir une transaction **antérieurement** (saisie en retard). Les transactions datées d'un autre jour affichent clairement « dépensé le… / reçu le… ».
- **Double date** : `transaction_date` (date réelle de l'opération, utilisée par comptabilité/budgets/rapports/calendrier) et `created_at` (moment de saisie, utilisé pour l'engagement/gamification).
- **Suppression** via l'icône corbeille — **soft delete** (`deleted_at`), mise à jour **instantanée** de la liste et des soldes.
- **Édition** des transactions existantes.

---

## 3. Comptes, soldes & devises

- **Multi-comptes** : types banque/espèces, chacun avec **icône**, **nom**, **type** et **solde initial**. 2 comptes par défaut protégés (non supprimables) + comptes personnalisés (limite étendue par les déblocages gamification).
- Montants stockés en **centimes** pour éviter les erreurs d'arrondi.
- **Transferts** entre comptes en un clic (les transferts **ne sont pas comptés comme des dépenses** ; supprimer un transfert efface bien **les deux opérations liées**).
- **Solde total** et **solde net** consolidés sur le dashboard.
- **Multi-devises** : MGA, EUR, USD avec **conversion aux taux du jour** (`lib/exchangeRate.ts`, nécessite Internet pour rafraîchir le taux).
- **Masquage des soldes** : floutage des montants (par défaut au lancement, tap pour afficher) + option d'affichage dans les widgets.

---

## 4. Budgets

- **Budget mensuel par catégorie** (ou illimité).
- **Cartes de suivi visuel** avec barres de progression colorées (vert / orange / rouge).
- **Alertes automatiques** à l'approche et au dépassement du budget (seuils **50 %**, **80 %**, **100 %**, réglables globalement et **par catégorie**).
- **Section « Budgets du mois »** sur le dashboard avec bannière de dépassement.
- **Historique de budget** conservé mois par mois (`lib/database/budgetHistory.ts`).
- **Page détail par catégorie** : historique des transactions et navigation par mois.

---

## 5. Planifications (préparer ses achats)

- Créer une **planification** pour anticiper des achats/revenus à l'avance.
- Ajouter plusieurs **éléments** (dépenses/revenus prévus) avec **date butoir** optionnelle.
- Prévisualisation : solde actuel → dépenses/revenus prévus → **solde après**, avec **alerte solde négatif**.
- **Validation** : déduit les montants du compte choisi et crée les transactions liées (regroupées dans une seule carte).
- **Suppression automatique** d'une planification vide ; suppression des deux jambes gérée.
- Rappels par notification (planif de demain, aujourd'hui, expirée).
- **Simulateur** (`hooks/useSimulation.ts`) : ajout de dépenses **fictives non enregistrées** pour projeter le solde futur, regroupées par catégorie.

---

## 6. Statistiques, rapports & calendrier

- **Écran Rapports** : graphique de tendance, répartition par catégorie, revenus vs dépenses, moyenne par jour, catégorie principale, net — avec **barres de progression budget par catégorie**.
- **Calendrier des dépenses** : visualisation jour par jour du total dépensé.
- **Dépenses par catégorie** sur le dashboard.
- Rapports, budgets et calendrier utilisent la **vraie date de transaction**.

---

## 7. Gamification

Système complet de motivation (page **Succès** à onglets : Défis / Quêtes / Badges) :

- **XP & niveaux** avec barre de progression (formule `niveau = ⌊√(xp/100)⌋+1`, XP par action : ouverture, dépense, revenu, transfert, défi…) ; **recalcul manuel de l'XP** possible depuis les réglages.
- **Séries (streaks)** quotidiennes + **boucliers (streak freezes)** pour protéger sa série.
- **Défis** : du jour (quotidiens), de la semaine (150–300 XP), du mois (500–800 XP).
- **Quêtes long-terme** multi-étapes (5 quêtes Tier 1 : Marathon, Collectionneur, Discipliné, Architecte, Explorateur — 3 paliers chacune) et **5 quêtes épiques** endgame débloquées ensuite (jusqu'à ~10 000 XP) ; badge légendaire **« Maître des Quêtes »** (2000 XP bonus).
- **Badges & succès** (~30 badges, dont des **badges secrets**) : streaks, volume de transactions, discipline budgétaire, exploration, régularité.
- **Déblocages de fonctionnalités** via badges/quêtes : slots de catégories/comptes supplémentaires, boucliers, et **6 thèmes premium** (Gold, Platinum, Midnight, Ruby, Emerald, Prism).
- **Animation de célébration** à chaque déblocage + section « Prochains déblocages ».
- **Mascotte Bubule** : guide présent dans l'onboarding, sur le wow-moment et les écrans vides.

_Fichiers clés : `hooks/useGamification.ts`, `useQuests.ts`, `useUnlocks.ts`, `useDaily/Weekly/MonthlyChallenge.ts`, `lib/gamification/`._

---

## 8. Onboarding

Funnel psychologique complet (`app/onboarding/`) :

1. **Accueil** (tagline, CTA + import de sauvegarde).
2. **Quiz** en 3 étapes (problème financier, ancienneté, objectif).
3. **Empathy** : « on te comprend » (headline + stat personnalisés selon les réponses).
4. **Solution** : bénéfices adaptés au profil.
5. **Wow-moment** : mini-simulation de saisie → mini-rapport (fluidifié, sans étape superflue).
6. **Configuration** des comptes et soldes initiaux, choix des catégories.

- **CTA d'import direct** d'une sauvegarde `.mitsitsy` dès l'écran d'accueil (changement de téléphone).
- **Tutoriel** interactif post-onboarding + tooltips contextuels et astuces (`useTips`).

---

## 9. Sauvegarde & transfert de données (`.mitsitsy`)

- **Export** de toutes les données dans un fichier **`.mitsitsy` chiffré** (AES-256-CBC, clé dérivée PBKDF2) avec option de **protection par mot de passe** ; sur Android écriture directe via Storage Access Framework (dossier mémorisé), sur iOS partage natif.
- **Import** d'une sauvegarde (validation format/version, restauration transactionnelle FK-safe), utilisable dès l'onboarding → **migration de téléphone**.
- Tables sauvegardées : catégories, comptes, planifications, transactions, budgets, gamification, badges, quêtes, unlocks, réglages (filtrés).
- Le **verrouillage de l'app (PIN) est exclu** de la sauvegarde (reste local à l'appareil).
- Sondage cloud intégré pour recueillir l'avis sur une future **sauvegarde cloud** (voir §14).

---

## 10. Sécurité & confidentialité (App Lock)

- **Verrouillage de l'app** par **code PIN 4 chiffres** (hash SHA-256 salé stocké dans `expo-secure-store`, jamais en clair) demandé à l'ouverture.
- **Déverrouillage biométrique** (empreinte / Face ID via `expo-local-authentication`) en complément.
- **Compteur de tentatives** échouées persistant.
- **Délai avant verrouillage** paramétrable.
- **Code de récupération développeur** (6 chiffres) en cas d'oubli / trop d'essais.
- **Modification du code** PIN.
- **Masquage des soldes** par défaut (§3).
- **Effacer mes données analytiques** (usage envoyé).

_Fichiers : `lib/appLock.ts`, `hooks/useAppLockBanner.ts`, écran `settings/privacy`._

---

## 11. Personnalisation (apparence)

- **Mode** clair / sombre / **auto** (suit le système, mode sombre confortable la nuit).
- **5 thèmes de couleur de base** (Rose par défaut, Turquoise, Bleu, Violet, Orange) + **6 thèmes premium** débloquables via la gamification (§7).
- **Astuces** (tips) activables/désactivables.
- Design V2 premium : bulles de dialogue aux couleurs du thème, bottom sheets animés.

_Fichier : `contexts/ThemeContext.tsx`._

---

## 12. Multi-langue (i18n)

Application disponible en **3 langues** (`lib/i18n/translations/`) :

- 🇫🇷 **Français** (`fr`)
- 🇬🇧 **Anglais** (`en`)
- 🇲🇬 **Malgache** (`mg`)

Changement de langue depuis les réglages (`settings/language`).

---

## 13. Notifications

- **Rappels de saisie** à fréquence réglable : désactivés, toutes les 1 h / 2 h / 4 h.
- **Alertes budget** aux seuils 50 % / 80 % / 100 % (globaux et par catégorie).
- **Notifications intelligentes de gamification** : rappels de série, défi du jour, résumés, **progression de quête presque terminée**.
- Rappels de **planifications** (demain / aujourd'hui / expirée).

_Fichiers : `lib/notifications.ts`, `settings/notifications`._

---

## 14. Feedback, sondage & communauté

- **Message à l'équipe** : envoi d'un retour/idée directement dans l'app (nécessite Internet).
- **Note sur le store** (Google Play) depuis les réglages.
- **Sondage « Sauvegarde cloud »** : mini-questionnaire (intérêt, prix mensuel/annuel, mode de sync, email + remarque libre) pour valider une future feature — modifiable depuis les réglages.
- **Suivre Mitsitsy sur Facebook**.
- **Page « Mes autres apps »** pour découvrir les autres créations du développeur.

_Fichiers : `settings/feedback`, `hooks/useCloudBackupSurvey.ts`, `app/other-apps.tsx`._

---

## 15. Réglages (récapitulatif des sections)

- **Préférences** : apparence/thème, devise, langue, notifications, confidentialité & sécurité, comptes, catégories.
- **Données de jeu** : recalcul de l'XP.
- **À propos** : quoi de neuf, mon compte, comptes/catégories personnalisées.
- **Zone sensible** : sauvegarde/import des données, **remise à zéro de l'app** (factory reset).
- **Quoi de neuf** : historique des nouveautés à chaque mise à jour (`whats-new`, `hooks/useWhatsNew.ts`).

---

## 16. Fondations techniques

- **100 % hors-ligne**, base **SQLite** locale (`lib/database/`) — **23 migrations incrémentales**, jamais destructives (app en production), **soft delete** partout.
- **State management** Zustand : `settingsStore`, `gamificationStore`, `unlocksStore`, `questsStore`, `dataRefreshStore` (invalidation croisée des hooks).
- **Analytics** PostHog (`lib/posthog.ts`), effaçables par l'utilisateur.
- **Sondage cloud** envoyé à Supabase via appel REST direct (pas de SDK), après vérification de connexion (`lib/network.ts`).
- **Store review** natif après un certain nombre de transactions (`hooks/useStoreReview.ts`) ; **tips contextuels rotatifs** (`useTips`) et **tracking d'activation** à la première dépense (`useFirstExpenseActivation`).

---

_Document généré à partir du code source (structure `app/`, `hooks/`, `lib/`, clés i18n `fr.json` et changelog interne)._
