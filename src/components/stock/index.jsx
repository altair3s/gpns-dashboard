// src/components/stock/index.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Composants graphiques et tableaux de la page Stock.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { ProgressBar, Badge } from '../ui/index.jsx';

// ── Top sorties filiale ────────────────────────────────────────────────────
export function GpnsTopChart({ data }) {
  const chartData = data.map((d) => ({
    name: d.produit.length > 28 ? d.produit.slice(0, 26) + '…' : d.produit,
    Qté: d.qte,
  }));
  return (
    <ResponsiveContainer width="100%" height={290}>
      <BarChart data={chartData} layout="vertical" barSize={14} margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 0" horizontal={false} stroke="rgba(0,0,0,.06)" />
        <XAxis type="number" tick={{ fontSize: 9, fill: '#888' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 10, fill: '#555' }}
          axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '.5px solid rgba(0,0,0,.1)' }} />
        <Bar dataKey="Qté" fill="rgba(245,158,11,.75)" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Sélecteur période mouvements ──────────────────────────────────────────
const MONTHS_FR = ['','Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];

const fmtMonth = (m) => {
  const [y, mo] = m.split('-');
  return `${MONTHS_FR[+mo]} ${y}`;
};
const fmtDay = (d) => d?.slice(5) ?? ''; // "2026-02-14" → "02-14"

export function MouvementsPicker({ startDay, endDay, allMonths, allDays, onStart, onEnd, granularity, setGranularity }) {
  const minDay = allDays[0] ?? '';
  const maxDay = allDays[allDays.length - 1] ?? '';

  // Preset : sélectionne un mois entier
  const pickMonth = (month) => {
    onStart(month + '-01');
    // Dernier jour du mois
    const [y, m] = month.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    onEnd(`${month}-${String(lastDay).padStart(2,'0')}`);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '10px 14px', background: '#F0FDF4',
      border: '.5px solid #A7F3D0', borderRadius: 10, fontSize: 12, marginBottom: 14,
    }}>
      {/* Granularité */}
      <span style={{ fontSize: 10, fontWeight: 600, color: '#065F46', textTransform: 'uppercase', letterSpacing: '.05em' }}>Vue</span>
      {['month','day'].map(g => (
        <button key={g} onClick={() => setGranularity(g)} style={{
          padding: '3px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
          border: '.5px solid #6EE7B7',
          background: granularity === g ? '#10B981' : 'white',
          color: granularity === g ? 'white' : '#065F46', fontWeight: 500,
        }}>{g === 'month' ? 'Mensuel' : 'Journalier'}</button>
      ))}

      <span style={{ color: '#A7F3D0' }}>|</span>

      {/* Sélecteur mois rapide */}
      <span style={{ fontSize: 10, fontWeight: 600, color: '#065F46', textTransform: 'uppercase', letterSpacing: '.05em' }}>Mois</span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {allMonths.map(m => (
          <button key={m} onClick={() => pickMonth(m)} style={{
            padding: '3px 9px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
            border: '.5px solid #A7F3D0', background: 'white', color: '#065F46', fontWeight: 500,
          }}>{fmtMonth(m)}</button>
        ))}
        <button onClick={() => { onStart(minDay); onEnd(maxDay); }} style={{
          padding: '3px 9px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
          border: '.5px solid #A7F3D0', background: 'white', color: '#065F46', fontWeight: 500,
        }}>Tout</button>
      </div>

      <span style={{ color: '#A7F3D0' }}>|</span>

      {/* Dates custom */}
      {[['Du', startDay, minDay, endDay ?? maxDay, onStart], ['au', endDay, startDay ?? minDay, maxDay, onEnd]].map(([lbl, val, mn, mx, fn]) => (
        <label key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#374151' }}>
          {lbl}
          <input type="date" value={val ?? ''} min={mn} max={mx}
            onChange={e => fn(e.target.value)}
            style={{ border: '.5px solid #D1D5DB', borderRadius: 6, padding: '3px 8px', fontSize: 12 }} />
        </label>
      ))}
    </div>
  );
}

