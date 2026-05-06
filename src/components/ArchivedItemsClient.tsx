'use client'

import { useState, useEffect } from 'react';
import { PackageX, ArchiveRestore, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { restoreItem, permanentDeleteItem } from '@/app/actions';
import { supabase } from '@/lib/supabase';

interface ArchivedItem {
  id: string;
  name: string;
  sku: string;
  is_archived: boolean;
}

export default function ArchivedItemsClient() {
  const [items, setItems] = useState<ArchivedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchArchivedItems();
  }, []);

  const fetchArchivedItems = async () => {
    const { data } = await supabase.from('items').select('id, name, sku, is_archived').eq('is_archived', true).order('name');
    setItems(data || []);
    setLoading(false);
  };

  const handleRestore = async (id: string) => {
    setProcessingId(id);
    const res = await restoreItem(id);
    if (res.success) setItems(curr => curr.filter(i => i.id !== id));
    else alert(res.error);
    setProcessingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`WARNING: Are you sure you want to PERMANENTLY delete "${name}"? This action cannot be undone and will erase all transactional history for this item.`)) return;

    setProcessingId(id);
    const res = await permanentDeleteItem(id);
    if (res.success) setItems(curr => curr.filter(i => i.id !== id));
    else alert(res.error);
    setProcessingId(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link href="/inventory" className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">Archived Items</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review soft-deleted inventory. You can restore them or permanently delete them.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 dark:text-slate-400 h-[400px]">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <PackageX className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg font-medium text-slate-900 dark:text-slate-200">Archive is empty</p>
            <p className="text-sm mt-1">You have no archived items at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map(item => (
              <div key={item.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">{item.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">SKU: {item.sku}</p>
                </div>
                <div className="flex space-x-3">
                  <button 
                    disabled={processingId === item.id}
                    onClick={() => handleRestore(item.id)}
                    className="flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    <ArchiveRestore className="w-4 h-4 mr-2" /> Restore
                  </button>
                  <button 
                    disabled={processingId === item.id}
                    onClick={() => handleDelete(item.id, item.name)}
                    className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Permanently
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
