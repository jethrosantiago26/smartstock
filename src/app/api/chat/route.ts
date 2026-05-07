import { GoogleGenAI } from '@google/genai';
import { LocalTokenizer } from '@google/genai/tokenizer/node';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const tokenizer = new LocalTokenizer('gemini-2.5-flash');

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type InventorySnapshot = {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  lowStockItems: Array<{
    name: string;
    sku: string;
    current_stock: number;
    minimum_stock: number;
    unit: string;
    cost_per_unit: number;
  }>;
  recentTransactions: Array<{
    type: string;
    quantity: number;
    created_at: string;
    item: string | undefined;
  }>;
};

type CachedSnapshotEntry = {
  expiresAt: number;
  snapshot: InventorySnapshot;
};

type ChatThrottleEntry = {
  expiresAt: number;
};

type AppSettings = {
  low_stock_multiplier: number;
  default_unit_type: string;
  ai_enabled: boolean;
  ai_daily_token_limit: number;
  ai_overage_behavior: 'block' | 'warn';
};

const INVENTORY_SNAPSHOT_TTL_MS = 60_000;
const CHAT_COOLDOWN_MS = 12_000;
const MAX_MESSAGE_LENGTH = 1_000;
const MAX_HISTORY_MESSAGES = 4;
const MAX_HISTORY_MESSAGE_LENGTH = 500;
const MAX_OUTPUT_TOKENS = 1024;

const globalForChat = globalThis as typeof globalThis & {
  inventorySnapshotCache?: CachedSnapshotEntry;
  chatThrottleMap?: Map<string, ChatThrottleEntry>;
};

const inventorySnapshotCache = globalForChat.inventorySnapshotCache ?? { expiresAt: 0, snapshot: null as unknown as InventorySnapshot };
const chatThrottleMap = globalForChat.chatThrottleMap ?? new Map<string, ChatThrottleEntry>();

globalForChat.inventorySnapshotCache = inventorySnapshotCache;
globalForChat.chatThrottleMap = chatThrottleMap;

function getClientIdentifier(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.headers.get('x-real-ip') || 'anonymous';
}

