// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { Clock, Package, Shield, GraduationCap } from 'lucide-react';

const NAV = [
  { section: 'Ressources Humaines', items: [
    { to: '/heures',     icon: Clock,          label: 'Heures',      dot: true },
    { to: '/formations', icon: GraduationCap,  label: 'Formations' },
  ]},
  { section: 'Logistique', items: [
    { to: '/stock', icon: Package, label: 'Stock Produits' },
  ]},
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="s-brand">
        <div className="s-icon">
          <Shield size={15} color="#fff" />
        </div>
        <div>
          <div className="s-name">GPNS</div>
          <div className="s-sub">Dashboard · CDG</div>
        </div>
      </div>

      <nav className="s-nav">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="s-section">{group.section}</div>
            {group.items.map(({ to, icon: Icon, label, dot }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-btn${isActive ? ' act' : ''}`}
              >
                <Icon size={14} />
                {label}
                {dot && <span className="nav-dot" />}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="s-foot">Période · Mars 2026</div>
    </aside>
  );
}
