// src/pages/FormationsPage.jsx
import { useState, useMemo } from 'react';
import {
  Car, Shield, Wrench, UserCheck, Users, AlertTriangle, Zap,
  GraduationCap, AlertCircle, Award, Search, CheckCircle,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { KpiCard, Badge } from '../components/ui/index.jsx';

// ── Palette (cohérente avec le dashboard) ─────────────────────────────────────
const P = {
  red:    '#DC2626',
  green:  '#059669',
  blue:   '#3B82F6',
  purple: '#7C3AED',
  indigo: '#4F46E5',
  orange: '#D97706',
  yellow: '#F59E0B',
  gray:   '#9CA3AF',
};

const colorHex = (c) => P[c] ?? P.gray;

// ── Données formations ─────────────────────────────────────────────────────────
const FORMATIONS = [
  {
    id: 1, formation: 'PERMIS PIETON',         category: 'Sécurité',
    total: 36, formes: 32, validiteOK: 32, aProgrammer: 0, expires: 0,
    tauxCouverture: 88.9, tauxValidite: 100.0,
    priorite: 'Obligatoire', renouvellement: '5 ans', icon: Car, color: 'blue',
  },
  {
    id: 2, formation: '11.2.6.2',              category: 'Réglementation',
    total: 36, formes: 34, validiteOK: 34, aProgrammer: 0, expires: 0,
    tauxCouverture: 94.4, tauxValidite: 100.0,
    priorite: 'Obligatoire', renouvellement: '3 ans', icon: Shield, color: 'green',
  },
  {
    id: 3, formation: 'FH',                    category: 'Technique',
    total: 36, formes: 23, validiteOK: 23, aProgrammer: 0, expires: 0,
    tauxCouverture: 63.9, tauxValidite: 100.0,
    priorite: 'Recommandée', renouvellement: '2 ans', icon: Wrench, color: 'purple',
  },
  {
    id: 4, formation: 'GESTES ET POSTURES',    category: 'Prévention',
    total: 36, formes: 24, validiteOK: 24, aProgrammer: 0, expires: 0,
    tauxCouverture: 66.7, tauxValidite: 100.0,
    priorite: 'Obligatoire', renouvellement: '3 ans', icon: UserCheck, color: 'green',
  },
  {
    id: 5, formation: 'EPI',                   category: 'Sécurité',
    total: 36, formes: 36, validiteOK: 0,  aProgrammer: 36, expires: 0,
    tauxCouverture: 100.0, tauxValidite: 0.0,
    priorite: 'Urgente', renouvellement: '1 an', icon: Shield, color: 'red',
  },
  {
    id: 6, formation: 'MANAGEMENT DES EQUIPES',category: 'Management',
    total: 36, formes: 25, validiteOK: 25, aProgrammer: 0, expires: 0,
    tauxCouverture: 69.4, tauxValidite: 100.0,
    priorite: 'Recommandée', renouvellement: '2 ans', icon: Users, color: 'indigo',
  },
  {
    id: 7, formation: 'PDTS CHIMIQUES',        category: 'Sécurité',
    total: 36, formes: 15, validiteOK: 15, aProgrammer: 0, expires: 0,
    tauxCouverture: 41.7, tauxValidite: 100.0,
    priorite: 'Spécialisée', renouvellement: '3 ans', icon: AlertTriangle, color: 'orange',
  },
  {
    id: 8, formation: 'PERMIS PISTE',          category: 'Sécurité',
    total: 36, formes: 9,  validiteOK: 9,  aProgrammer: 0, expires: 0,
    tauxCouverture: 25.0, tauxValidite: 100.0,
    priorite: 'Spécialisée', renouvellement: '5 ans', icon: Zap, color: 'yellow',
  },
];

const SESSIONS_JUILLET = [
  { name: 'Sessions Vis ma Vie',    planned: 3, realized: 3 },
  { name: 'Formation Encadrants',   planned: 8, realized: 8 },
  { name: 'Formation PUDU',         planned: 4, realized: 4 },
  { name: 'Sécurité Aéroportuaire', planned: 2, realized: 2 },
  { name: 'Gestes et Postures',     planned: 1, realized: 1 },
];

// ── Styles badge priorité ─────────────────────────────────────────────────────
const PRIORITE_STYLE = {
  'Urgente':    { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  'Obligatoire':{ bg: '#F0FDF4', color: '#059669', border: '#BBF7D0' },
  'Recommandée':{ bg: '#EFF6FF', color: '#3B82F6', border: '#BFDBFE' },
  'Spécialisée':{ bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
};

const CATEGORY_STYLE = {
  'Sécurité':       { bg: '#FEF2F2', color: '#DC2626' },
  'Réglementation': { bg: '#F0FDF4', color: '#059669' },
  'Technique':      { bg: '#EFF6FF', color: '#3B82F6' },
  'Prévention':     { bg: '#FEFCE8', color: '#D97706' },
  'Management':     { bg: '#F5F3FF', color: '#7C3AED' },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FormationsPage() {
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');

  // KPIs globaux
  const stats = useMemo(() => {
    const totalFormes   = FORMATIONS.reduce((s, f) => s + f.formes, 0);
    const totalAProg    = FORMATIONS.reduce((s, f) => s + f.aProgrammer, 0);
    const urgentes      = FORMATIONS.filter(f => f.priorite === 'Urgente').length;
    const tauxMoyen     = (FORMATIONS.reduce((s, f) => s + f.tauxCouverture, 0) / FORMATIONS.length).toFixed(1);
    return { totalFormes, totalAProg, urgentes, tauxMoyen };
  }, []);

  // Données graphiques
  const pieData = FORMATIONS.map(f => ({
    name: f.formation.length > 14 ? f.formation.slice(0, 14) + '…' : f.formation,
    value: f.tauxCouverture,
    fill:  colorHex(f.color),
  }));

  const barData = FORMATIONS.map(f => ({
    name:      f.formation.length > 11 ? f.formation.slice(0, 11) + '…' : f.formation,
    Couverture: f.tauxCouverture,
    Validité:   f.tauxValidite,
  }));

  // Formations filtrées
  const filtered = FORMATIONS.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = f.formation.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
    const matchFilter =
      filter === 'all'         ? true :
      filter === 'urgent'      ? f.priorite === 'Urgente' :
      filter === 'obligatoire' ? f.priorite === 'Obligatoire' :
      filter === 'aprogrammer' ? f.aProgrammer > 0 : true;
    return matchSearch && matchFilter;
  });

  const urgentes = FORMATIONS.filter(f => f.priorite === 'Urgente' || f.aProgrammer > 0 || f.tauxCouverture < 50);

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="page-hd">
        <div>
          <div className="page-title">Ressources Humaines · Formations</div>
          <div className="page-sub">Suivi formations · GPNS TRI ADP · 36 collaborateurs</div>
        </div>
        <div className="hd-badges">
          {stats.urgentes > 0 && <Badge variant="amber">{stats.urgentes} urgente{stats.urgentes > 1 ? 's' : ''}</Badge>}
          <Badge variant="green">{FORMATIONS.length} formations</Badge>
        </div>
      </div>

      <div className="content">

        {/* ── Alerte EPI ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 20px', borderRadius: 10, marginBottom: 18,
          background: 'linear-gradient(135deg, #DC2626, #EF4444)',
          color: 'white',
        }}>
          <AlertCircle size={24} style={{ flexShrink: 0, animation: 'pulse 2s infinite' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Action requise — Formation EPI</div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
              36 collaborateurs ont leur formation EPI à programmer — Priorité absolue avant fin août.
            </div>
          </div>
        </div>

        {/* ── KPIs ───────────────────────────────────────────────────────── */}
        <div className="kpi-row">
          <KpiCard
            label="Sessions réalisées"
            value={stats.totalFormes}
            sub="Total toutes formations"
            accent="kb"
          />
          <KpiCard
            label="Taux couverture moyen"
            value={`${stats.tauxMoyen}%`}
            sub="Sur 36 collaborateurs"
            accent="kg"
          />
          <KpiCard
            label="À programmer"
            value={stats.totalAProg}
            sub="Formations en attente"
            accent="kr"
          />
          <KpiCard
            label="Formations urgentes"
            value={stats.urgentes}
            sub="Priorité absolue"
            accent="ka"
          />
        </div>

        {/* ── Graphiques ─────────────────────────────────────────────────── */}
        <div className="row row-eq" style={{ marginBottom: 14 }}>
          <div className="card">
            <div className="card-title">Taux de couverture par formation</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${value.toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [`${v}%`, 'Taux couverture']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-title">Couverture vs Validité (%)</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barSize={10}>
                <CartesianGrid strokeDasharray="3 0" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#9CA3AF' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={52} />
                <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 100]} width={28} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={v => [`${v}%`]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Couverture" fill={P.blue}   radius={[3, 3, 0, 0]} />
                <Bar dataKey="Validité"   fill={P.green}  radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Formations prioritaires ─────────────────────────────────────── */}
        {urgentes.length > 0 && (
          <div className="card" style={{ marginBottom: 14, borderLeft: `3px solid ${P.red}` }}>
            <div className="card-title" style={{ color: P.red }}>Formations prioritaires</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {urgentes.map(f => {
                const pri = PRIORITE_STYLE[f.priorite] ?? PRIORITE_STYLE['Recommandée'];
                const Icon = f.icon;
                return (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8,
                    background: '#FAFAFA', border: '.5px solid #F3F4F6',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ padding: 7, borderRadius: 7, background: colorHex(f.color) + '18' }}>
                        <Icon size={16} color={colorHex(f.color)} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12, color: '#111' }}>{f.formation}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{f.category}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {f.aProgrammer > 0 && (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', color: '#D97706', fontWeight: 600 }}>
                          {f.aProgrammer} à programmer
                        </span>
                      )}
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: `.5px solid ${pri.border}`, background: pri.bg, color: pri.color, fontWeight: 600 }}>
                        {f.priorite}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tableau suivi formations ────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">Tableau de suivi — GPNS TRI ADP</div>

          {/* Barre de recherche / filtre */}
          <div style={{
            display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap',
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Rechercher une formation…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                  border: '.5px solid #E5E7EB', borderRadius: 7,
                  fontSize: 12, color: '#374151', outline: 'none',
                }}
              />
            </div>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ padding: '6px 10px', border: '.5px solid #E5E7EB', borderRadius: 7, fontSize: 12, color: '#374151', background: 'white', cursor: 'pointer' }}
            >
              <option value="all">Toutes</option>
              <option value="urgent">Urgentes</option>
              <option value="obligatoire">Obligatoires</option>
              <option value="aprogrammer">À programmer</option>
            </select>
          </div>

          <table className="tbl" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Formation</th>
                <th>Catégorie</th>
                <th style={{ textAlign: 'center' }}>Formés</th>
                <th style={{ textAlign: 'center' }}>Validité OK</th>
                <th style={{ textAlign: 'center' }}>À programmer</th>
                <th style={{ textAlign: 'center' }}>Couverture</th>
                <th style={{ textAlign: 'center' }}>Priorité</th>
                <th style={{ textAlign: 'center' }}>Renouvellement</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => {
                const Icon = f.icon;
                const hex  = colorHex(f.color);
                const pri  = PRIORITE_STYLE[f.priorite] ?? PRIORITE_STYLE['Recommandée'];
                const cat  = CATEGORY_STYLE[f.category] ?? { bg: '#F9FAFB', color: '#6B7280' };
                const pct  = f.tauxCouverture;
                const barColor = pct >= 80 ? P.green : pct >= 60 ? P.yellow : P.red;
                return (
                  <tr key={f.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ padding: 6, borderRadius: 6, background: hex + '18', flexShrink: 0 }}>
                          <Icon size={14} color={hex} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12, color: '#111' }}>{f.formation}</div>
                          <div style={{ fontSize: 10, color: '#9CA3AF' }}>Sur {f.total} collaborateurs</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: cat.bg, color: cat.color, fontWeight: 600 }}>
                        {f.category}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#111' }}>{f.formes}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>formés</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: P.green }}>{f.validiteOK}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>valides</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: f.aProgrammer > 0 ? P.orange : '#D1D5DB' }}>
                        {f.aProgrammer}
                      </div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>en attente</div>
                    </td>
                    <td style={{ textAlign: 'center', minWidth: 100 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: barColor, marginBottom: 4 }}>{pct.toFixed(1)}%</div>
                      <div style={{ height: 5, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width .4s' }} />
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: `.5px solid ${pri.border}`, background: pri.bg, color: pri.color, fontWeight: 600 }}>
                        {f.priorite}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 11, color: '#6B7280' }}>{f.renouvellement}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9CA3AF', padding: '20px 0' }}>Aucune formation trouvée</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
