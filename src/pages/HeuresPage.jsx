// src/pages/HeuresPage.jsx
import { useHeures } from '../hooks/useHeures.js';
import { KpiCard, Loader, ErrorBox, ConfigError, Badge } from '../components/ui/index.jsx';
import {
  HoursGauge, DateRangePicker, HoursBreakdown,
  VolumeHeuresChart, MotifsChart, HeuresLineChart,
  QualificationGrid, SiteBreakdown, MotifsTable,
} from '../components/heures/index.jsx';

export default function HeuresPage() {
  const {
    data, loading, error, refetch,
    startDate, endDate, setStartDate, setEndDate, allDates,
  } = useHeures();

  if (loading) return <Loader message="Chargement des données d'émargement…" />;
  if (error) {
    const isConfig = error.includes('manquant') || error.includes('.env');
    return isConfig ? <ConfigError message={error} /> : <ErrorBox message={error} onRetry={refetch} />;
  }
  if (!data) return null;

  const {
    totalHeures, totalAgents, tauxPresence, totalAbsences,
    heuresCDI, heuresInterim, heuresNuit, heuresTRI, heuresLOCAUX,
    byDay, byMotif, byQual, bySite, anomalies,
  } = data;

  const totalJournees = byDay.reduce((s, d) => s + d.presents + d.absents, 0);
  const totalPresents = byDay.reduce((s, d) => s + d.presents, 0);
  const avgH = totalAgents
    ? `${Math.floor(totalHeures / totalAgents)}h${String(Math.round((totalHeures / totalAgents % 1) * 60)).padStart(2, '0')}`
    : '—';
  const period = byDay.length
    ? `${byDay[0].date.slice(8)} – ${byDay[byDay.length - 1].date.slice(8)} mars 2026`
    : 'Période sélectionnée';

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="page-hd">
        <div>
          <div className="page-title">Ressources Humaines · Heures</div>
          <div className="page-sub">Émargement · {period} · TRI_ADP &amp; LOCAUX</div>
        </div>
        <div className="hd-badges">
          {anomalies > 0 && <Badge variant="amber">{anomalies} anomalie{anomalies > 1 ? 's' : ''}</Badge>}
          <Badge variant="green">{totalAgents} agents</Badge>
          {heuresInterim > 0 && <Badge variant="gray">{Math.round(heuresInterim)}h intérim</Badge>}
        </div>
      </div>

      <div className="content">
        {/* ── Sélecteur de période ────────────────────────────────────── */}
        <div style={{ marginBottom: 18 }}>
          <DateRangePicker
            start={startDate} end={endDate} allDates={allDates}
            onStart={setStartDate} onEnd={setEndDate}
          />
        </div>

        {/* ── KPI row ─────────────────────────────────────────────────── */}
        <div className="kpi-row">
          <KpiCard label="Heures travaillées"
            value={`${Math.round(totalHeures).toLocaleString('fr')}h`}
            sub={period} accent="ka" />
          <KpiCard label="Taux de présence"
            value={`${Math.round(tauxPresence * 100)}%`}
            sub={`${totalPresents} / ${totalJournees} journées`}
            accent="kg" />
          <KpiCard label="Absences"
            value={totalAbsences}
            sub={byMotif.slice(0, 3).map(m => m.motif).join(' · ')}
            accent="kr" />
          <KpiCard label="Moy. / agent"
            value={avgH}
            sub={`CDI ${Math.round(heuresCDI)}h · Intérim ${Math.round(heuresInterim)}h`}
            accent="kb" />
        </div>

        {/* ── Jauges TRI / LOCAUX + Breakdown CDI/Intérim/Nuit ──────── */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-title">TRI · Objectif 6 000h</div>
            <HoursGauge value={heuresTRI} target={6000} label="TRI" />
          </div>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-title">Locaux · Objectif 4 000h</div>
            <HoursGauge value={heuresLOCAUX} target={4000} label="LOCAUX" />
          </div>
          <div className="card" style={{ flex: 1 }}>
            <div className="card-title">Répartition CDI · Intérim · Nuit</div>
            <HoursBreakdown
              totalHeures={totalHeures}
              heuresCDI={heuresCDI}
              heuresInterim={heuresInterim}
              heuresNuit={heuresNuit}
            />
          </div>
        </div>

        {/* ── Volume heures / jour + Motifs ───────────────────────────── */}
        <div className="row row-2-1">
          <div className="card">
            <div className="card-title">Volume heures par jour</div>
            <VolumeHeuresChart data={byDay} />
          </div>
          <div className="card">
            <div className="card-title">Motifs d'absence</div>
            <MotifsChart data={byMotif} />
          </div>
        </div>

        {/* ── Heures line + Qualification ─────────────────────────────── */}
        <div className="row row-eq">
          <div className="card">
            <div className="card-title">Heures réalisées · Tendance</div>
            <HeuresLineChart data={byDay} />
          </div>
          <div className="card">
            <div className="card-title">Répartition par qualification</div>
            <QualificationGrid byQual={byQual} bySite={[]} />
          </div>
        </div>

        {/* ── Détail par site ─────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">Heures &amp; effectifs par site · CDI vs Intérim</div>
          <SiteBreakdown data={bySite} />
        </div>

        {/* ── Absences avec drill-down ─────────────────────────────────── */}
        <div className="card">
          <div className="card-title">
            Détail des absences
            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 400, color: '#9CA3AF', textTransform: 'none', letterSpacing: 0 }}>
              cliquer sur une ligne pour voir les salariés concernés
            </span>
          </div>
          <MotifsTable data={byMotif} />
        </div>
      </div>
    </div>
  );
}
