// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar         from './components/layout/Sidebar.jsx';
import HeuresPage      from './pages/HeuresPage.jsx';
import StockPage       from './pages/StockPage.jsx';
import FormationsPage  from './pages/FormationsPage.jsx';

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition:   true,  // supprime l'avertissement React Router v7
        v7_relativeSplatPath: true,
      }}
    >
      <div className="dash">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/"       element={<Navigate to="/heures" replace />} />
            <Route path="/heures"      element={<HeuresPage />} />
            <Route path="/stock"       element={<StockPage />} />
            <Route path="/formations"  element={<FormationsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
