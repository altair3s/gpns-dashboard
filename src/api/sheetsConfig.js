// src/api/sheetsConfig.js
// ─────────────────────────────────────────────────────────────────────────────
// Centralise les identifiants et plages de cellules des deux Google Sheets.
// Toutes les valeurs sensibles viennent des variables d'environnement Vite.
// ─────────────────────────────────────────────────────────────────────────────

export const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
export const FILIALE = import.meta.env.VITE_FILIALE ?? 'GPNS';

// ── Noms des onglets (personnalisables via .env) ───────────────────────────
// VITE_SHEET_HEURES_TAB  : nom de l'onglet d'émargement  (défaut : "global")
// VITE_SHEET_HEURES_ROW  : 1ère ligne de données (défaut : 3 = 2 en-têtes groupés)
// VITE_SHEET_PRODUITS_TAB, VITE_SHEET_ENTREES_TAB, VITE_SHEET_SORTIES_TAB
const heuresTab  = import.meta.env.VITE_SHEET_HEURES_TAB  ?? 'global';
const heuresRow  = import.meta.env.VITE_SHEET_HEURES_ROW  ?? '3';
const produitsTab = import.meta.env.VITE_SHEET_PRODUITS_TAB ?? 'Produits';
const entreesTab  = import.meta.env.VITE_SHEET_ENTREES_TAB  ?? 'Entrées';
const sortiesTab  = import.meta.env.VITE_SHEET_SORTIES_TAB  ?? 'Sorties';

export const SHEETS = {
  heures: {
    id: import.meta.env.VITE_SHEET_HEURES_ID,
    ranges: [`${heuresTab}!A${heuresRow}:AK`],
  },
  produits: {
    id: import.meta.env.VITE_SHEET_PRODUITS_ID,
    ranges: [
      `${produitsTab}!A1:H`,
      `${entreesTab}!A1:G`,
      `${sortiesTab}!A1:G`,
    ],
  },
};

// ── Validation au démarrage ────────────────────────────────────────────────
// Lance une erreur lisible si des variables obligatoires sont manquantes,
// plutôt qu'un "spreadsheets/undefined" cryptique dans la console.
const REQUIRED = {
  VITE_GOOGLE_API_KEY:    API_KEY,
  VITE_SHEET_HEURES_ID:   import.meta.env.VITE_SHEET_HEURES_ID,
  VITE_SHEET_PRODUITS_ID: import.meta.env.VITE_SHEET_PRODUITS_ID,
};

const missing = Object.entries(REQUIRED)
  .filter(([, v]) => !v || v === 'undefined')
  .map(([k]) => k);

if (missing.length > 0) {
  const msg = [
    '╔══════════════════════════════════════════════════════╗',
    '║  GPNS Dashboard — variables .env manquantes          ║',
    '╠══════════════════════════════════════════════════════╣',
    ...missing.map((k) => `║  ✗  ${k.padEnd(48)}║`),
    '╠══════════════════════════════════════════════════════╣',
    '║  1. Copier .env.example → .env                       ║',
    '║  2. Remplir les valeurs                              ║',
    '║  3. Relancer : npm run dev                           ║',
    '╚══════════════════════════════════════════════════════╝',
  ].join('\n');
  console.error(msg);
  // On n'arrête pas l'app, mais les fetchs échoueront avec un message clair.
}

// Colonnes de la feuille "global" (index 0-based, à partir de la ligne 3)
export const HEURES_COLS = {
  BADGE:          0,
  TRIGRAMME:      1,
  NOM:            2,
  PRENOM:         3,
  SERVICE:        4,
  SITE:           5,
  QUALIFICATION:  6,
  TACHE:          7,
  JOUR:           8,   // date de la journée
  AGENCE:         9,   // non-vide = intérimaire (groupe "Intérim" dans la feuille)
  DEPARTEMENT:    10,  // département / affectation (colonne K)
  MOTIF:          11,  // motif d'absence si vide = présent
  DEBUT_PREV:     14,  // heure de début prévisionnel  ex: "06:00:00"
  FIN_PREV:       15,  // heure de fin prévisionnel    ex: "14:00:00"
  DUREE_PREV:     16,  // "07:00:00" | "MAL" | "CP" | "CSS" | "AT" …
  DUREE_POINTAGE: 21,  // durée badgeuse réelle
  DUREE_REEL:     24,  // durée réalisée
  TRAVAIL_EFF:    27,  // travail effectif (ex: "0 days 07:30:00") → colonne AB
  H_SUP:          28,
  ANOMALIE:       30,
};

// Colonnes des feuilles Produits / Entrées / Sorties
export const PROD_COLS = {
  ID: 0, PRODUIT: 1, CATEGORIE: 2, STOCK_INIT: 4, NIVEAU_REAPRO: 5, PRIX_HT: 6,
};
export const MVT_COLS = {
  TIMESTAMP: 0, DATE: 1, PRODUIT: 2, QUANTITE: 3, CLIENT: 4, REMARQUE: 5, USER: 6,
};
