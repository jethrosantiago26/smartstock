'use server'

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function adjustStock(
  itemId: string, 
  currentStock: number, 
  quantityChange: number, 
  type: 'in' | 'out' | 'adjustment' | 'waste', 
  notes?: string
) {
  const newStock = currentStock + quantityChange;
  if (newStock < 0) {
    return { success: false, error: 'Stock cannot be less than 0' };
  }

  // Record Transaction
  const { error: txError } = await supabase.from('inventory_transactions').insert({
    item_id: itemId,
    type,
    quantity: Math.abs(quantityChange), 
    notes: notes || `Manual ${type}`
  });
  
  if (txError) {
    console.error('TX Error', txError);
    return { success: false, error: txError.message };
  }

  // Update Item
  const { error: updateError } = await supabase.from('items').update({
    current_stock: newStock,
    updated_at: new Date().toISOString()
  }).eq('id', itemId);
  
  if (updateError) {
    console.error('Update Error', updateError);
    return { success: false, error: updateError.message };
  }
  
  revalidatePath('/inventory');
  revalidatePath('/');
  return { success: true };
}

export async function addItem(formData: FormData) {
  const name = formData.get('name') as string;
  const current_stock = Number(formData.get('current_stock')) || 0;
  const minimum_stock = Number(formData.get('minimum_stock')) || 0;
  const cost_per_unit = Number(formData.get('cost_per_unit')) || 0;
  const unit = (formData.get('unit') as string) || 'units';
  
  // Auto-generate SKU
  const cleanName = name.replace(/[^A-Za-z]/g, '');
  const prefix = cleanName.length >= 3 ? cleanName.substring(0, 4).toUpperCase() : 'ITEM';
  
  const { data: existing } = await supabase
    .from('items')
    .select('sku')
    .like('sku', `${prefix}-%`)
    .order('sku', { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (existing && existing.length > 0) {
    const parts = existing[0].sku.split('-');
    if (parts.length === 2 && !isNaN(Number(parts[1]))) {
      nextNum = Number(parts[1]) + 1;
    }
  }
  const sku = `${prefix}-${nextNum.toString().padStart(3, '0')}`;

  const { error } = await supabase.from('items').insert({
    sku,
    name,
    current_stock,
    minimum_stock,
    cost_per_unit,
    unit,
    is_archived: false // Default added in migration, explicit here for safety
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath('/inventory');
  revalidatePath('/');
  return { success: true };
}

export async function archiveItem(id: string) {
  const { error } = await supabase.from('items').update({
    is_archived: true,
    updated_at: new Date().toISOString()
  }).eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/inventory');
  revalidatePath('/');
  return { success: true };
}

export async function updateItem(id: string, formData: FormData) {
  const sku = formData.get('sku') as string;
  const name = formData.get('name') as string;
  const current_stock = Number(formData.get('current_stock')) || 0;
  const minimum_stock = Number(formData.get('minimum_stock')) || 0;
  const cost_per_unit = Number(formData.get('cost_per_unit')) || 0;
  const unit = (formData.get('unit') as string) || 'units';

  const { error } = await supabase.from('items').update({
    sku,
    name,
    current_stock,
    minimum_stock,
    cost_per_unit,
    unit,
    updated_at: new Date().toISOString()
  }).eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/inventory');
  revalidatePath('/');
  return { success: true };
}

export async function acceptReorders(suggestions: { itemId: string, suggestedQuantity: number }[]) {
  for (const item of suggestions) {
    const { data: current } = await supabase.from('items').select('current_stock').eq('id', item.itemId).single();
    if (current) {
      const newStock = current.current_stock + item.suggestedQuantity;
      await supabase.from('inventory_transactions').insert({
        item_id: item.itemId,
        type: 'in',
        quantity: item.suggestedQuantity,
        notes: 'AI Restock Suggestion'
      });
      await supabase.from('items').update({ current_stock: newStock }).eq('id', item.itemId);
    }
  }
  revalidatePath('/inventory');
  revalidatePath('/');
  return { success: true };
}

export async function restoreItem(id: string) {
  const { error } = await supabase.from('items').update({
    is_archived: false,
    updated_at: new Date().toISOString()
  }).eq('id', id);

  if (error) return { success: false, error: error.message };
  
  revalidatePath('/inventory');
  revalidatePath('/inventory/archive');
  return { success: true };
}

export async function permanentDeleteItem(id: string) {
  const { error } = await supabase.from('items').delete().eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/inventory');
  revalidatePath('/inventory/archive');
  return { success: true };
}

export async function addMenuItem(
  name: string,
  description: string,
  price: number,
  ingredients: { inventory_item_id: string; quantity_required: number }[]
) {
  // 1. Insert Menu Item
  const { data: menuItem, error: menuError } = await supabase
    .from('menu_items')
    .insert({ name, description, price })
    .select('id')
    .single();

  if (menuError || !menuItem) {
    return { success: false, error: menuError?.message || 'Failed to create menu item' };
  }

  // 2. Insert Recipes
  if (ingredients.length > 0) {
    const payload = ingredients.map(ing => ({
      menu_item_id: menuItem.id,
      inventory_item_id: ing.inventory_item_id,
      quantity_required: ing.quantity_required,
    }));

    const { error: recipeError } = await supabase.from('menu_recipes').insert(payload);
    if (recipeError) {
      // rollback manually just in case
      await supabase.from('menu_items').delete().eq('id', menuItem.id);
      return { success: false, error: recipeError.message };
    }
  }

  revalidatePath('/menu');
  return { success: true };
}

export async function logMenuSale(menuItemId: string) {
  // 1. Fetch the recipe for this menu item
  const { data: recipes, error: fetchError } = await supabase
    .from('menu_recipes')
    .select('inventory_item_id, quantity_required')
    .eq('menu_item_id', menuItemId);

  if (fetchError) return { success: false, error: fetchError.message };
  if (!recipes || recipes.length === 0) return { success: false, error: 'No recipe items found' };

  // 2. Reduce stock and record transactions for each ingredient
  // Note: Parallelizing with Promise.all
  try {
    await Promise.all(recipes.map(async (recipe) => {
      // Fetch current stock
      const { data: item } = await supabase
        .from('items')
        .select('current_stock')
        .eq('id', recipe.inventory_item_id)
        .single();

      if (!item) return; // Skip if item mysteriously deleted

      const newStock = item.current_stock - recipe.quantity_required;

      // Update Stock
      await supabase
        .from('items')
        .update({ current_stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', recipe.inventory_item_id);

      // Record out transaction
      await supabase
        .from('inventory_transactions')
        .insert({
          item_id: recipe.inventory_item_id,
          type: 'out',
          quantity: recipe.quantity_required,
          notes: 'POS Recipe Deduction'
        });
    }));

    revalidatePath('/inventory');
    revalidatePath('/analytics');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
