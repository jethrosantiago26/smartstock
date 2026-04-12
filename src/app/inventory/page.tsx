import { supabase } from '@/lib/supabase';
import InventoryTable from '@/components/InventoryTable';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const { data: items, error } = await supabase.from('items').select('*').eq('is_archived', false).order('name');
  
  if (error) {
    console.error(error);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">Inventory Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage all your restaurant items, track stock, and organize categories.</p>
        </div>
        <a href="/inventory/archive" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
          View Archived Items
        </a>
      </div>

      <InventoryTable initialItems={items || []} />
    </div>
  );
}
