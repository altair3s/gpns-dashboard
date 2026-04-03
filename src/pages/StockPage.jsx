// src/pages/StockPage.jsx
import { useStock }  from '../hooks/useStock.js';
import { KpiCard, Loader, ErrorBox, ConfigError, Badge } from '../components/ui/index.jsx';
import {
  GpnsTopChart, MouvementsPicker, MouvementsChart,
  CategoriesGrid, StockTable,
} from '../components/stock/index.jsx';
import { FILIALE } from '../api/sheetsConfig.js';

export default function StockPage() {
  const {
    data, loading, error, refetch,
    startDay, endDay, setStartDay, setEndDay,
    granularity, setGranularity,
    allMonths, allDays,
  } = useStock();

  if (loading) return <Loader message="Chargement du stock produits…" />;
  if (error) {
    const isConfig = error.includes('manquant') || error.includes('.env');
    return isConfig ? <ConfigError message={error} /> : <ErrorBox message={error} onRetry={refetch} />;
  }
  if (!data) return null;

  const {
    produits, totalRefs, totalAlertes, totalRuptures,
    byCategorie, topSortiesFiliale,
  } = data;

  const alertePct = Math.round((totalAlertes / totalRefs) * 100);

  return (
    <div>
      {/* Header */}
      <div className="page-hd">
        <div>
          <div className="page-title">Stock · Produits de nettoyage</div>
          <div className="page-sub">Inventaire consolidé · Entrées / Sorties · Filiale {FILIALE}</div>
        </div>
        <div className="hd-badges">
          <Badge variant="red">{totalAlertes} en alerte</Badge>
          <Badge variant="green">{totalRefs} références</Badge>
        </div>
      </div>

      <div className="content">
        {/* KPI */}
        <div className="kpi-row">
          <KpiCard label="Références total"   value={totalRefs}       sub={`${byCategorie.length} catégories`} accent="ka" />
          <KpiCard label="En alerte réapro."  value={totalAlertes}    sub={`${alertePct}% du catalogue`}       accent="kr" />
          <KpiCard label={`Sorties ${FILIALE}`}
            value={topSortiesFiliale.reduce((s,p) => s + p.qte, 0).toLocaleString('fr')}
            sub={`${topSortiesFiliale.length} produits distincts`} accent="kg" />
          <KpiCard label="Rupture de stock" value={totalRuptures}
            sub={`${Math.round(totalRuptures / totalRefs * 100)}% du catalogue`} accent="kb" />
        </div>

        {/* Top GPNS + Mouvements */}
        <div className="row row-2-1" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="card-title">Top produits · Sorties {FILIALE}</div>
            <GpnsTopChart data={topSortiesFiliale} />
          </div>

          <div className="card">
            <div className="card-title">Mouvements · Entrées / Sorties</div>
            <MouvementsPicker
              startDay={startDay} endDay={endDay}
              allMonths={allMonths} allDays={allDays}
              onStart={setStartDay} onEnd={setEndDay}
              granularity={granularity} setGranularity={setGranularity}
            />
            <MouvementsChart data={data} granularity={granularity} />
          </div>
        </div>

        {/* Catégories */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">Statut par catégorie</div>
          <CategoriesGrid data={byCategorie} />
        </div>

        {/* Table stock */}
        <div className="card">
          <div className="card-title">
            Top 30 références · Sorties globales
            <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#9CA3AF', fontSize: 10 }}>
              trié par volume de sorties
            </span>
          </div>
          <StockTable data={produits} />
        </div>
      </div>
    </div>
  );
}
