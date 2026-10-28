/**
 * Import d'opérations depuis une capture d'écran (OCR hors ligne).
 *
 * Chaîne : image → OCR (lignes + positions + couleur) → détection de la source
 * → parseur de la source → opérations → anti-doublon → écran de vérification.
 * Tout ce dossier (hors `import/`) est PUR : aucune dépendance React Native ni
 * SQLite, testable directement sous Node.
 */

/** Une ligne reconnue par l'OCR. Coordonnées en pixels de l'image. */
export interface OcrLine {
  text: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  /** Bloc OCR d'origine (paragraphe), si connu. */
  block?: number;
  /** Couleur dominante des caractères, `#rrggbb`, si mesurée. */
  color?: string | null;
}

export interface OcrPage {
  width: number;
  height: number;
  lines: OcrLine[];
}

export type OperationKind = 'expense' | 'income' | 'transfer';

/** Champs dont le parseur n'est pas sûr : l'utilisateur doit les vérifier. */
export type UncertainField = 'amount' | 'sign' | 'date' | 'reference';

export interface ParsedOperation {
  /** Identifiant du parseur, ex. `mcb`. */
  source: string;
  /** Référence bancaire unique (ex. `FT26301QW7K2`), null si illisible. */
  reference: string | null;
  /** Date de l'opération, `YYYY-MM-DD`. */
  date: string;
  /** Libellé brut, lignes jointes par une espace. */
  label: string;
  /** Note proposée pour la transaction (libellé nettoyé, ≤ 100 caractères). */
  note: string;
  /** Montant signé en centimes : débit < 0, crédit > 0. */
  amount: number;
  /** Devise ISO lue sur la capture, ex. `MGA`. */
  currency: string;
  kind: OperationKind;
  /** Marchand extrait du libellé (paiement carte), sinon null. */
  merchant: string | null;
  /** Id de catégorie par défaut proposé par mots-clés (`food`, `bills`…). */
  categoryHint: string | null;
  uncertain: UncertainField[];
}

export interface ParseResult {
  operations: ParsedOperation[];
  /** Opérations coupées par le bord de la capture (montant ou libellé manquant). */
  partial: number;
}

/**
 * Un parseur par source (banque, appli, type de ticket). Ajouter une source =
 * écrire un SourceParser et l'enregistrer dans `registry.ts`.
 */
export interface SourceParser {
  id: string;
  /** Nom affiché, ex. « MCB Juice ». */
  label: string;
  /** Confiance (0 à 1) que la page vient de cette source. */
  detect(page: OcrPage): number;
  parse(page: OcrPage): ParseResult;
}
