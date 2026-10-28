/**
 * Sorties OCR simulées de captures MCB Juice (ML Kit sur l'appareil).
 * Géométrie et couleurs relevées sur de vraies captures ; TOUS les textes
 * (montants, références, noms) sont INVENTÉS. Ne jamais y mettre de vraies données.
 */
import type { OcrPage } from '../types';

/** « Compte à vue » : 4 opérations (carte, salaire en vert, retrait GAB, carte), décor d'appli au-dessus. */
export const MCB_RECENT_PAGE: OcrPage = {
  width: 1080,
  height: 2400,
  lines: [
    { text: "-lll 62)", left: 825, top: 40, right: 1009, bottom: 81, block: 14, color: '#dfdfdf' },
    { text: "8:05", left: 52, top: 47, right: 115, bottom: 75, block: 0, color: '#d7d7d7' },
    { text: "Compte à vue", left: 191, top: 227, right: 525, bottom: 278, block: 1, color: '#171717' },
    { text: "Plus de détails", left: 772, top: 295, right: 1046, bottom: 328, block: 15, color: '#2c74b4' },
    { text: "Transferts", left: 232, top: 548, right: 372, bottom: 577, block: 2, color: '#1c1c1c' },
    { text: "Relevés", left: 726, top: 551, right: 831, bottom: 575, block: 16, color: '#1c1c1c' },
    { text: "Tout afficher", left: 811, top: 706, right: 1033, bottom: 736, block: 18, color: '#3574ad' },
    { text: "Transactions récentes", left: 45, top: 708, right: 417, bottom: 737, block: 3, color: '#1b1b1b' },
    { text: "14 mars 2026", left: 46, top: 837, right: 264, bottom: 865, block: 4, color: '#5b5e61' },
    { text: "DB vente carte etrangere 482913 NETFLIX COM", left: 48, top: 917, right: 1031, bottom: 949, block: 7, color: '#181818' },
    { text: "PREMIUM", left: 46, top: 971, right: 117, bottom: 999, block: 5, color: '#1a1a1a' },
    { text: "Ref: FT26073AB12C\\BNK", left: 48, top: 1024, right: 493, bottom: 1055, block: 6, color: '#5a5d5f' },
    { text: "MGA -48 250,75", left: 695, top: 1098, right: 1034, bottom: 1137, block: 19, color: '#171e21' },
    { text: "Virement recus Banque Confrere SOAVITA", left: 44, top: 1230, right: 781, bottom: 1265, block: 10, color: '#181818' },
    { text: "SARL Salaire Lova Mars 2026", left: 45, top: 1280, right: 782, bottom: 1319, block: 10, color: '#1a1a1a' },
    { text: "Ref: FT26073XQ9KD\\BNK", left: 48, top: 1338, right: 508, bottom: 1369, block: 10, color: '#5a5d5f' },
    { text: "MGA 1 850 000,00", left: 674, top: 1412, right: 1035, bottom: 1454, block: 21, color: '#21966d' },
    { text: "12 mars 2026", left: 46, top: 1553, right: 264, bottom: 1581, block: 8, color: '#5b5e61' },
    { text: "Retrait sur GAB confrere 551203", left: 48, top: 1632, right: 610, bottom: 1661, block: 9, color: '#191919' },
    { text: "BNIMGXB-GAB-02-ANALAKELY", left: 48, top: 1687, right: 599, bottom: 1715, block: 11, color: '#181818' },
    { text: "Ref: FT26071 KD3P1\\BNK", left: 48, top: 1736, right: 504, bottom: 1772, block: 12, color: '#5a5c5f' },
    { text: "MGA -150 000,00", left: 695, top: 1814, right: 1035, bottom: 1855, block: 22, color: '#171d20' },
    { text: "09 mars 2026", left: 46, top: 1955, right: 264, bottom: 1983, block: 13, color: '#5b5e61' },
    { text: "DB vente carte etrangere 300517 bolt", left: 48, top: 2034, right: 746, bottom: 2070, block: 20, color: '#1a1a1a' },
    { text: "Ref: FT26068M2N8R\\BNK", left: 48, top: 2088, right: 495, bottom: 2118, block: 17, color: '#5a5d5f' },
    { text: "MGA -12 340,10", left: 721, top: 2162, right: 1034, bottom: 2201, block: 23, color: '#171d20' },
  ],
};

