import Link from 'next/link';
import { LayoutDashboard, Package, BotMessageSquare, Settings, Sparkles, PieChart } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col text-slate-100 h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
        <div className="bg-indigo-500 rounded-lg p-1.5 mr-3 shadow-lg shadow-indigo-500/30">
          <BotMessageSquare className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">SmartStock</span>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">Main</div>
        <Link href="/" className="flex flex-row items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all duration-200 group">
          <LayoutDashboard className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          <span className="font-medium text-sm">Dashboard</span>
        </Link>
        <Link href="/inventory" className="flex flex-row items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all duration-200 group">
          <Package className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          <span className="font-medium text-sm">Inventory</span>
        </Link>
        <Link href="/analytics" className="flex flex-row items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all duration-200 group">
          <PieChart className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          <span className="font-medium text-sm">Analytics & Alerts</span>
        </Link>
        
        <div className="mt-8 mb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Intelligence</div>
        <Link href="/reorders" className="flex flex-row items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all duration-200 group">
          <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
          <span className="font-medium text-sm">Suggested Orders</span>
        </Link>
        <Link href="/assistant" className="flex flex-row items-center space-x-3 px-3 py-2.5 rounded-lg text-indigo-100 bg-indigo-500/10 hover:bg-indigo-500/20 shadow-inner border border-indigo-500/20 transition-all duration-200 group relative">
          <BotMessageSquare className="w-5 h-5 text-indigo-400" />
          <span className="font-medium text-sm">AI Assistant</span>
          <span className="absolute right-2.5 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-500 text-white shadow-sm">Beta</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-slate-800 shrink-0">
        <Link href="/settings" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg w-full text-left text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200">
          <Settings className="w-5 h-5" />
          <span className="font-medium text-sm">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
