// src/utils/parseHeures.js
// ─────────────────────────────────────────────────────────────────────────────
// Transforme les lignes brutes de la feuille d'émargement en objets métier.
// Expose aussi filterHeures() pour filtrer par période côté client.
// ─────────────────────────────────────────────────────────────────────────────

import { HEURES_COLS as C } from '../api/sheetsConfig.js';

// ── Codes d'absence reconnus dans DUREE_PREV ──────────────────────────────
const ABSENCE_CODES = new Set([
  'MAL','CP','CSS','AT','HDOFF','AR','ABI','DA','RCN','RC','CSS **CP**',
]);

export const MOTIF_LABELS = {
  MAL:         'Maladie',
  CP:          'Congé payé',
  CSS:         'CSS',
  AT:          'Accident travail',
  HDOFF:       'H. Off',
  AR:          'Autres',
  ABI:         'Absence injustifiée',
  DA:          'Disponibilité',
  RCN:         'RCN',
  RC:          'RC',
  'CSS **CP**': 'CSS/CP',
};

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Convertit n'importe quelle représentation Sheets d'une durée en heures (float).
 *
 * Google Sheets stocke les colonnes de type "durée / heure" comme fraction
 * décimale de 24h (ex. 7h = 0.291667). L'API peut aussi retourner une chaîne
 * formatée selon la locale du fichier.
 *
 *   0.291667        → 7.0h   (fraction Sheets, format le plus courant)
 *   "0.291667"      → 7.0h   (même valeur en string)
 *   "07:00:00"      → 7.0h   (HH:MM:SS)
 *   "7:00"          → 7.0h   (HH:MM)
 *   "0 days 07:00:00" → 7.0h (pandas timedelta)
 */
function toHours(raw) {
  if (raw === undefined || raw === null || raw === '') return 0;
  const s = String(raw).trim();
  if (!s || s === 'undefined' || s === 'null') return 0;

  // 1. Fraction décimale Sheets : 0.291667 = 7h (plage 0–3 couvre jusqu'à 72h)
  //    IMPORTANT : tester avant les regex pour capturer "0.291667" en string aussi.
  const num = Number(s);
  if (!isNaN(num) && num > 0 && num < 3) return num * 24;

  // 2. "0 days 07:30:00" — format pandas/Python dans le sheet
  const pd = s.match(/(\d+)\s+days?\s+(\d+):(\d+):(\d+)/);
  if (pd) return +pd[1] * 24 + +pd[2] + +pd[3] / 60 + +pd[4] / 3600;

  // 3. "07:30:00" ou "7:30" — HH:MM(:SS)
  const hms = s.match(/^(\d+):(\d+)(?::(\d+))?$/);
  if (hms) return +hms[1] + +hms[2] / 60 + (hms[3] ? +hms[3] / 3600 : 0);

  return 0;
}

/** "06:00:00" → heures décimales (6.0) */
function timeToH(str) {
  if (!str || typeof str !== 'string') return null;
  const m = str.match(/^(\d+):(\d+)/);
  return m ? +m[1] + +m[2] / 60 : null;
}

/**
 * Normalise n'importe quel format de date Google Sheets → "YYYY-MM-DD".
 *
 * Google Sheets renvoie la colonne "Jour" dans plusieurs formats selon
 * la locale du fichier :
 *   "2026-03-22"           → ISO, déjà correct
 *   "22/03/2026"           → DD/MM/YYYY (locale FR)
 *   "dimanche 22/03/2026"  → nom du jour + DD/MM/YYYY (locale FR étendue)
 *   "22/03/26"             → DD/MM/YY (année 2 chiffres)
 *   46017                  → serial number Excel/Sheets
 */
function normalizeDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();

  // 1. ISO "YYYY-MM-DD" ou "YYYY-MM-DDThh:mm…"
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // 2. "dimanche 22/03/2026" ou "22/03/2026" ou "22/03/26"
  //    Cherche DD/MM/YYYY ou DD/MM/YY n'importe où dans la chaîne
  const dmy = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? (parseInt(y, 10) + 2000) : parseInt(y, 10);
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 3. "22-03-2026" avec tirets
  const dmy2 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy2) {
    const [, d, m, y] = dmy2;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // 4. Serial number Excel/Sheets (entier > 40 000)
  const serial = Number(s);
  if (!isNaN(serial) && serial > 40000 && serial < 100000) {
    return new Date(Date.UTC(1899, 11, 30) + serial * 86400000)
      .toISOString().slice(0, 10);
  }

  return null; // format non reconnu → ignoré
}

