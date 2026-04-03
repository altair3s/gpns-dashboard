// src/components/heures/index.jsx
import { useState } from 'react';
import {
  ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine,
  PieChart, Pie, Cell,
} from 'recharts';
import { ProgressBar } from '../ui/index.jsx';

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  amber:   '#F59E0B',
  indigo:  '#4F46E5',
  violet:  '#7C3AED',
  night:   '#1E3A8A',
  green:   '#059669',
  orange:  '#D97706',
  red:     '#DC2626',
  gray:    '#9CA3AF',
};

const fmt = (d) => d?.slice(5) ?? '';

// ══════════════════════════════════════════════════════════════════════════════
// 1. GAUGE — Demi-cercle 180°  (target + paliers +20% / +30%)
// ══════════════════════════════════════════════════════════════════════════════
// Géométrie : centre (130, 128), rayon 108
//   180° → point gauche  (22, 128)
//   270° → sommet        (130, 20)   ← point le plus haut (y = cy - r)
//   360° → point droit   (238, 128)
const G_CX = 130, G_CY = 128, G_R = 108;

const gRad   = (d) => (d * Math.PI) / 180;
const gPolar = (deg, r = G_R) => ({
  x: G_CX + r * Math.cos(gRad(deg)),
  y: G_CY + r * Math.sin(gRad(deg)),
});
// arc SVG de d1° à d2° (180→360 = demi-cercle par le haut, sweep=1 = sens horaire)
const gArc = (d1, d2, r = G_R) => {
  if (Math.abs(d2 - d1) < 0.01) return '';
  const p1 = gPolar(d1, r), p2 = gPolar(d2, r);
  const large = Math.abs(d2 - d1) > 180 ? 1 : 0;
  return `M${p1.x.toFixed(2)},${p1.y.toFixed(2)} A${r},${r} 0 ${large} 1 ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
};
// valeur → angle entre 180° (vide) et 360° (max affiché = target × 1.35)
const gValToDeg = (v, maxV) => 180 + (180 * Math.min(v, maxV)) / maxV;

export function HoursGauge({ value, target, label }) {
  const warn  = target * 1.2;   // +20%
  const crit  = target * 1.3;   // +30%
  const maxV  = target * 1.4;   // borne visuelle

  const v      = Math.max(0, value ?? 0);
  const color  = v <= target ? C.green : v <= warn ? C.orange : C.red;
  const pct    = Math.round((v / target) * 100);

  const valDeg  = gValToDeg(v,      maxV);
  const targDeg = gValToDeg(target, maxV);
  const warnDeg = gValToDeg(warn,   maxV);
  const critDeg = gValToDeg(crit,   maxV);
  const END     = 360;

  const tip   = gPolar(valDeg, G_R - 18);
  const base1 = gPolar(valDeg + 90, 10);
  const base2 = gPolar(valDeg - 90, 10);

  const keyTicks = [
    { v: target, label: `${(target / 1000).toFixed(0)}k`,  color: C.green  },
    { v: warn,   label: '+20%',                             color: C.orange },
    { v: crit,   label: '+30%',                             color: C.red    },
  ];

  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 260 168" width="100%" style={{ display: 'block', margin: '0 auto', maxWidth: 320 }}>
        {/* Rail */}
        <path d={gArc(180, END)} fill="none" stroke="#F3F4F6" strokeWidth={24} strokeLinecap="round" />

        {/* Zones de couleur */}
        <path d={gArc(180, targDeg)} fill="none" stroke="#D1FAE5" strokeWidth={24} strokeLinecap="round" />
        {targDeg < warnDeg && <path d={gArc(targDeg, warnDeg)} fill="none" stroke="#FEF3C7" strokeWidth={24} strokeLinecap="round" />}
        {warnDeg < critDeg && <path d={gArc(warnDeg, critDeg)} fill="none" stroke="#FED7AA" strokeWidth={24} strokeLinecap="round" />}
        {critDeg < END     && <path d={gArc(critDeg, END)}     fill="none" stroke="#FEE2E2" strokeWidth={24} strokeLinecap="round" />}

        {/* Arc valeur */}
        {v > 0 && <path d={gArc(180, valDeg)} fill="none" stroke={color} strokeWidth={18} strokeLinecap="round" />}

        {/* Ticks clés + labels */}
        {keyTicks.map((t) => {
          const dg    = gValToDeg(t.v, maxV);
          const outer = gPolar(dg, G_R + 15);
          const inner = gPolar(dg, G_R + 5);
          const txt   = gPolar(dg, G_R + 28);
          return (
            <g key={t.v}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={t.color} strokeWidth={2} />
              <text x={txt.x} y={txt.y} textAnchor="middle" dominantBaseline="central"
                fontSize={10} fill={t.color} fontWeight="700">{t.label}</text>
            </g>
          );
        })}

        {/* Aiguille */}
        <polygon
          points={`${tip.x.toFixed(1)},${tip.y.toFixed(1)} ${base1.x.toFixed(1)},${base1.y.toFixed(1)} ${base2.x.toFixed(1)},${base2.y.toFixed(1)}`}
          fill={color} opacity={0.9}
        />
        <circle cx={G_CX} cy={G_CY} r={13} fill="white" stroke="#E5E7EB" strokeWidth={2} />
        <circle cx={G_CX} cy={G_CY} r={6}  fill={color} />

        {/* Labels 0 / max */}
        {(() => { const p = gPolar(180, G_R + 20); return <text x={p.x - 2} y={p.y} textAnchor="end"   fontSize={8} fill="#9CA3AF">0</text>; })()}
        {(() => { const p = gPolar(360, G_R + 20); return <text x={p.x + 2} y={p.y} textAnchor="start" fontSize={8} fill="#9CA3AF">{(maxV / 1000).toFixed(1)}k</text>; })()}

        {/* Valeur + sous-titre */}
        <text x={G_CX} y={G_CY + 38} textAnchor="middle" fontSize={20} fontWeight="700" fill="#111827">
          {Math.round(v).toLocaleString('fr')}h
        </text>
      </svg>

      {/* Badge statut */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 14px', borderRadius: 16, marginTop: 14,
        background: color + '15', border: `1px solid ${color}35`,
        fontSize: 11, color, fontWeight: 500,
      }}>
        {v <= target ? '✓ Objectif respecté' : v <= warn ? '⚠ +20% dépassé' : '✗ +30% dépassé'} · {pct}%
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. SÉLECTEUR DE PÉRIODE
// ══════════════════════════════════════════════════════════════════════════════
export function DateRangePicker({ start, end, allDates, onStart, onEnd }) {
  const min = allDates[0] ?? '', max = allDates[allDates.length - 1] ?? '';
  const preset = (n) => {
    onEnd(max);
    onStart(allDates[Math.max(0, allDates.length - n)] ?? min);
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '10px 16px', background: '#FFFBEB',
      border: '.5px solid #FDE68A', borderRadius: 10, fontSize: 12,
    }}>
      <span style={{ color: '#92400E', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>
        Période
      </span>
      {[{ l: '7 j', n: 7 }, { l: '14 j', n: 14 }, { l: 'Tout', n: 9999 }].map(({ l, n }) => (
        <button key={l} onClick={() => preset(n)} style={{
          padding: '3px 10px', borderRadius: 6, border: '.5px solid #FCD34D',
          background: 'white', cursor: 'pointer', fontSize: 11, color: '#92400E',
          fontWeight: 500,
        }}>{l}</button>
      ))}
      <span style={{ color: '#E5E7EB' }}>|</span>
      {[['Du', start, min, end ?? max, onStart], ['au', end, start ?? min, max, onEnd]].map(([lbl, val, mn, mx, fn]) => (
        <label key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6B7280' }}>
          {lbl}
          <input type="date" value={val ?? ''} min={mn} max={mx} onChange={e => fn(e.target.value)}
            style={{ border: '.5px solid #D1D5DB', borderRadius: 6, padding: '3px 8px', fontSize: 12, color: '#374151' }} />
        </label>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. VOLUME HEURES CHART (remplace présences quotidiennes)
// ══════════════════════════════════════════════════════════════════════════════
const CustomTooltipVolume = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '.5px solid #E5E7EB', borderRadius: 10, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: '#111' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.color }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{Math.round(p.value)}h</span>
        </div>
      ))}
    </div>
  );
};

export function VolumeHeuresChart({ data }) {
  const chartData = data.map(d => ({
    date:     fmt(d.date),
    'CDI':    Math.round((d.heures - d.heuresInterim) * 10) / 10,
    'Intérim': Math.round(d.heuresInterim * 10) / 10,
    'Nuit':   Math.round(d.heuresNuit * 10) / 10,
  }));
  return (
    <ResponsiveContainer width="100%" height={215}>
      <ComposedChart data={chartData} barSize={14}>
        <defs>
          <linearGradient id="gCDI" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.amber} stopOpacity={1} />
            <stop offset="100%" stopColor={C.amber} stopOpacity={0.6} />
          </linearGradient>
          <linearGradient id="gInterim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.violet} stopOpacity={1} />
            <stop offset="100%" stopColor={C.violet} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 0" vertical={false} stroke="#F3F4F6" />
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
        <Tooltip content={<CustomTooltipVolume />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
        <ReferenceLine y={450} stroke={C.red} strokeDasharray="4 3" strokeWidth={1.5}
          label={{ value: '450h max', position: 'insideTopRight', fontSize: 9, fill: C.red }} />
        <Bar dataKey="CDI" stackId="a" fill="url(#gCDI)" />
        <Bar dataKey="Intérim" stackId="a" fill="url(#gInterim)" radius={[4, 4, 0, 0]} />
        <Line type="monotone" dataKey="Nuit" stroke={C.night} strokeWidth={2}
          dot={{ r: 2.5, fill: 'white', stroke: C.night, strokeWidth: 1.5 }}
          activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. BREAKDOWN CDI / INTÉRIM / NUIT — redesign
// ══════════════════════════════════════════════════════════════════════════════
export function HoursBreakdown({ totalHeures, heuresCDI, heuresInterim, heuresNuit }) {
  const pct = (h) => totalHeures ? Math.round((h / totalHeures) * 100) : 0;
  const items = [
    { label: 'CDI / Permanent', h: heuresCDI,    p: pct(heuresCDI),    color: C.indigo, bg: '#EEF2FF' },
    { label: 'Intérimaire',     h: heuresInterim, p: pct(heuresInterim),color: C.violet, bg: '#F5F3FF' },
    { label: 'Heures de nuit',  h: heuresNuit,    p: pct(heuresNuit),   color: C.night,  bg: '#EFF6FF' },
  ];
  return (
    <div>
      {items.map(it => (
        <div key={it.label} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: it.color }} />
              <span style={{ fontSize: 12, color: '#374151' }}>{it.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{Math.round(it.h).toLocaleString('fr')}h</span>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: it.bg, color: it.color, fontWeight: 600 }}>{it.p}%</span>
            </div>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: '#F3F4F6', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${it.p}%`, background: it.color, borderRadius: 4, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
          </div>
        </div>
      ))}
      {/* Donut CDI/Intérim */}
      <div style={{ marginTop: 8 }}>
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie
              data={[
                { name: 'CDI',    value: Math.round(heuresCDI) },
                { name: 'Intérim',value: Math.round(heuresInterim) },
                { name: 'Nuit',   value: Math.round(heuresNuit) },
              ]}
              cx="50%" cy="50%" innerRadius={30} outerRadius={48}
              paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}
            >
              {[C.indigo, C.violet, C.night].map((c, i) => <Cell key={i} fill={c} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '.5px solid #E5E7EB' }}
              formatter={v => [`${v}h`]} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. BREAKDOWN PAR SITE
