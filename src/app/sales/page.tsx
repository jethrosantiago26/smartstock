'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, CheckCircle2, ChevronRight, X, Loader2 } from 'lucide-react';
import { logMenuSale } from '@/app/actions';
import { Database } from '@/types/supabase';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export default function POSPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cart State
  const [cart, setCart] = useState<{ item: MenuItem, qty: number }[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    async function fetchMenu() {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_archived', false)
        .order('name');
      if (data) setMenuItems(data);
      setLoading(false);
    }
    fetchMenu();
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.item.price * c.qty), 0);

  const confirmOrder = async () => {
    setIsProcessing(true);
    
    // Process each item in the cart
    for (const c of cart) {
      for (let i = 0; i < c.qty; i++) {
        await logMenuSale(c.item.id);
      }
    }
    
    setIsProcessing(false);
    setShowConfirm(false);
    setSuccessMsg(true);
    setCart([]); // Reset Cart

    setTimeout(() => setSuccessMsg(false), 3000);
  };

  if (loading) return <div className="text-white p-8 text-center animate-pulse w-full">Loading POS Engine...</div>;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      
      {/* Sales Grid */}
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center">
              <ShoppingCart className="mr-3 text-indigo-400 w-6 h-6" /> Virtual Terminal
            </h1>
            <p className="text-sm text-slate-400 mt-1">Tap items to build an order ticket.</p>
          </div>
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl flex items-center shadow-lg animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              <span className="font-bold text-sm">Order Processed! Stock Deducted.</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="relative h-32 rounded-2xl flex flex-col justify-center items-center p-4 transition-all duration-200 border-2 select-none group focus:outline-none focus:ring-4 focus:ring-indigo-500/50 bg-slate-900 border-slate-800 hover:border-indigo-500 hover:bg-slate-800 shadow-xl active:scale-95"
            >
              <h3 className="text-center font-bold text-slate-100 mb-2 leading-tight group-hover:text-indigo-200 transition-colors">{item.name}</h3>
              <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-semibold tracking-wide">
                ${item.price}
              </div>
            </button>
          ))}
          {menuItems.length === 0 && (
            <div className="col-span-full border border-dashed border-slate-700 bg-slate-900/50 rounded-2xl p-12 text-center">
              <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Virtual Terminal Offline</p>
              <p className="text-slate-600 text-sm mt-1">Visit Menu Engineering to add dishes to your screen.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Ledger */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col h-[calc(100vh-10rem)] border border-slate-800 rounded-2xl bg-slate-900 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-slate-200 tracking-tight text-sm">Current Order Ticket</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map((c) => (
            <div key={c.item.id} className="flex justify-between items-center bg-slate-950 rounded-lg p-3 border border-slate-800/60 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-slate-800 text-white font-bold px-2 py-1 rounded text-xs">
                  {c.qty}x
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{c.item.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">${(c.item.price * c.qty).toFixed(2)}</p>
                </div>
              </div>
              <button 
                onClick={() => removeFromCart(c.item.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2">
              <p className="text-sm font-medium">Cart is empty...</p>
            </div>
          )}
        </div>

        {/* Checkout Button */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <div className="flex justify-between items-center mb-4 text-slate-300 font-medium">
            <span>Total</span>
            <span className="text-xl font-bold text-white">${cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={cart.length === 0}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center text-lg active:scale-95"
          >
            Confirm Order <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Confirm Payment</h3>
              <p className="text-slate-400 text-sm mb-6">
                Process this ticket for <strong>${cartTotal.toFixed(2)}</strong>? <br/> This will automatically deduct stock.
              </p>
              
              <div className="space-y-3">
                <button 
                  disabled={isProcessing}
                  onClick={confirmOrder}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Transaction'}
                </button>
                <button 
                  disabled={isProcessing}
                  onClick={() => setShowConfirm(false)} 
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