function throttleChatRequests(clientId: string) {
  const now = Date.now();
  const current = chatThrottleMap.get(clientId);

  if (current && current.expiresAt > now) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  chatThrottleMap.set(clientId, { expiresAt: now + CHAT_COOLDOWN_MS });

  if (chatThrottleMap.size > 500) {
    for (const [key, entry] of chatThrottleMap.entries()) {
      if (entry.expiresAt <= now) {
        chatThrottleMap.delete(key);
      }
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

function isInventoryQuestion(message: string) {
  const normalized = message.toLowerCase();
  return [
    'inventory',
    'stock',
    'reorder',
    'sales',
    'transaction',
    'menu',
    'cost',
    'costs',
    'analytics',
    'sku',
    'ingredient',
  ].some((keyword) => normalized.includes(keyword));
}

function isValidChatMessage(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= MAX_MESSAGE_LENGTH;
}

function normalizeConversationHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is ChatMessage => {
      return Boolean(
        entry
        && typeof entry === 'object'
        && (entry.role === 'user' || entry.role === 'assistant')
        && typeof entry.content === 'string'
        && entry.content.trim().length > 0,
      );
    })
    .map((entry) => ({
      role: entry.role,
      content: entry.content.trim().slice(0, MAX_HISTORY_MESSAGE_LENGTH),
    }))
    .slice(-MAX_HISTORY_MESSAGES);
}

function buildInventorySnapshot(items: any[] = [], transactions: any[] = []): InventorySnapshot {
  const lowStockItems = items
    .filter((item) => item.current_stock <= item.minimum_stock)
    .sort((a, b) => a.current_stock - b.current_stock)
    .slice(0, 10)
    .map((item) => ({
      name: item.name,
      sku: item.sku,
      current_stock: item.current_stock,
      minimum_stock: item.minimum_stock,
      unit: item.unit,
      cost_per_unit: item.cost_per_unit,
    }));

  const recentTransactions = transactions.slice(0, 10).map((transaction) => ({
    type: transaction.type,
    quantity: transaction.quantity,
    created_at: transaction.created_at,
    item: transaction.items?.name,
  }));

  const totalItems = items.length;
  const totalValue = items.reduce(
    (sum, item) => sum + (Number(item.cost_per_unit || 0) * Number(item.current_stock || 0)),
    0,
  );

  return {
    totalItems,
    totalValue,
    lowStockCount: lowStockItems.length,
    lowStockItems,
    recentTransactions,
  };
}

// Load persisted AI and inventory defaults for chat guardrails.
async function getAppSettings(): Promise<AppSettings> {
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

  return {
    ...data,
    ai_overage_behavior: data.ai_overage_behavior === 'warn' ? 'warn' : 'block',
  };
}

// Fetch the daily token usage ledger for AI quota enforcement.
async function getDailyUsage(usageDate: string) {
  const { data } = await supabase
    .from('ai_usage_daily')
    .select('prompt_tokens, completion_tokens, total_tokens')
    .eq('usage_date', usageDate)
    .single();

  return data || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
}

// Persist token usage totals for the current date.
async function recordDailyUsage(usageDate: string, promptTokens: number, completionTokens: number) {
  const totalTokens = promptTokens + completionTokens;

  const { data: existing } = await supabase
    .from('ai_usage_daily')
    .select('prompt_tokens, completion_tokens, total_tokens')
    .eq('usage_date', usageDate)
    .single();

  const nextPrompt = (existing?.prompt_tokens || 0) + promptTokens;
  const nextCompletion = (existing?.completion_tokens || 0) + completionTokens;
  const nextTotal = (existing?.total_tokens || 0) + totalTokens;

  await supabase
    .from('ai_usage_daily')
    .upsert({
      usage_date: usageDate,
      prompt_tokens: nextPrompt,
      completion_tokens: nextCompletion,
      total_tokens: nextTotal,
      updated_at: new Date().toISOString(),
    });
}

// Build or reuse a cached snapshot of inventory data for AI context.
async function getInventorySnapshot() {
  const now = Date.now();

  if (inventorySnapshotCache.snapshot && inventorySnapshotCache.expiresAt > now) {
    return inventorySnapshotCache.snapshot;
  }

  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('name, sku, current_stock, minimum_stock, unit, cost_per_unit');

  if (itemsError) {
    throw new Error(`Failed to load inventory items: ${itemsError.message}`);
  }

  const { data: transactions, error: transactionsError } = await supabase
    .from('inventory_transactions')
    .select('type, quantity, created_at, items(name)')
    .order('created_at', { ascending: false })
    .limit(20);

  if (transactionsError) {
    throw new Error(`Failed to load recent transactions: ${transactionsError.message}`);
  }

  const snapshot = buildInventorySnapshot(items || [], transactions || []);
  inventorySnapshotCache.snapshot = snapshot;
  inventorySnapshotCache.expiresAt = now + INVENTORY_SNAPSHOT_TTL_MS;

  return snapshot;
}

// Validate chat input, enforce limits, and stream a Gemini response.
export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const message = 'message' in body ? body.message : undefined;
    const conversationHistory = 'conversationHistory' in body ? body.conversationHistory : undefined;

    if (!isValidChatMessage(message)) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    const normalizedHistory = normalizeConversationHistory(conversationHistory);
    const clientId = getClientIdentifier(req);
    const throttleResult = throttleChatRequests(clientId);

    if (!throttleResult.allowed) {
      return NextResponse.json(
        { error: `Please wait ${throttleResult.retryAfterSeconds} seconds before sending another chat request.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(throttleResult.retryAfterSeconds),
          },
        },
      );
    }

    const trimmedMessage = message.trim();

    const settings = await getAppSettings();

    if (!settings.ai_enabled) {
      return NextResponse.json({ error: 'AI assistance is disabled in Settings.' }, { status: 403 });
    }

    if (!isInventoryQuestion(trimmedMessage)) {
      return new Response(
        'I can help with inventory, reorders, sales, menu items, stock, and transaction analysis. I do not handle unrelated or low-value requests.',
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        },
      );
    }

    const inventorySnapshot = await getInventorySnapshot();
    const systemPrompt = `You are SmartStock AI, an expert restaurant inventory manager.
Answer only inventory, reorder, sales, menu, stock, and transaction questions.
Refuse unrelated, speculative, or low-value requests.
Keep responses concise and practical.
Use the provided snapshot as the only source of truth.

INVENTORY SNAPSHOT: ${JSON.stringify(inventorySnapshot)}`;

    const contents = [];
    if (normalizedHistory.length > 0) {
      for (const msg of normalizedHistory) {
        contents.push({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.content }] });
      }
    }
    
    contents.push({
      role: 'user', 
      parts: [{ text: `[SYSTEM CONTEXT: ${systemPrompt}]\n\nUSER MESSAGE: ${trimmedMessage}` }]
    });

    const promptTokenResult = await tokenizer.countTokens(contents);
    const promptTokens = promptTokenResult.totalTokens || 0;
    const usageDate = new Date().toISOString().slice(0, 10);
    const currentUsage = await getDailyUsage(usageDate);
    const remainingTokens = settings.ai_daily_token_limit - currentUsage.total_tokens - promptTokens;

    if (remainingTokens <= 0 && settings.ai_overage_behavior === 'block') {
      return NextResponse.json({ error: 'Daily AI token limit reached. Try again tomorrow.' }, { status: 429 });
    }

    const maxOutputTokens = Math.max(
      1,
      Math.min(MAX_OUTPUT_TOKENS, remainingTokens > 0 ? remainingTokens : MAX_OUTPUT_TOKENS),
    );

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        maxOutputTokens,
      },
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let assistantContent = '';
          for await (const chunk of responseStream) {
            if (chunk.text) {
              assistantContent += chunk.text;
              controller.enqueue(new TextEncoder().encode(chunk.text));
            }
          }
          const completionTokenResult = await tokenizer.countTokens(assistantContent);
          const completionTokens = completionTokenResult.totalTokens || 0;
          await recordDailyUsage(usageDate, promptTokens, completionTokens);
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/chat] request failed', {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Unable to process chat request' }, { status: 500 });
  }
}
