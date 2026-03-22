'use client'

import { useState, useTransition } from 'react';
import { Plus, Minus, Search, Edit2, PackagePlus, AlertCircle } from 'lucide-react';
import { adjustStock } from '@/app/actions';

interface Item {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  cost_per_unit: number;
}

export default function InventoryTable({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdjust = async (item: Item, change: number, type: 'in' | 'out') => {
    setLoadingId(item.id);
    setError(null);
    
    // Optimistic update
    const newStock = item.current_stock + change;
    setItems(current => current.map(i => i.id === item.id ? { ...i, current_stock: newStock } : i));

    startTransition(async () => {
      const res = await adjustStock(item.id, item.current_stock, change, type);
      if (!res.success) {
        // Revert on failure
        setItems(current => current.map(i => i.id === item.id ? { ...i, current_stock: item.current_stock } : i));
        setError(res.error || 'Failed to adjust stock');
      }
      setLoadingId(null);
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto underline">Dismiss</button>
        </div>
      )}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search SKUs or item names..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-950 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-sm outline-none transition-all dark:text-slate-200 placeholder-slate-400"
          />
        </div>
        <button className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-500/30 transition-all duration-200">
          <PackagePlus className="w-4 h-4 mr-2" />
          Add Item
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-950/50 text-xs uppercase font-medium text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">Item Details</th>
              <th className="px-6 py-4">Est. Cost</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Quick Adjust</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map(item => {
              const status = item.current_stock <= item.minimum_stock ? 'critical' 
                        : item.current_stock <= item.minimum_stock * 1.5 ? 'warning' 
                        : 'optimal';
              return (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs ring-1 ring-indigo-500/20">
                        {item.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <p className="font-medium">${item.cost_per_unit}</p>
                    <p className="text-xs text-slate-500">per {item.unit}</p>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-base font-bold text-slate-900 dark:text-white">{item.current_stock}</span>
                        <span className="text-xs text-slate-500">/ {item.minimum_stock} min</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold w-max ${
                        status === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                        status === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                        'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                      }`}>
                        {status === 'critical' ? 'Low Stock' : status === 'warning' ? 'Reorder Soon' : 'Optimal'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-center">
                    <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-950 rounded-lg ring-1 ring-slate-200 dark:ring-slate-800">
                      <button 
                        onClick={() => handleAdjust(item, -1, 'out')}
                        disabled={loadingId === item.id || item.current_stock <= 0}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded disabled:opacity-50 transition-all shadow-sm"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium text-slate-900 dark:text-white text-sm">
                        {loadingId === item.id ? '...' : '1'}
                      </span>
                      <button 
                        onClick={() => handleAdjust(item, 1, 'in')}
                        disabled={loadingId === item.id}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded disabled:opacity-50 transition-all shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            No items found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
