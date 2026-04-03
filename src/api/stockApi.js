// src/api/stockApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Récupère et normalise les données des feuilles Produits, Entrées, Sorties.
// ─────────────────────────────────────────────────────────────────────────────

import { batchGet }          from './sheetsClient.js';
import { SHEETS, FILIALE }   from './sheetsConfig.js';
import { parseStock }         from '../utils/parseStock.js';

/**
 * @returns {Promise<import('../utils/parseStock').StockSummary>}
 */
export async function fetchStock() {
  const [prodRows, entreesRows, sortiesRows] = await batchGet(
    SHEETS.produits.id,
    SHEETS.produits.ranges
  );

  // Chaque feuille commence par une ligne d'en-têtes
  const produits = prodRows.slice(1);
  const entrees  = entreesRows.slice(1);
  const sorties  = sortiesRows.slice(1);

  return parseStock({ produits, entrees, sorties, filiale: FILIALE });
}
