import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';
import { NextResponse } from 'next/server';

type InventoryItem = Tables<'items'>;

// Generate reorder suggestions from current stock levels.
export async function GET() {
  try {
    const { data: items } = await supabase
      .from('items')
      .select('id, name, sku, current_stock, minimum_stock, cost_per_unit, unit');
    if (!items || items.length === 0) return NextResponse.json([]);

    const lowStockItems = (items as InventoryItem[])
      .filter((item) => item.current_stock <= item.minimum_stock * 1.5)
      .sort((a, b) => (a.current_stock - a.minimum_stock) - (b.current_stock - b.minimum_stock));
    if (lowStockItems.length === 0) return NextResponse.json([]);

    const suggestions = lowStockItems
      .map((item) => {
        const targetStock = Math.max(item.minimum_stock * 2, item.minimum_stock + 1);
        const suggestedQuantity = Math.max(0, Math.ceil(targetStock - item.current_stock));

        return {
          itemId: item.id,
          itemName: item.name,
          sku: item.sku,
          suggestedQuantity,
          reasoning: 'Brings stock up to about 2x the minimum level for a safety buffer.',
          estimatedCost: Number((suggestedQuantity * Number(item.cost_per_unit || 0)).toFixed(2)),
        };
      })
      .filter((suggestion) => suggestion.suggestedQuantity > 0);

    return NextResponse.json(suggestions);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Reorder API Error:', { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
