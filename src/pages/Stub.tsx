import React from 'react';
export default function StubPage({ name }: { name: string }) {
  return (
    <div className="p-4 flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">{name}</h1>
      <p className="text-slate-500">PHASE-2: Implementazione in corso...</p>
      <button onClick={() => window.history.back()} className="mt-4 text-blue-500 underline">Indietro</button>
    </div>
  );
}
