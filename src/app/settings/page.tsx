import { Save, Sliders, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function getSettings() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('low_stock_multiplier, default_unit_type, ai_enabled, ai_daily_token_limit, ai_overage_behavior')
    .eq('id', 1)
    .single();

  if (error || !data) {
    return {
      low_stock_multiplier: 1.5,
      default_unit_type: 'pcs',
      ai_enabled: true,
      ai_daily_token_limit: 50000,
      ai_overage_behavior: 'block',
    };
  }

  return data;
}

async function updateInventoryDefaults(formData: FormData) {
  'use server';

  const lowStockMultiplierRaw = formData.get('low_stock_multiplier');
  const defaultUnitTypeRaw = formData.get('default_unit_type');

  const low_stock_multiplier = Number(lowStockMultiplierRaw);
  const default_unit_type = typeof defaultUnitTypeRaw === 'string' ? defaultUnitTypeRaw.trim() : '';

  if (!Number.isFinite(low_stock_multiplier) || low_stock_multiplier < 1) {
    throw new Error('Low-stock multiplier must be at least 1.');
  }

  if (!default_unit_type) {
    throw new Error('Default unit type is required.');
  }

  const { error } = await supabase
    .from('app_settings')
    .update({
      low_stock_multiplier,
      default_unit_type,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/settings');
}

async function updateAiSettings(formData: FormData) {
  'use server';

  const aiEnabledRaw = formData.get('ai_enabled');
  const aiDailyLimitRaw = formData.get('ai_daily_token_limit');
  const aiOverageBehaviorRaw = formData.get('ai_overage_behavior');

  const ai_enabled = aiEnabledRaw === 'on';
  const ai_daily_token_limit = Number(aiDailyLimitRaw);
  const ai_overage_behavior = typeof aiOverageBehaviorRaw === 'string' ? aiOverageBehaviorRaw : 'block';

  if (!Number.isFinite(ai_daily_token_limit) || ai_daily_token_limit < 1000) {
    throw new Error('Daily token limit must be at least 1000.');
  }

  if (!['block', 'warn'].includes(ai_overage_behavior)) {
    throw new Error('Invalid overage behavior.');
  }

  const { error } = await supabase
    .from('app_settings')
    .update({
      ai_enabled,
      ai_daily_token_limit,
      ai_overage_behavior,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/settings');
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your restaurant details and daily defaults.</p>
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          System Setup
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          <div className="bg-slate-900 border text-left border-slate-800 rounded-2xl shadow-sm p-6 overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center"><Sliders className="w-5 h-5 mr-2 text-indigo-400" /> Inventory Defaults</h2>

            <form className="space-y-4" action={updateInventoryDefaults}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Low-Stock Threshold Multiplier</label>
                  <input name="low_stock_multiplier" type="number" step="0.1" min="1" defaultValue={settings.low_stock_multiplier} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500 text-slate-100" />
                  <p className="text-xs text-slate-500">Example: 1.5 triggers reorder alerts at 150% of minimum stock.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Default Unit Type</label>
                  <input name="default_unit_type" type="text" defaultValue={settings.default_unit_type} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500 text-slate-100" />
                  <p className="text-xs text-slate-500">Used when adding new items (e.g., pcs, kg, packs).</p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5 flex justify-end">
                <button type="submit" className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors">
                  <Save className="w-4 h-4 mr-2" /> Save Inventory Defaults
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-900 border text-left border-slate-800 rounded-2xl shadow-sm p-6 overflow-hidden">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-indigo-400" /> AI Usage</h2>

            <form className="space-y-4" action={updateAiSettings}>
              <div className="flex items-center justify-between border border-slate-800 rounded-lg px-4 py-3 bg-slate-950">
                <div>
                  <p className="text-sm font-medium text-slate-200">Enable AI Assistant</p>
                  <p className="text-xs text-slate-500">Turn off to disable AI responses and suggestions.</p>
                </div>
                <input name="ai_enabled" type="checkbox" defaultChecked={settings.ai_enabled} className="h-4 w-4 text-indigo-500 focus:ring-indigo-500 border-slate-700 rounded" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Daily Token Limit</label>
                  <input name="ai_daily_token_limit" type="number" min="1000" step="500" defaultValue={settings.ai_daily_token_limit} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500 text-slate-100" />
                  <p className="text-xs text-slate-500">Hard cap for AI usage per day.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Overage Behavior</label>
                  <select name="ai_overage_behavior" defaultValue={settings.ai_overage_behavior} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-100">
                    <option value="block">Block new AI requests</option>
                    <option value="warn">Warn but allow</option>
                  </select>
                  <p className="text-xs text-slate-500">How the system behaves when limits are reached.</p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5 flex justify-end">
                <button type="submit" className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors">
                  <Save className="w-4 h-4 mr-2" /> Save AI Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
