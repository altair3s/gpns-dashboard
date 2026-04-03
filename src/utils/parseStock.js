// src/utils/parseStock.js
// ─────────────────────────────────────────────────────────────────────────────
// Calcule le stock réel, les alertes et les agrégats à partir des trois
// feuilles (Produits, Entrées, Sorties).
// ─────────────────────────────────────────────────────────────────────────────

import { PROD_COLS as PC, MVT_COLS as MC } from '../api/sheetsConfig.js';

function num(v) { return parseFloat(String(v).replace(',', '.')) || 0; }

/**
 * Normalise n'importe quel format de date Google Sheets → "YYYY-MM-DD"
 * Gère : ISO, DD/MM/YYYY, "dimanche 22/03/2026", serial Excel, timestamp ISO.
 */
function normalizeDay(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // 1. ISO "YYYY-MM-DD…"
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // 2. "25/01/2026" ou "dimanche 25/01/2026"
  const dmy = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? +y + 2000 : +y;
    return `${year}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }

  // 3. Serial number Excel/Sheets (40000–60000)
  const n = Number(s);
  if (!isNaN(n) && n > 40000 && n < 60000)
    return new Date(Date.UTC(1899,11,30) + n * 86400000).toISOString().slice(0,10);

  return null;
}

function monthKey(raw) {
  const d = normalizeDay(raw);
  return d ? d.slice(0, 7) : null;
}

/**
 * @typedef {Object} ProduitRow
 * @property {string}  id
 * @property {string}  produit
 * @property {string}  categorie
 * @property {number}  stockInitial
 * @property {number}  niveauReapro
 * @property {number}  prixHT
 * @property {number}  entrees
 * @property {number}  sorties
 * @property {number}  stockReel
 * @property {boolean} alerte        stock ≤ niveauReapro
 * @property {boolean} rupture       stock ≤ 0
 */

/**
 * @typedef {Object} StockSummary
 * @property {ProduitRow[]} produits
 * @property {number}       totalRefs
 * @property {number}       totalAlertes
 * @property {number}       totalRuptures
 * @property {{ cat:string, total:number, alertes:number, critiques:number }[]} byCategorie
 * @property {{ produit:string, qte:number }[]}  topSortiesFiliale
 * @property {{ month:string, entrees:number, sorties:number }[]} byMonth
 */

/**
 * @param {{ produits:string[][], entrees:string[][], sorties:string[][], filiale:string }} params
 * @returns {StockSummary}
 */
export function parseStock({ produits, entrees, sorties, filiale }) {

  // ── Sommer les entrées et sorties par nom de produit ──────────────────────
  const entreesMap = new Map();
  const sortiesMap = new Map();

  for (const row of entrees) {
    const produit = row[MC.PRODUIT]?.trim();
    if (!produit) continue;
    entreesMap.set(produit, (entreesMap.get(produit) ?? 0) + num(row[MC.QUANTITE]));
  }
  for (const row of sorties) {
    const produit = row[MC.PRODUIT]?.trim();
    if (!produit) continue;
    sortiesMap.set(produit, (sortiesMap.get(produit) ?? 0) + num(row[MC.QUANTITE]));
  }

  // ── Construire les lignes produit ─────────────────────────────────────────
  /** @type {ProduitRow[]} */
  const produitRows = produits
    .filter((row) => row[PC.PRODUIT]?.trim())
    .map((row) => {
      const produit      = row[PC.PRODUIT].trim();
      const stockInitial = num(row[PC.STOCK_INIT]);
      const niveauReapro = num(row[PC.NIVEAU_REAPRO]);
      const prixHT       = num(row[PC.PRIX_HT]);
      const ent          = entreesMap.get(produit) ?? 0;
      const sor          = sortiesMap.get(produit) ?? 0;
      const stockReel    = stockInitial + ent - sor;

      // Historique des mouvements pour le drill-down table
      const mvtEntrees = entrees
        .filter(r => r[MC.PRODUIT]?.trim() === produit)
        .map(r => ({ date: normalizeDay(r[MC.DATE]), qte: num(r[MC.QUANTITE]), client: r[MC.CLIENT]?.trim() ?? '', type: 'entree' }))
        .filter(r => r.date)
        .sort((a, b) => b.date.localeCompare(a.date));
      const mvtSorties = sorties
        .filter(r => r[MC.PRODUIT]?.trim() === produit)
        .map(r => ({ date: normalizeDay(r[MC.DATE]), qte: num(r[MC.QUANTITE]), client: r[MC.CLIENT]?.trim() ?? '', remarque: r[MC.REMARQUE]?.trim() ?? '', type: 'sortie' }))
        .filter(r => r.date)
        .sort((a, b) => b.date.localeCompare(a.date));
      const mouvements = [...mvtEntrees, ...mvtSorties].sort((a, b) => b.date.localeCompare(a.date));

      return {
        id:            row[PC.ID]        ?? '',
        produit,
        categorie:     row[PC.CATEGORIE] ?? '',
        stockInitial,
        niveauReapro,
        prixHT,
        entrees:  ent,
        sorties:  sor,
        stockReel,
        alerte:  stockReel <= niveauReapro,
        rupture: stockReel <= 0,
        mouvements,
      };
    });

  // ── Agrégats globaux ──────────────────────────────────────────────────────
  const totalRefs     = produitRows.length;
  const totalAlertes  = produitRows.filter((p) => p.alerte).length;
  const totalRuptures = produitRows.filter((p) => p.rupture).length;

  // ── Par catégorie ─────────────────────────────────────────────────────────
  const catMap = new Map();
  for (const p of produitRows) {
    const e = catMap.get(p.categorie) ?? { cat: p.categorie, total: 0, alertes: 0, critiques: 0 };
    e.total++;
    if (p.alerte)   e.alertes++;
    if (p.rupture)  e.critiques++;
    catMap.set(p.categorie, e);
  }
  const byCategorie = [...catMap.values()].sort((a, b) => b.total - a.total);

  // ── Top sorties pour la filiale ───────────────────────────────────────────
  const filialeMap = new Map();
  for (const row of sorties) {
    const client  = (row[MC.CLIENT] ?? '').trim();
    if (client !== filiale) continue;
    const produit = row[MC.PRODUIT]?.trim();
    if (!produit) continue;
    filialeMap.set(produit, (filialeMap.get(produit) ?? 0) + num(row[MC.QUANTITE]));
  }
  const topSortiesFiliale = [...filialeMap.entries()]
    .map(([produit, qte]) => ({ produit, qte }))
    .sort((a, b) => b.qte - a.qte)
    .slice(0, 10);

  // ── Mouvements par jour ET par mois ──────────────────────────────────────
  const dayMap   = new Map();
  const monthMap = new Map();

  const ensureDay = (d) => {
    if (!dayMap.has(d)) dayMap.set(d, { day: d, month: d.slice(0,7), entrees: 0, sorties: 0 });
    return dayMap.get(d);
  };
  const ensureMonth = (m) => {
    if (!monthMap.has(m)) monthMap.set(m, { month: m, entrees: 0, sorties: 0 });
    return monthMap.get(m);
  };

  for (const row of entrees) {
    const d = normalizeDay(row[MC.DATE]);
    const m = d ? d.slice(0,7) : null;
    const q = num(row[MC.QUANTITE]);
    const produit = row[MC.PRODUIT]?.trim() ?? '';
    const client  = row[MC.CLIENT]?.trim()  ?? '';
    const item    = { produit, qte: q, client, type: 'entree' };
    if (d) { const e = ensureDay(d);   e.entrees += q; (e.items ??= []).push(item); }
    if (m) { const e = ensureMonth(m); e.entrees += q; (e.items ??= []).push(item); }
  }
  for (const row of sorties) {
    const d = normalizeDay(row[MC.DATE]);
    const m = d ? d.slice(0,7) : null;
    const q = num(row[MC.QUANTITE]);
    const produit  = row[MC.PRODUIT]?.trim()  ?? '';
    const client   = row[MC.CLIENT]?.trim()   ?? '';
    const remarque = row[MC.REMARQUE]?.trim() ?? '';
    const item     = { produit, qte: q, client, remarque, type: 'sortie' };
    if (d) { const e = ensureDay(d);   e.sorties += q; (e.items ??= []).push(item); }
    if (m) { const e = ensureMonth(m); e.sorties += q; (e.items ??= []).push(item); }
  }

  const byDay   = [...dayMap.values()].sort((a,b) => a.day.localeCompare(b.day));
  const byMonth = [...monthMap.values()].sort((a,b) => a.month.localeCompare(b.month));

  // Debug
  if (typeof console !== 'undefined') {
    console.debug('[GPNS] parseStock – byDay:', byDay.length, 'jours, byMonth:', byMonth.length, 'mois');
    if (byMonth.length === 0) {
      console.warn('[GPNS] parseStock – aucune date reconnue. Exemples bruts:',
        entrees.slice(0,2).map(r => r[MC.DATE]),
        sorties.slice(0,2).map(r => r[MC.DATE])
      );
    }
  }

  return {
    produits: produitRows.sort((a, b) => b.sorties - a.sorties),
    totalRefs,
    totalAlertes,
    totalRuptures,
    byCategorie,
    topSortiesFiliale,
    byDay,
    byMonth,
  };
}
