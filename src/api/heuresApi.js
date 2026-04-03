// src/api/heuresApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Récupère et normalise les données brutes de la feuille "global" (émargement).
// ─────────────────────────────────────────────────────────────────────────────

import { batchGet }        from './sheetsClient.js';
import { SHEETS, HEURES_COLS as C } from './sheetsConfig.js';
import { parseHeures }      from '../utils/parseHeures.js';

/**
 * @returns {Promise<import('../utils/parseHeures').HeuresSummary>}
 */
export async function fetchHeures() {
  const [rows] = await batchGet(SHEETS.heures.id, SHEETS.heures.ranges);

  // La première ligne retournée est la ligne d'en-têtes (ligne 3 du sheet).
  // On la saute et on ne garde que les lignes ayant un nom (col NOM non vide).
  const header = rows[0] ?? [];
  const data   = rows
    .slice(1)
    .filter((row) => row[C.NOM]?.trim());   // ignore lignes vides / sous-lignes

  // ── Log de diagnostic (console du navigateur → onglet "Console") ──────────
  // Affiche les 2 premières lignes brutes pour vérifier les formats réels
  // de la colonne "travail effectif" (index 27 = col AB) et "Jour" (index 8).
  if (data.length > 0) {
    const C = { JOUR: 8, DUREE_PREV: 16, TRAVAIL_EFF: 27, AGENCE: 9 };
    console.debug('[GPNS] heuresApi – colonnes clés, ligne 1 (raw) :', {
      JOUR:        data[0]?.[C.JOUR],
      DUREE_PREV:  data[0]?.[C.DUREE_PREV],
      TRAVAIL_EFF: data[0]?.[C.TRAVAIL_EFF],
      AGENCE:      data[0]?.[C.AGENCE],
      rowLength:   data[0]?.length,
    });
    if (data[1]) console.debug('[GPNS] heuresApi – colonnes clés, ligne 2 (raw) :', {
      JOUR:        data[1]?.[C.JOUR],
      DUREE_PREV:  data[1]?.[C.DUREE_PREV],
      TRAVAIL_EFF: data[1]?.[C.TRAVAIL_EFF],
      AGENCE:      data[1]?.[C.AGENCE],
      rowLength:   data[1]?.length,
    });
    console.debug('[GPNS] heuresApi – total lignes avec Nom :', data.length);
  }

  return parseHeures(data);
}
