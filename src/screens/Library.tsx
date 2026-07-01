import React from 'react';
import { BottomNav } from '../components/BottomNav';

export const Library: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 px-6 pt-6 max-w-md mx-auto relative select-none">
      <h1 className="text-2xl font-black mb-4">Library</h1>
      <p className="text-slate-400 text-sm">Batch 2 Implementation coming soon.</p>
      <BottomNav />
    </div>
  );
};
export default Library;
