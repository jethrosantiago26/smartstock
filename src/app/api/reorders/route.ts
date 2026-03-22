import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function GET(req: Request) {
  try {
    const { data: items } = await supabase.from('items').select('*');
    if (!items || items.length === 0) return NextResponse.json([]);

    const lowStockItems = items.filter(i => i.current_stock <= i.minimum_stock * 1.5);
    if (lowStockItems.length === 0) return NextResponse.json([]);

    const responseSchema = {
      type: Type.ARRAY,
      description: "List of recommended items to reorder",
      items: {
        type: Type.OBJECT,
        properties: {
          itemId: { type: Type.STRING },
          itemName: { type: Type.STRING },
          sku: { type: Type.STRING },
          suggestedQuantity: { type: Type.INTEGER, description: "How many units to reorder based on deficit and buffer" },
          reasoning: { type: Type.STRING, description: "Short explanation for this reorder suggestion" },
          estimatedCost: { type: Type.NUMBER }
        },
        required: ["itemId", "itemName", "sku", "suggestedQuantity", "reasoning", "estimatedCost"]
      }
    };

    const prompt = `You are SmartStock AI. Look at the following low stock items.
Calculate how many to reorder. A good rule of thumb is to restock to 2x the minimum_stock to provide a buffer.
ITEMS: ${JSON.stringify(lowStockItems)}

Return an array of objects structured according to the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    const suggestions = JSON.parse(response.text || '[]');
    return NextResponse.json(suggestions);

  } catch (error: any) {
    console.error('Gemini Reorder API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
