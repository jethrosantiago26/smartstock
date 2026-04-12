import { supabase } from '@/lib/supabase';
import { Package, AlertTriangle, TrendingDown, Clock, ArrowRight, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const { data: items } = await supabase.from('items').select('*').eq('is_archived', false);
  const { data: wasteTransactions } = await supabase
    .from('inventory_transactions')
    .select('*, items(name, cost_per_unit)')
    .eq('type', 'waste')
    .order('created_at', { ascending: false });

  // Low Stock Items
  const lowStockItems = items?.filter(i => i.current_stock <= i.minimum_stock).sort((a, b) => a.current_stock - b.current_stock) || [];

  // Waste Calculations
  const totalWasteValue = wasteTransactions?.reduce((sum, tx) => {
    // @ts-ignore - Supabase type join casting sometimes struggles
    const cost = tx.items?.cost_per_unit || 0;
    return sum + (cost * tx.quantity);
  }, 0) || 0;

  // Aggregate waste by item to find top offenders
  const wasteMap: Record<string, { name: string, quantity: number, value: number }> = {};
  wasteTransactions?.forEach(tx => {
    if (!wasteMap[tx.item_id]) {
      // @ts-ignore
      wasteMap[tx.item_id] = { name: tx.items?.name || 'Unknown', quantity: 0, value: 0 };
    }
    // @ts-ignore
    const cost = tx.items?.cost_per_unit || 0;
    wasteMap[tx.item_id].quantity += tx.quantity;
    wasteMap[tx.item_id].value += (tx.quantity * cost);
  });

  const topWastedItems = Object.values(wasteMap).sort((a, b) => b.value - a.value).slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">Analytics & Alerts</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Track waste costs and manage critical low stock items.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Waste Tracking Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-red-50 dark:bg-red-500/10">
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 flex items-center">
                <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
                Lifetime Waste Analytics
              </h3>
              <p className="text-sm font-medium text-red-600 dark:text-red-400 mt-1">Total Estimated Loss</p>
              <h2 className="text-4xl font-bold text-red-700 dark:text-red-400 mt-1">
                ${totalWasteValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-4 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-2xl hidden sm:block">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
          <div className="p-6">
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Top Wasted Items (Cost Impact)</h4>
            <div className="space-y-4">
              {topWastedItems.length === 0 ? (
                <div className="text-center py-6 text-slate-500">No waste recorded yet!</div>
              ) : (
                topWastedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center w-full">
                    <div className="flex items-center">
                      <span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold mr-3">{idx + 1}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 dark:text-red-400">${item.value.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">{item.quantity} wasted</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-orange-50 dark:bg-orange-500/10">
            <div>
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 flex items-center">
                <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                Critical Low Stock
              </h3>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mt-1">Items below minimum stock</p>
              <h2 className="text-4xl font-bold text-orange-700 dark:text-orange-400 mt-1">
                {lowStockItems.length}
              </h2>
            </div>
            <div className="p-4 bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-2xl hidden sm:block">
              <Package className="w-8 h-8" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500">All items are sufficiently stocked!</div>
              ) : (
                lowStockItems.map(item => {
                  const deficit = item.minimum_stock - item.current_stock;
                  return (
                    <div key={item.id} className="p-4 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
                          {item.current_stock === 0 && <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>}
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">Currently have <strong>{item.current_stock}</strong> (Min: {item.minimum_stock})</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/20 px-2 py-1 rounded">
                          Deficit: {deficit} {item.unit}
                        </span>
                        <Link href={`/reorders`} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
