'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, CheckCircle2 } from 'lucide-react';
import { logMenuSale } from '@/app/actions';
import { Database } from '@/types/supabase';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export default function POSPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSale, setActiveSale] = useState<string | null>(null);
  const [receiptLog, setReceiptLog] = useState<{ id: string, name: string, time: Date }[]>([]);

  useEffect(() => {
    async function fetchMenu() {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');
      if (data) setMenuItems(data);
      setLoading(false);
    }
    fetchMenu();
  }, []);

  const handleSale = async (item: MenuItem) => {
    // Optimistic UI interaction
    setActiveSale(item.id);
    setReceiptLog(prev => [{ id: item.id, name: item.name, time: new Date() }, ...prev]);
    
    // Process backend deduction
    await logMenuSale(item.id);
    
    setTimeout(() => {
      setActiveSale(null);
    }, 600); // 600ms visual confirmation delay
  };

  if (loading) return <div className="text-white p-8 text-center animate-pulse w-full">Loading POS Engine...</div>;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      
      {/* Sales Grid */}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center">
            <ShoppingCart className="mr-3 text-indigo-400 w-8 h-8" /> Virtual Terminal
          </h1>
          <p className="text-slate-400 mt-2">Tap an item to simulate a real-world sale. Linked inventory will be instantly deducted.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleSale(item)}
              disabled={activeSale === item.id}
              className={`relative h-32 rounded-2xl flex flex-col justify-center items-center p-4 transition-all duration-200 border-2 select-none group focus:outline-none focus:ring-4 focus:ring-indigo-500/50 ${
                activeSale === item.id 
                  ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-95'
                  : 'bg-slate-900 border-slate-800 hover:border-indigo-500 hover:bg-slate-800 shadow-xl'
              }`}
            >
              {activeSale === item.id ? (
                <div className="text-emerald-400 flex flex-col items-center animate-in zoom-in duration-200">
                  <CheckCircle2 className="w-8 h-8 mb-2" />
                  <span className="font-bold text-sm tracking-wide uppercase">Sold!</span>
                </div>
              ) : (
                <>
                  <h3 className="text-center font-bold text-slate-100 mb-2 leading-tight group-hover:text-indigo-200 transition-colors">{item.name}</h3>
                  <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-semibold tracking-wide">
                    ${item.price}
                  </div>
                </>
              )}
            </button>
          ))}
          {menuItems.length === 0 && (
            <div className="col-span-full border border-dashed border-slate-700 bg-slate-900/50 rounded-2xl p-12 text-center">
              <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Virtual Terminal Offline</p>
              <p className="text-slate-600 text-sm mt-1">Visit Menu Engineering to add dishes to your screen.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Receipt Ledger */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col h-[calc(100vh-10rem)] border border-slate-800 rounded-2xl bg-slate-900 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-slate-200 tracking-tight uppercase text-sm">Live Receipt Ledger</h3>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {receiptLog.map((log, i) => (
            <div key={`${log.id}-${i}`} className="flex justify-between items-start bg-slate-950 rounded-lg p-3 border border-slate-800/60 animate-in slide-in-from-top-2 duration-300 flex-shrink-0">
              <div>
                <p className="text-sm font-bold text-slate-200">1x {log.name}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">DCPT-{(Math.random()*10000).toFixed(0).padStart(4, '0')} • Auto-Deducted</p>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded">
                {log.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
          {receiptLog.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2">
              <p className="text-sm font-medium">Awaiting Sales...</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
