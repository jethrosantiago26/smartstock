'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, UtensilsCrossed, ArrowRight, DollarSign, Edit, Archive } from 'lucide-react';
import { addMenuItem, updateMenuItem, archiveMenuItem } from '@/app/actions';
import { Database } from '@/types/supabase';

type Item = Database['public']['Tables']['items']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type Recipe = Database['public']['Tables']['menu_recipes']['Row'] & { items: Pick<Item, 'name' | 'unit' | 'sku'> };
type MenuItemWithRecipes = MenuItem & { menu_recipes: Recipe[] };

export default function MenuEngineeringPage() {
  const [menuItems, setMenuItems] = useState<MenuItemWithRecipes[]>([]);
  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // New Menu Item State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [ingredients, setIngredients] = useState<{ inventory_item_id: string, quantity_required: string }[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // Fetch menu items with their recipes expanded
      const { data: menuData } = await supabase
        .from('menu_items')
        .select(`
          *,
          menu_recipes (
            id, quantity_required, inventory_item_id,
            items (name, unit, sku)
          )
        `)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      // Fetch active inventory items for the dropdown
      const { data: invData } = await supabase
        .from('items')
        .select('*')
        .eq('is_archived', false)
        .order('name');

      if (menuData) setMenuItems(menuData as MenuItemWithRecipes[]);
      if (invData) setInventoryItems(invData);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { inventory_item_id: '', quantity_required: '' }]);
  };

  const handleUpdateIngredient = (index: number, field: string, value: string) => {
    const parsed = [...ingredients];
    parsed[index] = { ...parsed[index], [field]: value };
    setIngredients(parsed);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setIngredients([]);
  };

  const handleEditClick = (item: MenuItemWithRecipes) => {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description || '');
    setPrice(item.price.toString());
    setIngredients(
      item.menu_recipes.map((recipe) => ({
        inventory_item_id: recipe.inventory_item_id,
        quantity_required: recipe.quantity_required.toString()
      }))
    );
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleArchive = async (id: string) => {
    if (confirm('Are you sure you want to archive this menu item? It will be removed from the POS screen.')) {
      setLoading(true);
      await archiveMenuItem(id);
      window.location.reload();
    }
  };

  const handleSaveMenu = async () => {
    if (!name || !price) return alert('Name and Price are required.');
    
    // Filter out empty ingredients
    const validIngredients = ingredients
      .filter(i => i.inventory_item_id && i.quantity_required)
      .map(i => ({ inventory_item_id: i.inventory_item_id, quantity_required: Number(i.quantity_required) }));

    setSubmitting(true);
    let res;
    if (editingId) {
      res = await updateMenuItem(editingId, name, description, Number(price), validIngredients);
    } else {
      res = await addMenuItem(name, description, Number(price), validIngredients);
    }
    
    if (res.success) {
      window.location.reload(); // Quick refresh to grab new data
    } else {
      alert(res.error);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-white p-8 animate-pulse text-center w-full">Loading Engine...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
            <UtensilsCrossed className="mr-3 text-indigo-400 w-7 h-7" /> Menu Engineering
          </h1>
          <p className="text-sm text-slate-400 mt-1">Design recipes and link them to dynamic inventory depletion.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 flex flex-row items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Menu Item
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold text-white mb-4">{editingId ? 'Edit Menu Item' : 'Create New Menu Item'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Item Name</label>
                <input 
                  type="text" 
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none" 
                  placeholder="e.g. Classic Cheeseburger"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Sale Price ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="number"
                      value={price} onChange={e => setPrice(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none" 
                      placeholder="14.99"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea 
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none h-20 resize-none" 
                  placeholder="Menu description..."
                />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-slate-300">Recipe Formula</label>
                <button onClick={handleAddIngredient} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors">+ Add Ingredient</button>
              </div>
              
              <div className="space-y-3">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex flex-row items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-lg">
                    <div className="flex-1">
                      <select 
                        value={ing.inventory_item_id}
                        onChange={e => handleUpdateIngredient(i, 'inventory_item_id', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white outline-none"
                      >
                        <option value="">Select inventory item...</option>
                        {inventoryItems.map(item => (
                          <option key={item.id} value={item.id}>{item.name} ({item.sku}) - tracked in {item.unit}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input 
                        type="number" 
                        placeholder="Qty"
                        value={ing.quantity_required}
                        onChange={e => handleUpdateIngredient(i, 'quantity_required', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white outline-none" 
                      />
                    </div>
                    <button onClick={() => handleRemoveIngredient(i)} className="text-slate-500 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {ingredients.length === 0 && <p className="text-xs text-slate-500 italic text-center py-4">No ingredients added. This item won&apos;t affect inventory.</p>}
              </div>

            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button 
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveMenu}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save & Publish Menu Item'}
            </button>
          </div>
        </div>
      )}

      {/* Menu List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {menuItems.map(item => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">{item.description || 'No description'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEditClick(item)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleArchive(item.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors mr-2">
                  <Archive className="w-4 h-4" />
                </button>
                <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-sm font-bold">
                  ${item.price}
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-800/50">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center">
                Recipe Breakdown <ArrowRight className="w-3 h-3 ml-2 text-slate-600" />
              </h4>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/50 space-y-2">
                {item.menu_recipes && item.menu_recipes.length > 0 ? (
                  item.menu_recipes.map((rec) => (
                    <div key={rec.id} className="flex justify-between items-center text-sm">
                      <span className="text-slate-300 font-medium">{rec.items.name}</span>
                      <span className="text-slate-500 font-mono text-xs">{rec.quantity_required} x {rec.items.unit}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 text-center py-1">No ingredients tied perfectly to inventory.</div>
                )}
              </div>
            </div>
          </div>
        ))}
        {menuItems.length === 0 && (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-lg">
            <UtensilsCrossed className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300">Your Menu is Empty</h3>
            <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">Start engineering your menu above. Once you link raw ingredients to dishes, SmartStock will automate transaction reporting straight from the Virtual POS.</p>
          </div>
        )}
      </div>

    </div>
  );
}