/**
 * Calcule les heures de nuit d'un créneau.
 * Définition : plage horaire entre 21h00 et 06h00 du lendemain.
 * @param {number|null} debut  heure décimale de début  (ex: 22.5 = 22h30)
 * @param {number|null} fin    heure décimale de fin    (ex: 5.0  = 05h00)
 *   Si fin < debut → shift à cheval sur minuit (fin += 24)
 * @returns {number} heures de nuit
 */
function calcNightHours(debut, fin) {
  if (debut === null || fin === null) return 0;

  // Normalise le shift à cheval sur minuit
  if (fin <= debut) fin += 24;

  const NIGHT_A_START = 21, NIGHT_A_END = 24;   // 21h → minuit
  const NIGHT_B_START = 0,  NIGHT_B_END = 6;    // minuit → 6h

  const overlap = (s1, e1, s2, e2) => Math.max(0, Math.min(e1, e2) - Math.max(s1, s2));

  // Overlap avec 21h-24h
  let night = overlap(debut, fin, NIGHT_A_START, NIGHT_A_END);

  // Overlap avec 0h-6h (shift ou partie du shift peut commencer après minuit)
  // Pour le segment 0h-6h, le shift peut être soit au-delà de 24h
  night += overlap(debut, fin, NIGHT_B_START + 24, NIGHT_B_END + 24); // shift "fin+24"
  night += overlap(debut, fin, NIGHT_B_START, NIGHT_B_END);            // début < 6

  return night;
}

// ── Types ──────────────────────────────────────────────────────────────────
/**
 * @typedef {Object} AgentRow
 * @property {string}  nom
 * @property {string}  prenom
 * @property {string}  service
 * @property {string}  site
 * @property {string}  qualification
 * @property {string}  date           "YYYY-MM-DD"
 * @property {string}  motif          'PRESENT' | 'MAL' | 'CP' | …
 * @property {number}  heures         travail effectif
 * @property {number}  heuresNuit     heures de nuit
 * @property {boolean} isInterim      true si agence non vide
 * @property {boolean} anomalie
 */

/**
 * @typedef {Object} HeuresSummary
 * @property {AgentRow[]} rows
 * @property {string[]}   allDates   liste triée de toutes les dates disponibles
 * @property {number}     totalHeures
 * @property {number}     totalAgents
 * @property {number}     tauxPresence
 * @property {number}     totalAbsences
 * @property {number}     heuresCDI
 * @property {number}     heuresInterim
 * @property {number}     heuresNuit
 * @property {{ date:string, presents:number, absents:number, heures:number }[]} byDay
 * @property {{ motif:string, label:string, count:number }[]}                   byMotif
 * @property {{ qualification:string, total:number, presents:number }[]}        byQual
 * @property {{ site:string, total:number, presents:number }[]}                 bySite
 * @property {number} anomalies
 */

// ── Parser principal ───────────────────────────────────────────────────────

