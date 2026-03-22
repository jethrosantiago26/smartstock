import { supabase } from '@/lib/supabase';
import InventoryTable from '@/components/InventoryTable';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const { data: items, error } = await supabase.from('items').select('*').order('name');
  
  if (error) {
    console.error(error);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">Inventory Management</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage all your restaurant items, track stock, and organize categories.</p>
      </div>

      <InventoryTable initialItems={items || []} />
    </div>
  );
}
