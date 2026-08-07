/**
 * Types du socle d'analyse (Phase 1).
 *
 * Tout est en centimes (comme le reste de la base depuis la migration V12).
 * Convention de nullité : un indicateur non calculable vaut `null` — jamais
 * `NaN`, jamais `Infinity`. Chaque division dont le dénominateur peut valoir 0
 * (revenus nuls, aucun cycle précédent, catégorie sans historique) est gardée.
 */

/**
 * Un cycle = un mois calendaire (v1). Bornes construites en heure LOCALE puis
 * `.toISOString()` — même pattern que `getLocalMonthBounds` de useBudgets.
 */
export interface Cycle {
  /** ISO UTC, borne incluse (début du mois local). */
  start: string;
  /** ISO UTC, borne exclue (début du mois suivant). */
  end: string;
  /** Étiquette locale 'YYYY-MM', ex. '2026-07'. */
  label: string;
  /** Nombre total de jours du mois. */
  totalDays: number;
  /** Jours écoulés, borné à `totalDays`, jamais 0. `= totalDays` si cycle passé. */
  elapsedDays: number;
  /** `elapsedDays / totalDays`, dans ]0,1]. */
  elapsedRatio: number;
  /** Vrai si le cycle est le mois courant. */
  isCurrent: boolean;
}

/**
 * Dépense récurrente détectée par heuristique (même catégorie, montant ±15 %,
 * écart 25–35 j, ≥3 occurrences sur 4 cycles).
 */
export interface RecurringExpense {
  categoryId: string;
  /** Montant moyen d'une occurrence, en centimes. */
  avgAmount: number;
  /** Jour du mois moyen d'occurrence (1–31). */
  dayOfMonth: number;
  /** Nombre d'occurrences retenues dans la chaîne (borné à 4). */
  occurrences: number;
  /** `occurrences / 4`, borné à 1. Laisse le moteur de règles filtrer. */
  confidence: number;
}

/** Dérive d'une catégorie : dépense du cycle vs sa moyenne des cycles précédents. */
export interface CategoryDrift {
  categoryId: string;
  categoryName: string | null;
  /** Dépense de la catégorie sur le cycle courant, en centimes. */
  cycleSpend: number;
  /** Moyenne mensuelle sur les cycles précédents disponibles, ou `null`. */
  avgPrevious: number | null;
  /** `cycleSpend / avgPrevious`, ou `null` si pas d'historique exploitable. */
  drift: number | null;
}

/** Meilleur cycle des N derniers, au sens du taux d'épargne. */
export interface BestCycle {
  label: string;
  savingsRate: number;
}

// — Moteur de règles (Phase 2) —

export type InsightSeverity = 'info' | 'watch' | 'urgent';

/** Action exécutable en un tap, réutilisant l'existant (voir Phase 3). */
export interface InsightAction {
  type: 'createBudget' | 'createPlanification' | 'createTransfer' | 'openScreen';
  /** Clé i18n du libellé du bouton. */
  labelKey: string;
  /**
   * Params injectés dans le libellé (catégorie, montant formaté…) : le bouton
   * doit dire CE qu'il va faire, pas juste « créer le budget ».
   */
  labelParams?: Record<string, number | string>;
  /** Données d'exécution (montants en centimes, ids…). */
  payload: Record<string, unknown>;
}

/**
 * Un constat produit par une règle. `titleKey` + `params` = message i18n ;
 * `evidence` = le calcul en clair (chiffres/symboles, non traduit) pour que
 * l'utilisateur puisse le vérifier.
 */
export interface Insight {
  /** Identifiant stable (pour le rejet via analysis_dismissed). */
  id: string;
  severity: InsightSeverity;
  /** Poids 0–100, calculé par la règle ; sert au tri du scoring. */
  weight: number;
  titleKey: string;
  params: Record<string, number | string>;
  /** Le calcul, affiché tel quel. Obligatoire. */
  evidence: string;
  action?: InsightAction;
}

/** Une règle : fonction pure, sans DB ni hook. */
export type Rule = (i: Indicators, cycle: Cycle) => Insight | null;

/**
 * Les 12 indicateurs + contexte de calibrage. Un seul appel `getIndicators`
 * les produit tous, sans jamais boucler sur du SQL.
 */
export interface Indicators {
  cycle: Cycle;

  // — Contexte brut du cycle —
  /** Revenus du cycle, en centimes. */
  income: number;
  /** Dépenses du cycle, en centimes. */
  expenses: number;
  /** Seuil micro-dépense, dérivé du revenu (jamais une constante), en centimes. */
  microThreshold: number;
  /** Nombre de cycles d'historique exploitables (fenêtre 6 cycles). */
  cyclesAvailable: number;

  // — Structure —
  /** `(revenus − dépenses) / revenus`, ou `null` si revenus nuls. */
  savingsRate: number | null;
  /** `revenus − dépenses` en centimes (peut être négatif ; jamais `null`). */
  keptAmount: number;
  /** Part des dépenses récurrentes dans le revenu, ou `null` si revenus nuls. */
  fixedShare: number | null;
  /** `revenus − dépenses récurrentes`, ou `null` si revenus nuls. */
  realDisposable: number | null;
  /** Solde liquide ÷ dépense mensuelle moyenne (3 cycles), ou `null`. */
  monthsCovered: number | null;

  // — Comportement —
  /** Part des dépenses des 7 premiers jours dans le revenu, ou `null`. */
  burnSpeed: number | null;
  /** Nombre de dépenses `< microThreshold`. */
  microCount: number;
  /** Somme des dépenses `< microThreshold`, en centimes. */
  microTotal: number;
  /** Jours écoulés du cycle sans aucune dépense. */
  noSpendDays: number;
  /** Part de la 1ʳᵉ catégorie dans les dépenses, ou `null` si aucune dépense. */
  concentration: number | null;

  // — Trajectoire —
  categoryDrift: CategoryDrift[];
  /** `dépenses / elapsedRatio` (dénominateur toujours > 0), en centimes. */
  projectedEnd: number;
  /** Meilleur des 6 cycles précédents, ou `null` si aucun exploitable. */
  bestCycle: BestCycle | null;
  /** Delta depuis la dernière analyse — Phase 4 (persistance). `null` en Phase 1. */
  sinceLastAnalysis: null;

  /** Dépenses récurrentes détectées, avec leur `confidence`. */
  recurring: RecurringExpense[];
}
