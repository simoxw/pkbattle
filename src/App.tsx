import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts e Caricamento
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 font-medium text-slate-600">Caricamento Arena...</p>
  </div>
);

// Route Lazy Loading
const Home = lazy(() => import('./pages/Home'));
const Box = lazy(() => import('./pages/Box'));
const BoxDetail = lazy(() => import('./pages/BoxDetail'));
const BoxImport = lazy(() => import('./pages/BoxImport'));
const Teams = lazy(() => import('./pages/Teams'));
const BattleHub = lazy(() => import('./pages/BattleHub'));
const BattlePlay = lazy(() => import('./pages/BattlePlay'));
const DailyCatch = lazy(() => import('./pages/DailyCatch'));
const Backpack = lazy(() => import('./pages/Backpack'));
const Shop = lazy(() => import('./pages/Shop'));
const Settings = lazy(() => import('./pages/Settings'));
const Pokedex = lazy(() => import('./pages/Pokedex'));
const Social = lazy(() => import('./pages/Social'));
const Trainers = lazy(() => import('./pages/Trainers'));

export default function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-red-200">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/box" element={<Box />} />
            <Route path="/box/:id" element={<BoxDetail />} />
            <Route path="/box/import" element={<BoxImport />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/battle" element={<BattleHub />} />
            <Route path="/battle/play" element={<BattlePlay />} />
            <Route path="/battle/trainers" element={<Trainers />} />
            <Route path="/daily" element={<DailyCatch />} />
            <Route path="/zaino" element={<Backpack />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/pokedex" element={<Pokedex />} />
            <Route path="/social" element={<Social />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

// PHASE-2: Da implementare le pagine e i componenti UI specifici.