/** @param {string[][]} rawRows @returns {HeuresSummary} */
export function parseHeures(rawRows) {
  /** @type {AgentRow[]} */
  const rows = rawRows.map((row) => {
    const duree    = (row[C.DUREE_PREV] ?? '').trim();
    const motif    = ABSENCE_CODES.has(duree) ? duree : 'PRESENT';
    const heures   = motif === 'PRESENT' ? toHours(row[C.TRAVAIL_EFF]) : 0;
    // Détection intérimaire :
    //   Priorité 1 : colonne Agence (index 9) non vide → intérimaire
    //   Priorité 2 : SERVICE contient le mot « intérim » (fallback)
    const agence = row[C.AGENCE]?.toString().trim() ?? '';
    const isInterim = agence.length > 0 ||
                      /int[ée]rim/i.test(row[C.SERVICE] ?? '');

    // Heures de nuit + heures prévues pour les absents (créneau planifié fin - début)
    const debut = timeToH(row[C.DEBUT_PREV]);
    const fin   = timeToH(row[C.FIN_PREV]);
    const heuresNuit    = motif === 'PRESENT' ? calcNightHours(debut, fin) : 0;
    const heuresPrevues = motif !== 'PRESENT' && debut !== null && fin !== null
      ? (fin > debut ? fin - debut : fin + 24 - debut)
      : 0;

    return {
      nom:           row[C.NOM]            ?? '',
      prenom:        row[C.PRENOM]         ?? '',
      service:       row[C.SERVICE]        ?? '',
      site:          row[C.SITE]           ?? '',
      qualification: row[C.QUALIFICATION] ?? '',
      date:          normalizeDate(row[C.JOUR]),
      motif,
      heures,
      heuresPrevues,
      heuresNuit,
      isInterim,
      agence:        agence,
      departement:   row[C.DEPARTEMENT]?.toString().trim() ?? '',
      anomalie:      !!(row[C.ANOMALIE]?.trim()),
    };
  });

  // Debug — format brut + détection intérim
  if (typeof window !== 'undefined' && rows.length) {
    const interimCount = rows.filter(r => r.isInterim).length;
    console.debug('[GPNS] parseHeures – intérimaires détectés :', interimCount, '/', rows.length);
    console.debug('[GPNS] parseHeures – 3 premières lignes parsées :',
      rows.slice(0, 3).map(r => ({
        nom: r.nom, date: r.date, motif: r.motif,
        heures: r.heures, isInterim: r.isInterim,
      }))
    );
  }
  // Debug — inspecter le format brut des 3 premières lignes utiles
  if (typeof window !== 'undefined' && rows.length) {
    const sample = rows.slice(0, 3).map(r => ({
      nom:       r.nom,
      date:      r.date,
      motif:     r.motif,
      heures:    r.heures,
      isInterim: r.isInterim,
    }));
    console.debug('[GPNS] parseHeures – 3 premières lignes parsées :', sample);
  }

  return computeSummary(rows);
}

// ── Filtre par période (client-side, pas de re-fetch) ─────────────────────

/**
 * Filtre les rows par période et recalcule tous les agrégats.
 * @param {HeuresSummary} summary
 * @param {string|null} start  "YYYY-MM-DD"
 * @param {string|null} end    "YYYY-MM-DD"
 * @returns {HeuresSummary}
 */
export function filterHeures(summary, start, end) {
  const rows = summary.rows.filter((r) => {
    if (!r.date) return false;
    if (start && r.date < start) return false;
    if (end   && r.date > end)   return false;
    return true;
  });
  return { ...computeSummary(rows), allDates: summary.allDates };
}

// ── Calcul des agrégats ────────────────────────────────────────────────────

