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
  const sku = formData.get('sku') as string;
  const name = formData.get('name') as string;
  const current_stock = Number(formData.get('current_stock')) || 0;
  const minimum_stock = Number(formData.get('minimum_stock')) || 0;
  const cost_per_unit = Number(formData.get('cost_per_unit')) || 0;
  const unit = (formData.get('unit') as string) || 'units';
  
  const { error } = await supabase.from('items').insert({
    sku,
    name,
    current_stock,
    minimum_stock,
    cost_per_unit,
    unit
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath('/inventory');
  revalidatePath('/');
  return { success: true };
}
