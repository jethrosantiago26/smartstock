import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const { message, conversationHistory } = await req.json();

    const { data: items } = await supabase.from('items').select('name, sku, current_stock, minimum_stock, unit, cost_per_unit');
    const { data: transactions } = await supabase
      .from('inventory_transactions')
      .select('type, quantity, created_at, items(name)')
      .order('created_at', { ascending: false })
      .limit(20);

    const systemPrompt = `You are SmartStock AI, an expert restaurant inventory manager.
Provide concise, helpful, and analytical answers.
Here is the real-time inventory data:
ITEMS: ${JSON.stringify(items)}
RECENT TRANSACTIONS: ${JSON.stringify(transactions)}

Analyze this data to answer the user's questions perfectly. If they ask about reordering, calculate based on current vs minimum stock. Use markdown for formatted responses. Emphasize low stock items in bold.`;

    const contents = [];
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] });
      }
    }
    
    contents.push({
      role: 'user', 
      parts: [{ text: `[SYSTEM CONTEXT: ${systemPrompt}]\n\nUSER MESSAGE: ${message}` }]
    });

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(new TextEncoder().encode(chunk.text));
            }
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