function computeSummary(rows) {
  const presents  = rows.filter((r) => r.motif === 'PRESENT');
  const absents   = rows.filter((r) => r.motif !== 'PRESENT');

  const totalHeures   = presents.reduce((s, r) => s + r.heures, 0);
  const heuresCDI     = presents.filter((r) => !r.isInterim).reduce((s, r) => s + r.heures, 0);
  const heuresInterim = presents.filter((r) =>  r.isInterim).reduce((s, r) => s + r.heures, 0);
  const heuresNuit    = presents.reduce((s, r) => s + r.heuresNuit, 0);
  const heuresTRI     = presents
    .filter(r => (!r.isInterim && r.site === 'TRI_ADP') || (r.isInterim && r.departement === 'GPNS ADP TRI'))
    .reduce((s, r) => s + r.heures, 0);
  const heuresLOCAUX  = presents
    .filter(r => (!r.isInterim && r.site === 'LOCAUX') || (r.isInterim && r.departement === 'GPNS LOCAUX'))
    .reduce((s, r) => s + r.heures, 0);
  const totalAgents   = new Set(rows.map((r) => `${r.nom}|${r.prenom}`)).size;
  const tauxPresence  = rows.length ? presents.length / rows.length : 0;

  // ── Par jour ─────────────────────────────────────────────────────────────
  const dayMap = new Map();
  for (const r of rows) {
    if (!r.date) continue;
    const e = dayMap.get(r.date) ?? { date: r.date, presents: 0, absents: 0, heures: 0, heuresInterim: 0, heuresNuit: 0 };
    if (r.motif === 'PRESENT') {
      e.presents++;
      e.heures += r.heures;
      if (r.isInterim) e.heuresInterim += r.heures;
      e.heuresNuit += r.heuresNuit;
    } else e.absents++;
    dayMap.set(r.date, e);
  }
  const byDay = [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  // ── Par motif — avec heures, répartition CDI/Intérim et liste agents ────
  const motifMap = new Map();
  for (const r of absents) {
    const e = motifMap.get(r.motif) ?? { agents: [], heures: 0, nbCDI: 0, nbInterim: 0 };
    e.agents.push({ nom: r.nom, prenom: r.prenom, date: r.date, site: r.site, qualification: r.qualification, isInterim: r.isInterim });
    e.heures += r.heuresPrevues;
    if (r.isInterim) e.nbInterim++; else e.nbCDI++;
    motifMap.set(r.motif, e);
  }
  const byMotif = [...motifMap.entries()]
    .map(([motif, e]) => ({
      motif,
      label:     MOTIF_LABELS[motif] ?? motif,
      count:     e.agents.length,
      heures:    e.heures,
      nbCDI:     e.nbCDI,
      nbInterim: e.nbInterim,
      agents:    e.agents,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Par qualification ─────────────────────────────────────────────────────
  const qualMap = new Map();
  for (const r of rows) {
    const e = qualMap.get(r.qualification) ?? { qualification: r.qualification, total: 0, presents: 0 };
    e.total++;
    if (r.motif === 'PRESENT') e.presents++;
    qualMap.set(r.qualification, e);
  }
  const byQual = [...qualMap.values()].sort((a, b) => b.total - a.total);

  // ── Par site ──────────────────────────────────────────────────────────────
  // ── Par site — heures, effectifs CDI/Intérim ─────────────────────────────
  const siteMap = new Map();
  for (const r of rows) {
    const e = siteMap.get(r.site) ?? {
      site: r.site, total: 0, presents: 0,
      heures: 0, heuresCDI: 0, heuresInterim: 0,
      nbCDI: new Set(), nbInterim: new Set(),
      agencies: new Map(),
    };
    e.total++;
    if (r.motif === 'PRESENT') {
      e.presents++;
      e.heures += r.heures;
      const key = `${r.nom}|${r.prenom}`;
      if (r.isInterim) {
        e.heuresInterim += r.heures;
        e.nbInterim.add(key);
        const agName = r.agence || '(sans agence)';
        const ag = e.agencies.get(agName) ?? { heures: 0, agents: new Set(), departements: new Set() };
        ag.heures += r.heures;
        ag.agents.add(key);
        if (r.departement) ag.departements.add(r.departement);
        e.agencies.set(agName, ag);
      } else {
        e.heuresCDI += r.heures;
        e.nbCDI.add(key);
      }
    }
    siteMap.set(r.site, e);
  }
  const bySite = [...siteMap.values()].map(s => ({
    site:          s.site,
    total:         s.total,
    presents:      s.presents,
    heures:        s.heures,
    heuresCDI:     s.heuresCDI,
    heuresInterim: s.heuresInterim,
    nbCDI:         s.nbCDI.size,
    nbInterim:     s.nbInterim.size,
    agencies:      [...s.agencies.entries()].map(([agence, a]) => ({
      agence,
      heures:       a.heures,
      nbAgents:     a.agents.size,
      departements: [...a.departements].filter(Boolean).sort(),
    })).sort((a, b) => b.heures - a.heures),
  })).sort((a, b) => b.heures - a.heures);

  const allDates = [...new Set(rows.map((r) => r.date).filter(Boolean))].sort();

  return {
    rows,
    allDates,
    totalHeures,
    totalAgents,
    tauxPresence,
    totalAbsences: absents.length,
    heuresCDI,
    heuresInterim,
    heuresNuit,
    heuresTRI,
    heuresLOCAUX,
    byDay,
    byMotif,
    byQual,
    bySite,
    anomalies: rows.filter((r) => r.anomalie).length,
  };
}
