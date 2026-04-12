'use client'

import { useState } from 'react';
import { Search, Bell, Menu, AlertCircle } from 'lucide-react';

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 shrink-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4 w-full">
        <button className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search inventory, suggest reorders..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 shadow-inner"
          />
        </div>
      </div>
      <div className="flex items-center space-x-3 sm:space-x-4 pl-4 relative">
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-2 rounded-full transition-all duration-200 ${showNotifications ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
        </button>

        {showNotifications && (
          <div className="absolute right-12 top-11 w-80 bg-white border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden z-50">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</h3>
              <span className="text-xs text-indigo-600 font-medium">Mark all read</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-start space-x-3 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Low Stock Alert: Avocados</p>
                  <p className="text-xs text-slate-500 mt-0.5">Only 3 pieces remaining in stock.</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">2 hours ago</p>
                </div>
              </div>
              <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-start space-x-3 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Low Stock Alert: Frozen Pie Shells</p>
                  <p className="text-xs text-slate-500 mt-0.5">Below minimum stock threshold (4 pieces).</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">5 hours ago</p>
                </div>
              </div>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-900 text-center border-t border-slate-100 dark:border-slate-800">
              <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">View All Updates</button>
            </div>
          </div>
        )}

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 cursor-pointer shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-white dark:border-slate-800"></div>
      </div>
    </header>
  );
}
