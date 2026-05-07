import { supabase } from '@/lib/supabase';
import { Package, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const { data: items } = await supabase.from('items').select('*').eq('is_archived', false);

  // Low Stock Items
  const lowStockItems = items?.filter(i => i.current_stock <= i.minimum_stock).sort((a, b) => a.current_stock - b.current_stock) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">Analytics & Alerts</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Track critical low stock items and stay ahead of shortages.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
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
