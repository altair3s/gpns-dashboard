// src/hooks/useStock.js
// ─────────────────────────────────────────────────────────────────────────────
// Fetche les données une seule fois, puis filtre côté client par période.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchStock } from '../api/stockApi.js';

/**
 * Filtre byDay et byMonth selon une période sélectionnée.
 * Agrège les byDay filtrés en byMonth côté client.
 */
function filterStock(raw, startDay, endDay) {
  if (!raw) return null;

  // Filtrer les jours
  const byDayFiltered = raw.byDay.filter(d => {
    if (startDay && d.day < startDay) return false;
    if (endDay   && d.day > endDay)   return false;
    return true;
  });

  // Ré-agréger par mois sur la période filtrée
  const monthMap = new Map();
  for (const d of byDayFiltered) {
    const e = monthMap.get(d.month) ?? { month: d.month, entrees: 0, sorties: 0 };
    e.entrees += d.entrees;
    e.sorties += d.sorties;
    monthMap.set(d.month, e);
  }
  const byMonth = [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month));

  return { ...raw, byDayFiltered, byMonth };
}

export function useStock() {
  const [raw,     setRaw]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Période sélectionnée
  const [startDay, setStartDay] = useState(null);
  const [endDay,   setEndDay]   = useState(null);
  // Granularité : 'day' | 'month'
  const [granularity, setGranularity] = useState('month');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStock();
      setRaw(data);
      // Initialiser sur la plage complète
      if (data.byDay.length) {
        setStartDay(data.byDay[0].day);
        setEndDay(data.byDay[data.byDay.length - 1].day);
      } else if (data.byMonth.length) {
        setStartDay(data.byMonth[0].month + '-01');
        setEndDay(data.byMonth[data.byMonth.length - 1].month + '-28');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const data = useMemo(() => filterStock(raw, startDay, endDay), [raw, startDay, endDay]);

  // Listes des mois disponibles pour le sélecteur
  const allMonths = useMemo(() => raw?.byMonth?.map(m => m.month) ?? [], [raw]);
  const allDays   = useMemo(() => raw?.byDay?.map(d => d.day)     ?? [], [raw]);

  return {
    data, loading, error, refetch: load,
    startDay, endDay, setStartDay, setEndDay,
    granularity, setGranularity,
    allMonths, allDays,
  };
}
