#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server({ name: "smartstock-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_inventory",
        description: "Get all items and current stock levels",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "adjust_stock",
        description: "Adjust the stock level for an item",
        inputSchema: {
          type: "object",
          properties: {
            sku: { type: "string" },
            quantity: { type: "number", description: "Positive to add, negative to remove" },
            reason: { type: "string" }
          },
          required: ["sku", "quantity", "reason"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "get_inventory") {
    const { data } = await supabase.from("items").select("sku, name, current_stock, minimum_stock");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  } 
  
  if (name === "adjust_stock") {
    const { sku, quantity, reason } = args;
    const { data: item } = await supabase.from("items").select("id, current_stock").eq("sku", sku).single();
    if (!item) return { content: [{ type: "text", text: `Item ${sku} not found.` }], isError: true };
    
    const newStock = item.current_stock + quantity;
    const type = quantity > 0 ? 'in' : 'out';
    
    await supabase.from("inventory_transactions").insert({ item_id: item.id, type, quantity: Math.abs(quantity), notes: reason });
    await supabase.from("items").update({ current_stock: newStock }).eq("id", item.id);
    
    return { content: [{ type: "text", text: `Successfully adjusted stock for ${sku}. New stock: ${newStock}` }] };
  }
  
  return { content: [{ type: "text", text: "Unknown tool" }], isError: true };
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("SmartStock MCP Server running on stdio");
