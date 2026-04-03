// src/components/ui/KpiCard.jsx
export function KpiCard({ label, value, sub, accent = 'ka' }) {
  return (
    <div className={`kpi-card ${accent}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

// src/components/ui/Badge.jsx
export function Badge({ children, variant = 'gray' }) {
  return <span className={`bdg bdg-${variant}`}>{children}</span>;
}

// src/components/ui/ProgressBar.jsx
export function ProgressBar({ value, max = 100, color = '#F59E0B' }) {
  const pct = Math.min(100, max ? (value / max) * 100 : 0);
  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// src/components/ui/Loader.jsx
export function Loader({ message = 'Chargement…' }) {
  return (
    <div className="loader">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 11-6.219-8.56" />
      </svg>
      {message}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="error-box">
      <strong>Erreur de chargement</strong> — {message}
      {onRetry && (
        <button onClick={onRetry} style={{ marginLeft: 12, textDecoration: 'underline',
          background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
          Réessayer
        </button>
      )}
    </div>
  );
}

// ── ConfigError — affiché quand les variables .env sont absentes ──────────
export function ConfigError({ message }) {
  const lines = message.split('\n');
  return (
    <div style={{
      margin: 24, padding: 20,
      borderRadius: 10, background: '#FFF7ED',
      border: '1px solid #FED7AA', fontFamily: 'monospace', fontSize: 13,
    }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: '#9A3412', marginBottom: 12 }}>
        ⚙️ Configuration manquante
      </div>
      {lines.map((l, i) => (
        <div key={i} style={{ color: l.startsWith('→') ? '#7C2D12' : '#1a1a1a', marginBottom: 4 }}>
          {l}
        </div>
      ))}
      <div style={{ marginTop: 16, padding: '10px 14px', background: '#FEF3C7',
        borderRadius: 6, fontSize: 12, color: '#92400E' }}>
        <strong>Étapes rapides :</strong><br />
        1. <code>cp .env.example .env</code><br />
        2. Renseigner <code>VITE_GOOGLE_API_KEY</code>, <code>VITE_SHEET_HEURES_ID</code>, <code>VITE_SHEET_PRODUITS_ID</code><br />
        3. Si l'onglet ne s'appelle pas <code>global</code> : ajouter <code>VITE_SHEET_HEURES_TAB=NomRéel</code><br />
        4. <code>npm run dev</code> (Vite relit le .env au démarrage, pas à chaud)
      </div>
    </div>
  );
}
