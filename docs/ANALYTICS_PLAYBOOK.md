# 📊 Playbook Analytics PostHog — générique (toute app)

Guide réutilisable pour brancher PostHog sur **n'importe quelle app** (mobile ou web) et mettre en place les analyses critiques **conversion + rétention**. Conçu à partir de Flipia, mais volontairement générique : remplace les `<placeholders>` par les events de ton app.

> Règle d'or : **mieux vaut 8 events bien choisis que 50 events brouillons.** On track les moments qui décident de la croissance, pas tous les clics.

---

## 1. Mise en place technique

### Un seul projet PostHog pour toutes tes apps (plan gratuit)
Le plan gratuit PostHog = **1 projet**. Pas besoin d'en créer un par app : tu envoies tout dans le même projet et tu **sépares par une super-property `app`**.

- Free tier : **1 M events/mois** — largement suffisant pour des apps en early stage.
- Chaque app `register({ app: "<nom_app>" })` au boot → filtre `app = <nom_app>` partout.

### Code (React Native / Expo — `lib/analytics.ts`)
```ts
import { useEffect, useState } from "react";
import PostHog from "posthog-react-native";

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const enabled = !!apiKey;

const posthog = new PostHog(apiKey || "placeholder", {
  host,
  disabled: !enabled,
  captureAppLifecycleEvents: true, // → Application Installed/Opened/Updated… gratuits
  flushAt: 20,
  flushInterval: 10000,
});
if (enabled) posthog.register({ app: "<nom_app>" }); // ⚠️ isole les données

type EventProps = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, props?: EventProps) {
  if (!enabled) return;
  const clean = props
    ? Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined))
    : undefined;
  posthog.capture(event, clean as Record<string, string | number | boolean | null>);
}

/** À appeler dès que l'utilisateur est connu → rétention fiable, pas de doublon à la réinstall. */
export function identify(distinctId: string | undefined | null) {
  if (!enabled || !distinctId) return;
  posthog.identify(distinctId);
}

/** Kill-switch / rollout : flag réactif, défaut = true (jamais masqué si PostHog down). */
export function useFlag(key: string, fallback = true): boolean {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    if (!enabled) return;
    const read = () => {
      const r = posthog.getFeatureFlag(key);
      setValue(r === undefined ? fallback : r === true || r === "true");
    };
    read();
    return posthog.onFeatureFlags(read);
  }, [key, fallback]);
  return value;
}
```
> Web (Next.js…) : même logique avec `posthog-js` et `posthog.register({ app })`.

### `identify()` : non négociable
Sans `identify(userId)`, chaque réinstallation = nouvel « utilisateur » → **rétention faussée**. Appelle-le dès que l'ID utilisateur est connu (login, restauration de session).

---

## 2. La taxonomie d'events canonique (générique)

Le framework **AARRR** (pirate metrics) couvre toute app. Pour chaque étape, l'event minimal :