// ── Mouvements chart ───────────────────────────────────────────────────────
const CustomMvtTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '.5px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: '#111' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 600, color: '#111' }}>{p.value} u.</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '.5px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B7280' }}>
          <span>Balance</span>
          <span style={{ fontWeight: 600, color: payload[0].value - payload[1].value >= 0 ? '#059669' : '#DC2626' }}>
            {payload[0].value - payload[1].value >= 0 ? '+' : ''}{payload[0].value - payload[1].value}
          </span>
        </div>
      )}
    </div>
  );
};

export function MouvementsChart({ data, granularity }) {
  const [drill, setDrill] = useState(null);  // { label, items }

  const byDay   = data?.byDayFiltered ?? [];
  const byMonth = data?.byMonth       ?? [];
  const useDay  = granularity === 'day';
  const rows    = useDay ? byDay : byMonth;

  const chartData = rows.map(r => ({
    label:   useDay ? fmtDay(r.day) : fmtMonth(r.month),
    Entrées: Math.round(r.entrees),
    Sorties: Math.round(r.sorties),
    _items:  r.items ?? [],
    _key:    useDay ? r.day : r.month,
  }));

  const hasData = chartData.some(r => r.Entrées > 0 || r.Sorties > 0);

  // Agréger les items par produit pour le drill-down
  const aggregateItems = (items) => {
    const map = new Map();
    for (const it of items) {
      if (!it.produit) continue;
      const key = `${it.type}|${it.produit}`;
      const e = map.get(key) ?? { ...it, qte: 0 };
      e.qte += it.qte;
      map.set(key, e);
    }
    return [...map.values()].sort((a, b) => b.qte - a.qte);
  };

  const handleBarClick = (barData) => {
    if (!barData?.activePayload?.[0]) return;
    const row = barData.activePayload[0].payload;
    setDrill({ label: row.label, items: aggregateItems(row._items) });
  };

  if (!hasData) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: 220, color: '#9CA3AF', fontSize: 13, gap: 8 }}>
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#D1D5DB" strokeWidth="1.5">
        <path strokeLinecap="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <div>Aucun mouvement sur la période sélectionnée</div>
      <div style={{ fontSize: 11 }}>Essayez « Tout » ou changez les dates</div>
    </div>
  );

  const barSize = useDay ? Math.max(4, Math.min(16, Math.floor(540 / (rows.length * 2 + 4)))) : 24;
  const totalIn  = chartData.reduce((s, r) => s + r.Entrées, 0);
  const totalOut = chartData.reduce((s, r) => s + r.Sorties, 0);

  return (
    <div>
      {/* Totaux */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Entrées', v: totalIn,  color: '#059669', bg: '#D1FAE5' },
          { label: 'Sorties', v: totalOut, color: '#DC2626', bg: '#FEE2E2' },
        ].map(({ label, v, color, bg }) => (
          <div key={label} style={{ flex: 1, padding: '8px 12px', borderRadius: 10, background: bg, border: `.5px solid ${color}30` }}>
            <div style={{ fontSize: 10, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color }}>{v.toLocaleString('fr')} u.</div>
          </div>
        ))}
      </div>

      {/* Hint cliquable */}
      <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 6, textAlign: 'right' }}>
        Cliquez sur une barre pour voir les produits
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barGap={3} barCategoryGap={useDay ? '30%' : '40%'}
          onClick={handleBarClick} style={{ cursor: 'pointer' }}>
          <defs>
            <linearGradient id="gIn2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="gOut2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 0" vertical={false} stroke="#F3F4F6" />
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
            interval={useDay && rows.length > 20 ? Math.floor(rows.length / 10) : 0}
            angle={useDay && rows.length > 15 ? -35 : 0}
            textAnchor={useDay && rows.length > 15 ? 'end' : 'middle'}
            height={useDay && rows.length > 15 ? 38 : 20} />
          <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<CustomMvtTooltip />} />
          <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Entrées" fill="url(#gIn2)"  radius={[4,4,0,0]} maxBarSize={barSize} />
          <Bar dataKey="Sorties" fill="url(#gOut2)" radius={[4,4,0,0]} maxBarSize={barSize} />
        </BarChart>
      </ResponsiveContainer>

      {/* Drill-down panel */}
      {drill && (
        <div style={{ marginTop: 14, border: '.5px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', background: '#F9FAFB', borderBottom: '.5px solid #E5E7EB' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>
              Produits — {drill.label}
            </div>
            <button onClick={() => setDrill(null)} style={{
              background: 'none', border: '.5px solid #E5E7EB', borderRadius: 6,
              padding: '2px 8px', cursor: 'pointer', fontSize: 11, color: '#6B7280',
            }}>✕ Fermer</button>
          </div>

          {drill.items.length === 0 ? (
            <div style={{ padding: 16, color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>
              Aucun détail disponible
            </div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '.5px solid #E5E7EB' }}>Produit</th>
                    <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '.5px solid #E5E7EB' }}>Type</th>
                    <th style={{ padding: '7px 12px', textAlign: 'right', fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '.5px solid #E5E7EB' }}>Qté</th>
                    <th style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '.5px solid #E5E7EB' }}>Client</th>
                  </tr>
                </thead>
                <tbody>
                  {drill.items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '.5px solid #F3F4F6' }}>
                      <td style={{ padding: '7px 12px', color: '#111', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={it.produit}>{it.produit}</td>
                      <td style={{ padding: '7px 12px' }}>
                        <span style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 8, fontWeight: 600,
                          background: it.type === 'entree' ? '#D1FAE5' : '#FEE2E2',
                          color:      it.type === 'entree' ? '#059669' : '#DC2626',
                        }}>{it.type === 'entree' ? '↑ Entrée' : '↓ Sortie'}</span>
                      </td>
                      <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700,
                        color: it.type === 'entree' ? '#059669' : '#DC2626' }}>
                        {it.type === 'entree' ? '+' : '-'}{it.qte}
                      </td>
                      <td style={{ padding: '7px 12px', color: '#6B7280', fontSize: 11 }}>
                        {it.client || '—'}
                        {it.remarque && <span style={{ marginLeft: 5, color: '#9CA3AF', fontStyle: 'italic' }}>· {it.remarque}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Grille catégories ──────────────────────────────────────────────────────
const alertColor = (pct) => pct > 80 ? '#EF4444' : pct > 50 ? '#F59E0B' : '#10B981';

export function CategoriesGrid({ data }) {
  return (
    <div className="cat-grid">
      {data.map((c) => {
        const pct = Math.round((c.alertes / c.total) * 100);
        const col = alertColor(pct);
        return (
          <div key={c.cat} className="cat-card" style={{ borderLeft: `2px solid ${col}` }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{c.cat}</div>
            <div style={{ fontSize: 22, fontWeight: 500, margin: '4px 0 2px' }}>{c.total}</div>
            <div style={{ fontSize: 11, color: col }}>{c.alertes} alerte{c.alertes > 1 ? 's' : ''} · {pct}%</div>
            <ProgressBar value={pct} color={col} />
          </div>
        );
      })}
    </div>
  );
}

// ── Tableau stock avec drill-down ─────────────────────────────────────────
const statusBadge = (p) =>
  p.rupture ? <Badge variant="red">Rupture</Badge>
  : p.alerte ? <Badge variant="amber">Alerte</Badge>
  : <Badge variant="green">OK</Badge>;

const fmtDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

function ProductDetail({ p, onClose }) {
  const entrees = (p.mouvements ?? []).filter(m => m.type === 'entree');
  const sorties = (p.mouvements ?? []).filter(m => m.type === 'sortie');
  const stockColor = p.rupture ? '#DC2626' : p.alerte ? '#D97706' : '#059669';

  return (
    <tr>
      <td colSpan={8} style={{ padding: 0, background: '#FAFAFA', borderBottom: '.5px solid #E5E7EB' }}>
        <div style={{ padding: '16px 20px' }}>
          {/* Header produit */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4 }}>{p.produit}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 10, background: '#F3F4F6', padding: '2px 8px', borderRadius: 4, color: '#6B7280' }}>{p.categorie}</span>
                {statusBadge(p)}
                {p.prixHT > 0 && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{p.prixHT.toFixed(2)} € HT/u</span>}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: '.5px solid #E5E7EB', borderRadius: 6,
              padding: '3px 10px', cursor: 'pointer', fontSize: 11, color: '#6B7280',
            }}>✕ Fermer</button>
          </div>

          {/* KPIs stock */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { l: 'Stock initial', v: p.stockInitial, c: '#6B7280', bg: '#F9FAFB' },
              { l: 'Entrées totales', v: `+${p.entrees}`, c: '#059669', bg: '#F0FDF4' },
              { l: 'Sorties totales', v: `-${p.sorties}`, c: '#DC2626', bg: '#FFF1F2' },
              { l: 'Stock réel',     v: p.stockReel,     c: stockColor, bg: stockColor + '10' },
            ].map(({ l, v, c, bg }) => (
              <div key={l} style={{ padding: '10px 12px', borderRadius: 8, background: bg, border: `.5px solid ${c}20` }}>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Historique mouvements */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { title: 'Entrées', items: entrees, color: '#059669', bg: '#D1FAE5', sign: '+' },
              { title: 'Sorties', items: sorties, color: '#DC2626', bg: '#FEE2E2', sign: '-' },
            ].map(({ title, items, color, bg, sign }) => (
              <div key={title}>
                <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: bg, padding: '2px 8px', borderRadius: 6 }}>{title} ({items.length})</span>
                </div>
                {items.length === 0 ? (
                  <div style={{ color: '#9CA3AF', fontSize: 11, fontStyle: 'italic' }}>Aucun mouvement</div>
                ) : (
                  <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {items.map((it, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 10px', borderRadius: 6, background: 'white',
                        border: `.5px solid ${color}20`, fontSize: 11,
                      }}>
                        <div>
                          <span style={{ fontWeight: 600, color: '#374151' }}>{fmtDate(it.date)}</span>
                          {it.client && <span style={{ marginLeft: 8, color: '#9CA3AF' }}>{it.client}</span>}
                          {it.remarque && <span style={{ marginLeft: 6, color: '#C4B5FD', fontStyle: 'italic' }}>· {it.remarque}</span>}
                        </div>
                        <span style={{ fontWeight: 700, color, marginLeft: 12 }}>{sign}{it.qte}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
}

export function StockTable({ data }) {
  const [expanded, setExpanded] = useState(null);
  const toggle = (id) => setExpanded(p => p === id ? null : id);

  return (
    <div className="tbl-scroll">
      <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 6, textAlign: 'right' }}>
        Cliquez sur une ligne pour afficher l'historique des mouvements
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Produit</th><th>Catégorie</th>
            <th style={{ textAlign: 'right' }}>Stk init.</th>
            <th style={{ textAlign: 'right' }}>Entrées</th>
            <th style={{ textAlign: 'right' }}>Sorties</th>
            <th style={{ textAlign: 'right' }}>Stock réel</th>
            <th style={{ textAlign: 'right' }}>Seuil</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 30).map((p, i) => {
            const uid    = p.id || i;
            const isOpen = expanded === uid;
            return [
              <tr key={uid} onClick={() => toggle(uid)}
                style={{ cursor: 'pointer', background: isOpen ? '#FFFBEB' : undefined }}>
                <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  <span style={{ marginRight: 6, color: '#D1D5DB', fontSize: 10 }}>{isOpen ? '▲' : '▼'}</span>
                  {p.produit}
                </td>
                <td><span style={{ fontSize: 10, background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, color: '#6B7280' }}>{p.categorie}</span></td>
                <td style={{ textAlign: 'right', color: '#6B7280' }}>{p.stockInitial}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: '#059669' }}>+{p.entrees}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: '#DC2626' }}>-{p.sorties}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{p.stockReel}</td>
                <td style={{ textAlign: 'right', color: '#9CA3AF' }}>{p.niveauReapro}</td>
                <td>{statusBadge(p)}</td>
              </tr>,
              isOpen && <ProductDetail key={`${uid}-detail`} p={p} onClose={() => setExpanded(null)} />,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
