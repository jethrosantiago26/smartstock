'use client'

import { useState, useEffect } from 'react';
import { Sparkles, ShoppingCart, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Suggestion = {
  itemId: string;
  itemName: string;
  sku: string;
  suggestedQuantity: number;
  reasoning: string;
  estimatedCost: number;
};

export default function ReordersPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/reorders')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setSuggestions(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalCost = suggestions.reduce((sum, s) => sum + s.estimatedCost, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 flex items-center">
            AI Reorder Suggestions <Sparkles className="w-6 h-6 ml-3 text-indigo-500" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Smart recommendations based on current inventory deficits and par levels.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-indigo-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Analyzing inventory levels...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p className="font-semibold">Failed to fetch suggestions</p>
            <p className="text-sm opacity-80 mt-2">{error}</p>
            <p className="text-xs opacity-60 mt-4">(Ensure GEMINI_API_KEY is configured in .env.local)</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-500 dark:text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-lg font-medium text-slate-900 dark:text-slate-200">No Reorders Needed</p>
            <p className="text-sm mt-1">All your inventory is sufficiently stocked!</p>
            <Link href="/inventory" className="mt-6 text-sm text-indigo-600 hover:text-indigo-700 font-medium">Return to Inventory</Link>
          </div>
        ) : (
          <div>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-semibold text-slate-900 dark:text-white">Suggested Purchase Order</h3>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-semibold">Est. Total</p>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {suggestions.map((item, idx) => (
                <div key={idx} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-100 dark:border-indigo-500/20">
                        {item.itemName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-lg">{item.itemName}</h4>
                        <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                      </div>
                    </div>
                    <div className="mt-3 pl-13">
                      <p className="text-sm text-slate-600 dark:text-slate-300 flex items-start">
                        <Sparkles className="w-4 h-4 text-indigo-500 mr-2 shrink-0 mt-0.5" />
                        <span>{item.reasoning}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right sm:border-l border-slate-200 dark:border-slate-800 sm:pl-6 shrink-0">
                    <p className="text-sm text-slate-500 mb-1">Suggest to Order</p>
                    <div className="flex items-baseline justify-end space-x-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{item.suggestedQuantity}</span>
                    </div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                      ${item.estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md cursor-not-allowed opacity-80" onClick={() => alert('Purchase orders creation coming soon!')}>
                Create Purchase Order <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
