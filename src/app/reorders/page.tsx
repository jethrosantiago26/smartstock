'use client'

import { useState } from 'react';
import { Sparkles, ShoppingCart, Loader2, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { acceptReorders } from '@/app/actions';

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
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const loadSuggestions = async () => {
    setLoading(true);
    setError('');
    fetch('/api/reorders')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setSuggestions(data);
        setHasLoaded(true);
      })
      .catch(err => {
        setSuggestions([]);
        setHasLoaded(true);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  const totalCost = suggestions.reduce((sum, s) => sum + s.estimatedCost, 0);

  const handleConfirmOrders = async () => {
    setIsProcessing(true);
    const res = await acceptReorders(suggestions.map(s => ({ itemId: s.itemId, suggestedQuantity: s.suggestedQuantity })));
    setIsProcessing(false);
    if (res.success) {
      setIsSuccess(true);
      setShowConfirm(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 flex items-center">
            Reorder Suggestions <Sparkles className="w-6 h-6 ml-3 text-indigo-500" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Generate replenishment suggestions on demand to avoid unnecessary background AI usage.</p>
        </div>
        <button
          onClick={loadSuggestions}
          disabled={loading}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-500/30 transition-all duration-200"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {hasLoaded ? 'Refresh Suggestions' : 'Generate Suggestions'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-indigo-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Generating reorder suggestions...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-red-500 h-[400px]">
            <AlertCircle className="w-12 h-12 mb-4 text-red-400" />
            <p className="font-semibold text-lg">Failed to fetch suggestions</p>
            <p className="text-sm opacity-80 mt-2 max-w-md">{error.includes('503') || error.toLowerCase().includes('demand') ? "The reorder service is temporarily unavailable. Please wait a moment and try again." : error}</p>
            <p className="text-xs opacity-60 mt-4">(Suggestions are now generated locally, so this usually indicates a database or network issue.)</p>
            <button 
              onClick={loadSuggestions} 
              className="mt-6 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium text-sm"
            >
              Try Again
            </button>
          </div>
        ) : !hasLoaded ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-500 dark:text-slate-400 px-6 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-lg font-medium text-slate-900 dark:text-slate-200">No Suggestions Generated Yet</p>
            <p className="text-sm mt-1 max-w-md">Click Generate Suggestions to compute reorder quantities when you are ready.</p>
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
              <button onClick={() => setShowConfirm(true)} className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md transition-colors shadow-indigo-500/20">
                Accept & Process Orders <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">Process Suggestions?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                This will add the suggested stock into your system for <strong>{suggestions.length} items</strong>.
                Total Estimated Value: <strong>${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  disabled={isProcessing}
                  onClick={() => setShowConfirm(false)} 
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={isProcessing}
                  onClick={handleConfirmOrders}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Restock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-2">Orders Processed!</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Inventory levels have been successfully updated based on the suggested reorder quantities.
              </p>
              
              <Link href="/inventory" className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors text-center">
                View Inventory
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