// ══════════════════════════════════════════════════════════════════════════════
export function SiteBreakdown({ data }) {
  if (!data?.length) return null;
  const totalH = data.reduce((s, d) => s + d.heures, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map(s => {
        const pctI = s.heures ? Math.round((s.heuresInterim / s.heures) * 100) : 0;
        const pctC = 100 - pctI;
        const barW  = totalH ? (s.heures / totalH) * 100 : 0;
        return (
          <div key={s.site} style={{
            border: '.5px solid #E5E7EB', borderRadius: 10, padding: '12px 14px',
            background: 'white',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{s.site}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                  {s.nbCDI + s.nbInterim} agents · {s.nbCDI} CDI · {s.nbInterim} intérimaires
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#111', lineHeight: 1 }}>
                  {Math.round(s.heures).toLocaleString('fr')}h
                </div>
                <div style={{ fontSize: 10, color: '#9CA3AF' }}>{Math.round(barW)}% du total</div>
              </div>
            </div>
            {/* Barre CDI / Intérim */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6B7280', marginBottom: 4 }}>
                <span>CDI {pctC}% — {Math.round(s.heuresCDI).toLocaleString('fr')}h</span>
                <span>Intérim {pctI}% — {Math.round(s.heuresInterim).toLocaleString('fr')}h</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                <div style={{ flex: pctC, background: C.indigo, transition: 'flex .4s' }} />
                <div style={{ flex: pctI, background: C.violet, transition: 'flex .4s' }} />
              </div>
            </div>
            {/* Mini barre volume relatif */}
            <div style={{ height: 3, borderRadius: 2, background: '#F3F4F6', marginTop: 8 }}>
              <div style={{ height: '100%', width: `${barW}%`, background: C.amber, borderRadius: 2 }} />
            </div>

            {/* Détail par agence intérim */}
            {s.agencies?.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '.5px solid #F3F4F6' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                  Agences intérim
                </div>
                {s.agencies.map(a => (
                  <div key={a.agence} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5, fontSize: 11 }}>
                    <div>
                      <span style={{ fontWeight: 600, color: C.violet }}>{a.agence}</span>
                      {a.departements.length > 0 && (
                        <span style={{ color: '#9CA3AF', marginLeft: 6 }}>
                          → {a.departements.join(', ')}
                        </span>
                      )}
                    </div>
                    <div style={{ whiteSpace: 'nowrap', color: '#374151', marginLeft: 12 }}>
                      {Math.round(a.heures)}h · {a.nbAgents} ag.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 6. MOTIFS CHART (donut redesign)
// ══════════════════════════════════════════════════════════════════════════════
const MOTIF_COLORS = [C.red, '#3B82F6', '#8B5CF6', C.orange, C.gray, C.amber, C.green];

const CustomMotifTooltip = ({ active, payload }) => {
  if (!active || !payload?.[0]) return null;
  const { name, value } = payload[0];
  return (
    <div style={{ background: 'white', border: '.5px solid #E5E7EB', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 600 }}>{name}</div>
      <div style={{ color: '#6B7280' }}>{value} absence{value > 1 ? 's' : ''}</div>
    </div>
  );
};

export function MotifsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data.slice(0, 7).map(m => ({ name: m.label, value: m.count }))}
          dataKey="value" nameKey="name" cx="50%" cy="48%"
          innerRadius={48} outerRadius={72} paddingAngle={3}>
          {data.slice(0, 7).map((_, i) => (
            <Cell key={i} fill={MOTIF_COLORS[i % MOTIF_COLORS.length]} stroke="white" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<CustomMotifTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 7. HEURES LINE CHART redesign
// ══════════════════════════════════════════════════════════════════════════════
const CustomLineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div style={{ background: 'white', border: '.5px solid #E5E7EB', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, color: '#111', marginBottom: 3 }}>{label}</div>
      <div style={{ color: C.amber, fontWeight: 600 }}>{payload[0].value}h réalisées</div>
    </div>
  );
};

export function HeuresLineChart({ data }) {
  const avg = data.length ? data.reduce((s, d) => s + d.heures, 0) / data.length : 0;
  const chartData = data.map(d => ({ date: fmt(d.date), Heures: Math.round(d.heures * 10) / 10 }));
  return (
    <ResponsiveContainer width="100%" height={185}>
      <LineChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={C.amber} stopOpacity={0.15} />
            <stop offset="95%" stopColor={C.amber} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 0" vertical={false} stroke="#F3F4F6" />
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
        <ReferenceLine y={Math.round(avg)} stroke="#D1D5DB" strokeDasharray="4 3"
          label={{ value: `Moy. ${Math.round(avg)}h`, position: 'right', fontSize: 9, fill: '#9CA3AF' }} />
        <Tooltip content={<CustomLineTooltip />} />
        <Line type="monotone" dataKey="Heures" stroke={C.amber} strokeWidth={2.5}
          dot={{ r: 3.5, fill: 'white', stroke: C.amber, strokeWidth: 2 }}
          activeDot={{ r: 5, fill: C.amber }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. QUALIFICATION GRID — inchangée mais redesignée
// ══════════════════════════════════════════════════════════════════════════════
const qualColor = (pct) => pct >= 85 ? C.green : pct >= 60 ? C.orange : C.red;

export function QualificationGrid({ byQual, bySite }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Par qualification</div>
      {byQual.map(q => {
        const pct = Math.round((q.presents / q.total) * 100);
        const col = qualColor(pct);
        return (
          <div key={q.qualification} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ fontWeight: 500, color: '#374151' }}>{q.qualification}</span>
              <span style={{ color: col, fontWeight: 600 }}>{q.presents}/{q.total} · {pct}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 9. MOTIFS TABLE avec drill-down (clic → liste des agents concernés)
// ══════════════════════════════════════════════════════════════════════════════
const CODE_COLORS = { MAL: C.red, AT: C.orange, ABI: '#7F1D1D' };

export function MotifsTable({ data }) {
  const [expanded, setExpanded] = useState(null);
  const total      = data.reduce((s, m) => s + m.count, 0);
  const totalH     = data.reduce((s, m) => s + (m.heures ?? 0), 0);

  const toggle = (motif) => setExpanded(p => p === motif ? null : motif);

  return (
    <div>
      <table className="tbl" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Motif</th>
            <th>Occ.</th>
            <th>Heures</th>
            <th>CDI / Intérim</th>
            <th>% abs.</th>
            <th style={{ width: 100 }}>Répartition</th>
            <th style={{ width: 32 }}></th>
          </tr>
        </thead>
        <tbody>
          {data.map(m => {
            const pct    = total ? Math.round((m.count / total) * 100) : 0;
            const pctH   = totalH ? Math.round(((m.heures ?? 0) / totalH) * 100) : 0;
            const col    = CODE_COLORS[m.motif] ?? C.amber;
            const isExp  = expanded === m.motif;
            const nbI    = m.nbInterim ?? 0;
            const nbC    = m.nbCDI    ?? 0;
            const hasH   = (m.heures ?? 0) > 0;
            return [
              <tr key={m.motif} onClick={() => toggle(m.motif)}
                style={{ cursor: 'pointer', userSelect: 'none' }}>
                <td>
                  <code style={{ fontSize: 10, background: col + '18', padding: '2px 6px', borderRadius: 4, color: col, fontWeight: 600 }}>
                    {m.motif}
                  </code>
                </td>
                <td style={{ fontWeight: 500 }}>{m.label}</td>
                <td style={{ fontWeight: 700, color: col }}>{m.count}</td>
                <td style={{ fontWeight: 600, color: '#374151' }}>
                  {hasH ? `${Math.round(m.heures)}h` : <span style={{ color: '#D1D5DB' }}>—</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                    {nbC > 0 && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#EEF2FF', color: C.indigo, fontWeight: 600 }}>
                        {nbC} CDI
                      </span>
                    )}
                    {nbI > 0 && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#F5F3FF', color: C.violet, fontWeight: 600 }}>
                        {nbI} Intérim
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ color: '#6B7280' }}>{pct}%</td>
                <td>
                  <div style={{ height: 5, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, pctH || pct * 3)}%`, background: col, borderRadius: 3 }} />
                  </div>
                </td>
                <td style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>
                  {isExp ? '▲' : '▼'}
                </td>
              </tr>,

              isExp && (
                <tr key={`${m.motif}-detail`}>
                  <td colSpan={8} style={{ padding: 0, background: '#FAFAFA' }}>
                    <div style={{ padding: '10px 16px' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                        Salariés concernés — {m.label}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {m.agents
                          .sort((a, b) => a.nom.localeCompare(b.nom))
                          .map((ag, i) => {
                            const agCol = ag.isInterim ? C.violet : C.indigo;
                            return (
                              <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                background: 'white', border: `.5px solid ${agCol}30`,
                                borderRadius: 7, padding: '5px 10px', fontSize: 11,
                              }}>
                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: agCol + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: agCol, fontWeight: 700 }}>
                                  {ag.nom.slice(0, 1)}{ag.prenom.slice(0, 1)}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ fontWeight: 600, color: '#111', lineHeight: 1.2 }}>{ag.nom} {ag.prenom}</span>
                                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: agCol + '18', color: agCol, fontWeight: 600 }}>
                                      {ag.isInterim ? 'Intérim' : 'CDI'}
                                    </span>
                                  </div>
                                  <div style={{ color: '#9CA3AF', fontSize: 10 }}>{ag.site} · {ag.date?.slice(5)}</div>
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              ),
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
