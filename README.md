# SmartStock AI

SmartStock AI is a restaurant inventory management system built with Next.js, TypeScript, Supabase, and Google Gemini. It helps teams track inventory, manage stock changes, identify low-stock items, and generate AI-powered reorder suggestions and assistant responses using real-time inventory data.

## Features

- Real-time inventory dashboard
- Inventory management with search and stock adjustments
- Low-stock detection and alerts
- AI-generated reorder suggestions
- AI assistant for inventory questions
- Transaction tracking for inventory changes
- Supabase-backed database integration
- Responsive dark-themed interface

## Tech Stack

- Next.js (App Router)
- TypeScript
- Supabase
- Tailwind CSS
- Google Gemini API
- Lucide React icons

## Project Structure

- `src/app/page.tsx` — dashboard overview
- `src/app/inventory/page.tsx` — inventory management page
- `src/app/reorders/page.tsx` — AI reorder suggestions page
- `src/app/assistant/page.tsx` — AI assistant page
- `src/app/api/chat/route.ts` — Gemini chat API
- `src/app/api/reorders/route.ts` — Gemini reorder API
- `src/app/actions.ts` — server actions for inventory updates
- `src/components/InventoryTable.tsx` — inventory table with search and stock adjustments
- `src/components/Sidebar.tsx` — main app navigation
- `src/components/Header.tsx` — top navigation bar
- `src/types/supabase.ts` — generated Supabase types

## Core Pages

### Dashboard
The dashboard shows:

- total items tracked
- total inventory value
- low-stock items that need attention
- recent inventory activity

### Inventory
The inventory page provides:

- a searchable list of items
- current stock levels
- minimum stock thresholds
- stock-in and stock-out adjustment actions
- optimistic UI updates with rollback on failure

### Suggested Orders
The reorder page uses Gemini to analyze low-stock items and return suggested purchase quantities, reasoning, and estimated costs.

### AI Assistant
The assistant page lets users ask questions about inventory using real-time Supabase data and recent inventory transactions. It supports streaming responses from Gemini.

## Database Schema

SmartStock AI uses Supabase tables and enums similar to the following:

### `items`
- `id`
- `name`
- `sku`
- `category_id`
- `current_stock`
- `minimum_stock`
- `cost_per_unit`
- `unit`
- `created_at`
- `updated_at`

### `categories`
- `id`
- `name`
- `description`
- `created_at`

### `inventory_transactions`
- `id`
- `item_id`
- `type`
- `quantity`
- `notes`
- `created_by`
- `created_at`

### `transaction_type`
- `in`
- `out`
- `adjustment`
- `waste`

## Environment Variables

Create a `.env.local` file with the required environment values for Supabase and Gemini.

Example:

```bash
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Getting Started

### Prerequisites
- Node.js 18+ recommended
- A Supabase project
- A Google Gemini API key

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Available Scripts

- `npm run dev` — start the development server
- `npm run build` — build the application
- `npm run start` — start the production server
- `npm run lint` — run linting

## How It Works

1. The dashboard reads inventory data from Supabase.
2. The inventory page allows updates to stock levels through server actions.
3. Every stock adjustment creates a transaction record.
4. The reorder endpoint uses Gemini to suggest restock quantities.
5. The assistant endpoint uses Gemini and live inventory data to answer natural-language questions.

## Deployment

This project can be deployed to Vercel or any platform that supports Next.js. Make sure your environment variables are configured in production.

## Troubleshooting

### Gemini features are not working
- Confirm `GEMINI_API_KEY` is set correctly.
- Verify the API key has access to Gemini models.

### Supabase data is missing
- Confirm your Supabase URL and keys are correct.
- Check that your database tables match the expected schema.

### Stock updates fail
- Ensure the item exists in the `items` table.
- Confirm the transaction insert and item update permissions are correct.

## License

Add your preferred license here if you plan to publish this project publicly.