| Étape | Event générique | Quand | Propriétés utiles |
|-------|-----------------|-------|-------------------|
| **Acquisition** | `Application Installed` / `Application Opened` | auto (lifecycle) | — |
| **Acquisition** | `signed_in` | inscription / connexion | `method` (email, google, guest…) |
| **Activation** | `onboarding_completed` | fin du 1er parcours | — |
| **Activation** | `<core_action>_completed` (1re fois) | 1er moment de valeur | — |
| **Rétention** | `<core_action>` | **action centrale** de l'app, répétée | les dimensions clés (type, catégorie…) |
| **Revenu** | `purchase_completed` | achat abouti | `product`, `price`, `currency` |
| **Revenu** | `paywall_viewed` | paywall affiché | `source` (d'où vient le clic) |
| **Referral** | `<promo>_clicked` / `shared` | clic cross-promo / partage | `target` |
| **Engagement** | `<feature>_used` | features secondaires clés | — |

**`<core_action>` = LE verbe de ton app.** Mitsitsy : `transaction_created`. Un jeu : `game_played`. Un SaaS : `report_generated`. Un réseau social : `post_published`. **C'est l'event le plus important** — la rétention et l'engagement se mesurent dessus.

### Conventions de nommage (à tenir partout)
- **`snake_case`**, verbe au passé : `purchase_completed`, pas `Purchase` ni `buy`.
- Le **nom** = l'action ; les **détails** = des propriétés (`purchase_completed {product}`, pas `purchase_premium` + `purchase_pack`).
- Pas de PII dans les events (pas d'email/nom en propriété).
- Garde une liste des events quelque part (ce fichier) — sinon ça part en vrac.

---

## 3. Les analyses critiques (à créer dans tout projet)

Deux dashboards suffisent pour piloter une app. Tous les insights filtrés sur `app = <nom_app>`.

### Dashboard A — « Vue d'ensemble » (santé)
| Insight | Type PostHog | Lecture |
|---------|--------------|---------|
| Utilisateurs actifs / jour (DAU) | Trends · `Application Opened` math **dau** | volume vivant |
| Nouveaux installs / jour | Trends · `Application Installed` | acquisition brute |
| **Funnel activation** | Funnel · Install → onboarding_completed → 1re `<core_action>` | % qui atteint la valeur |
| `<core_action>` / jour | Trends · breakdown par dimension clé | engagement |
| Rétention hebdo | Retention · `Application Opened` | reviennent-ils |
| Monétisation | Trends · `purchase_completed` | revenu dans le temps |

### Dashboard B — « Growth (conversion & rétention) » ⭐ le plus important
| Insight | Type PostHog | Pourquoi critique | Repère |
|---------|--------------|-------------------|--------|
| **Rétention J1 / J7 / J30** | Retention · period **Day**, `retention_first_time` | la métrique n°1 — multiplie la LTV | J1 ~35-40 %, J7 ~15-20 %, J30 ~5-8 % (casual) |
| **Composition (lifecycle)** | Lifecycle · `Application Opened`, hebdo | croissance vs churn (dormants en négatif) | nouveaux > dormants = tu grossis |
| **Conversion en payeur** | Funnel · `Application Opened` → (GroupNode OR de tous les events d'achat) | taux free → paid | F2P 1-3 %, SaaS varie |
| **Stickiness** | Stickiness · `Application Opened`, jours/mois | habitude / power users | queue épaisse à droite = noyau fidèle |
| **Mix d'acquisition** | Trends · `signed_in` breakdown `method` | qualité des sources | les comptes liés retiennent > invités |

> **Le croisement le plus rentable** (quand assez de données) : **rétention segmentée** par `method` d'inscription et par dimension du `<core_action>`. Ça dit *où* mettre tes efforts produit.

---

## 4. Comment lire & agir (ordre de priorité)

1. **Rétention d'abord, acquisition ensuite.** Acquérir des users qui partent à J1 = brûler du budget. Tant que J1/J7 sont faibles, corrige l'onboarding et la 1re session — n'investis pas en pub.
2. **Boucle de croissance** : Rétention (garde) → Composition (mesure si tu grossis) → Conversion (monétise) → Mix d'acquisition (améliore la qualité de l'entrée).
3. **Activation = le verrou.** Si le funnel install → 1re `<core_action>` fuit, rien d'autre ne compte. Vise à amener l'utilisateur à son « aha moment » le plus vite possible.
4. **Stickiness oriente la monétisation** : vends aux power users (queue de droite), réactive les « 1 jour seulement » par notif/récompense.

### Piège du faible volume (early stage)
Avec peu d'utilisateurs : **regarde les nombres absolus, pas les %** (un funnel « 50 % » sur 2 personnes ne veut rien dire). Attends ~30-50 conversions avant de conclure, et utilise des fenêtres **90 jours** plutôt que 7.

---

## 5. Kill-switch & rollout progressif (feature flags, gratuit)

Pour toute **nouvelle feature risquée** : crée un flag PostHog (ex. `<feature>_enabled`, ON à 100 %) et gate la feature avec `useFlag`. En cas de bug en prod → passe le flag à **OFF**, la feature disparaît **sans republier**. Sert aussi à faire un **rollout progressif** (10 % → 50 % → 100 %).

```tsx
const featureOn = useFlag("<feature>_enabled");
if (!featureOn) return null;
```

---

## 6. Checklist mise en prod (à refaire pour chaque app)

- [ ] Clés dans les **variables EAS** (PAS juste le `.env` local, qui est gitignoré et **non lu** par les builds EAS) : `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`, + clés pub/achat éventuelles.
- [ ] **Rebuild** requis : les `EXPO_PUBLIC_*` sont injectées au build, pas au reload.
- [ ] **Play Console → Sécurité des données** : déclarer la collecte analytics (PostHog).
- [ ] **Politique de confidentialité** : mentionner PostHog + l'usage analytics.
- [ ] **Consentement RGPD/UMP** si trafic européen (analytics + pub).
- [ ] `identify(userId)` câblé au login.
- [ ] Super-property `app` registrée → données séparées des autres apps.
- [ ] Vérifier les events dans **Activity** (flux live) après le 1er build + usage.

---

## 7. Pour démarrer sur une nouvelle app (résumé 5 min)

1. `npm i posthog-react-native` (ou `posthog-js` en web).
2. Copier `lib/analytics.ts`, changer `app: "<nom_app>"`.
3. Ajouter `EXPO_PUBLIC_POSTHOG_KEY/HOST` au `.env` **et** aux variables EAS.
4. Câbler : `identify(userId)` au login ; `track("<core_action>", {...})` sur l'action centrale ; `track("purchase_completed", {product})` à l'achat ; `track("signed_in", {method})` ; `track("onboarding_completed")`.
5. Créer les 2 dashboards (section 3) — ~15 min, ou demander à l'assistant via le MCP PostHog.
6. Rebuild, jouer, vérifier dans **Activity**.
