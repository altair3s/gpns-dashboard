// src/api/sheetsClient.js
import { API_KEY } from './sheetsConfig.js';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

const HINTS = {
  400: "Vérifier le nom de l'onglet (VITE_SHEET_HEURES_TAB dans .env) et la plage.",
  403: "Clé API invalide, API Sheets non activée sur GCP, ou fichier non partagé en lecture publique.",
  404: "ID du Google Sheet introuvable — vérifier VITE_SHEET_HEURES_ID / VITE_SHEET_PRODUITS_ID dans .env.",
};

export async function batchGet(spreadsheetId, ranges) {
  // Validation précoce : évite un appel réseau inutile si .env non rempli
  if (!API_KEY || API_KEY === 'undefined') {
    throw new Error(
      "VITE_GOOGLE_API_KEY manquant dans .env\n" +
      "→ Créer une clé sur console.cloud.google.com (APIs & Services → Credentials)\n" +
      "→ Activer l'API Google Sheets dans le projet GCP\n" +
      "→ Ajouter la clé dans .env puis relancer npm run dev"
    );
  }
  if (!spreadsheetId || spreadsheetId === 'undefined') {
    throw new Error(
      "ID de Google Sheet manquant dans .env\n" +
      "→ L'ID se trouve dans l'URL du fichier : docs.google.com/spreadsheets/d/[ID]/edit\n" +
      "→ Renseigner VITE_SHEET_HEURES_ID et VITE_SHEET_PRODUITS_ID dans .env"
    );
  }

  const params = new URLSearchParams({ key: API_KEY });
  ranges.forEach((r) => params.append('ranges', r));
  const url = `${BASE}/${spreadsheetId}/values:batchGet?${params}`;

  let res;
  try {
    res = await fetch(url);
  } catch (networkErr) {
    throw new Error(`Erreur réseau — ${networkErr.message}`);
  }

  if (!res.ok) {
    const body   = await res.json().catch(() => ({}));
    const apiMsg = body?.error?.message ?? res.statusText;
    const hint   = HINTS[res.status] ?? '';
    throw new Error(
      `Sheets API ${res.status} : ${apiMsg}${hint ? `\n💡 ${hint}` : ''}`
    );
  }

  const json = await res.json();
  return (json.valueRanges ?? []).map((vr) => vr.values ?? []);
}

export async function getRange(spreadsheetId, range) {
  const [rows] = await batchGet(spreadsheetId, [range]);
  return rows;
}