/** « Transactions » : 3 opérations complètes, une coupée en bas (libellé + réf. sans montant). Centimes : « ,0 », exposant à part « 10 », « " ». */
export const MCB_LIST_PAGE: OcrPage = {
  width: 1080,
  height: 2400,
  lines: [
    { text: "10:43", left: 53, top: 39, right: 136, bottom: 64, block: 0, color: '#d7d7d7' },
    { text: "Transactions", left: 420, top: 154, right: 660, bottom: 187, block: 6, color: '#202020' },
    { text: "Filtrer", left: 183, top: 341, right: 285, bottom: 371, block: 1, color: '#222222' },
    { text: "12 oct. 2026", left: 93, top: 500, right: 291, bottom: 526, block: 2, color: '#626364' },
    { text: "Retrait sur GAB Confrere 551203", left: 93, top: 580, right: 639, bottom: 608, block: 3, color: '#202020' },
    { text: "BNIMGXB-GAB-02-ANALAKELY", left: 93, top: 635, right: 642, bottom: 663, block: 4, color: '#212121' },
    { text: "Ref: FT26285 KD3P1\\BNK", left: 93, top: 685, right: 515, bottom: 719, block: 4, color: '#646567' },
    { text: "MGA -150 000,0", left: 644, top: 759, right: 990, bottom: 806, block: 12, color: '#1f1f1f' },
    { text: "09 oct. 2026", left: 91, top: 900, right: 291, bottom: 926, block: 5, color: '#626465' },
    { text: "DB vente carte etrangere 300517 bolt", left: 93, top: 980, right: 726, bottom: 1011, block: 8, color: '#212121' },
    { text: "Ref: FT26282 M2N8R\\BNK", left: 93, top: 1029, right: 529, bottom: 1064, block: 8, color: '#636567' },
    { text: "10", left: 963, top: 1101, right: 991, bottom: 1122, block: 17, color: '#222222' },
    { text: "MGA -12 340,", left: 671, top: 1113, right: 954, bottom: 1152, block: 14, color: '#1e1e1e' },
    { text: "07 oct. 2026", left: 91, top: 1245, right: 291, bottom: 1271, block: 7, color: '#626365' },
    { text: "DB vente carte etrangere 771045 SPOTIFY", left: 93, top: 1325, right: 812, bottom: 1358, block: 11, color: '#202020' },
    { text: "Ref: FT26280TT4WZ\\BNK", left: 93, top: 1379, right: 520, bottom: 1408, block: 9, color: '#626465' },
    { text: "MGA -21900,\"", left: 690, top: 1452, right: 1000, bottom: 1496, block: 18, color: '#1f1f1f' },
    { text: "06 oct. 2026", left: 91, top: 1590, right: 291, bottom: 1616, block: 10, color: '#626365' },
    { text: "Retrait sur GAB confrere 118320", left: 93, top: 1670, right: 640, bottom: 1698, block: 13, color: '#202020' },
    { text: "BNIMGXB-GAB-01-TANJOMBATO", left: 93, top: 1725, right: 682, bottom: 1753, block: 16, color: '#212121' },
    { text: "Ref: FT26279QQ7LM\\BNK", left: 93, top: 1779, right: 528, bottom: 1811, block: 15, color: '#636566' },
  ],
};

/** « Un aperçu de vos comptes » : solde seul, aucune opération. */
export const MCB_OVERVIEW_PAGE: OcrPage = {
  width: 1080,
  height: 2400,
  lines: [
    { text: "7:12", left: 49, top: 44, right: 120, bottom: 74, block: 0, color: '#d9d9d9' },
    { text: "Un aperçu de vos comptes", left: 49, top: 234, right: 808, bottom: 292, block: 1, color: '#151616' },
    { text: "Masquer solde", left: 492, top: 397, right: 697, bottom: 432, block: 6, color: '#202020' },
    { text: "Comptes à vue", left: 45, top: 577, right: 259, bottom: 611, block: 2, color: '#5d5f62' },
    { text: "Compte à vue", left: 203, top: 713, right: 467, bottom: 756, block: 4, color: '#191919' },
    { text: "00009876543", left: 202, top: 788, right: 451, bottom: 816, block: 4, color: '#5b5e61' },
    { text: "MGA 2 340 118,45", left: 643, top: 919, right: 987, bottom: 959, block: 8, color: '#181818' },
    { text: "Accueil", left: 62, top: 2219, right: 148, bottom: 2243, block: 3, color: '#0d0d0d' },
    { text: "Comptes", left: 269, top: 2221, right: 377, bottom: 2247, block: 5, color: '#bb324e' },
    { text: "Transferts", left: 478, top: 2221, right: 599, bottom: 2242, block: 7, color: '#0d0d0d' },
    { text: "Cartes", left: 717, top: 2221, right: 795, bottom: 2242, block: 9, color: '#0f0f0f' },
    { text: "Plus", left: 949, top: 2221, right: 997, bottom: 2242, block: 10, color: '#0d0d0d' },
  ],
};
