// src/hooks/useHeures.js
// ─────────────────────────────────────────────────────────────────────────────
// Fetche les données une seule fois, puis filtre côté client selon la période.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchHeures }           from '../api/heuresApi.js';
import { filterHeures }          from '../utils/parseHeures.js';

export function useHeures() {
  // Données brutes (toute la période disponible dans le sheet)
  const [raw,     setRaw]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Période sélectionnée (null = pas de filtre)
  const [startDate, setStartDate] = useState(null);
  const [endDate,   setEndDate]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await fetchHeures();
      setRaw(summary);
      // Initialiser les dates sur la plage complète disponible
      if (summary.allDates.length) {
        const today = new Date();
        const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstStr = firstOfMonth.toISOString().slice(0, 10);
        const yestStr  = yesterday.toISOString().slice(0, 10);
        const min = summary.allDates[0];
        const max = summary.allDates[summary.allDates.length - 1];
        setStartDate(firstStr < min ? min : firstStr > max ? min : firstStr);
        setEndDate(yestStr > max ? max : yestStr < min ? max : yestStr);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filtrage réactif — recalcul sans re-fetch
  const data = useMemo(() => {
    if (!raw) return null;
    return filterHeures(raw, startDate, endDate);
  }, [raw, startDate, endDate]);

  return {
    data,
    loading,
    error,
    refetch: load,
    // Contrôles de période
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    allDates: raw?.allDates ?? [],
  };
}
