import { supabase } from '@/lib/supabase';
import { Package, AlertTriangle, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const { data: items } = await supabase.from('items').select('*');
  const { data: transactions } = await supabase
    .from('inventory_transactions')
    .select('*, items(name, unit)')
    .order('created_at', { ascending: false })
    .limit(10);

  const totalItems = items?.length || 0;
  const lowStockItems = items?.filter(i => i.current_stock <= i.minimum_stock) || [];
  const totalValue = items?.reduce((sum, item) => sum + (item.cost_per_unit * item.current_stock), 0) || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here's an overview of your restaurant inventory today.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/inventory" className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-500/30 transition-all duration-200">
            View All Inventory
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Items tracked</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalItems}</h3>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Low Stock Alerts</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{lowStockItems.length}</h3>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-50 dark:bg-green-500/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Est. Inventory Value</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Items List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              Low Stock Action Required
            </h3>
            <Link href="/inventory?filter=low_stock" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {lowStockItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p>All items are sufficiently stocked.</p>
              </div>
            ) : (
              lowStockItems.slice(0, 5).map(item => (
                <div key={item.id} className="p-4 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-medium border border-slate-200 dark:border-slate-700">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">SKU: {item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">{item.current_stock} <span className="text-xs font-normal text-red-500 bg-red-100 dark:bg-red-500/10 px-1.5 py-0.5 rounded ml-1">Left</span></p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Min: {item.minimum_stock} {item.unit}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
              <Clock className="w-5 h-5 text-indigo-500 mr-2" />
              Recent Activity
            </h3>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {!transactions || transactions.length === 0 ? (
              <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
                <p>No transactions yet.</p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 text-slate-500 group-[.is-active]:bg-indigo-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {tx.type}
                        </span>
                        <time className="text-[10px] text-slate-400">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </time>
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {tx.type === 'in' ? '+' : '-'}{tx.quantity} {tx.items?.name} 
                      </p>
                      {tx.notes && <p className="text-xs text-slate-500 mt-1 truncate">{tx.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
