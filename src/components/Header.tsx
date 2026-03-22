import { Search, Bell, Menu } from 'lucide-react';

export default function Header() {
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
      <div className="flex items-center space-x-3 sm:space-x-4 pl-4">
        <button className="relative p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 cursor-pointer shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-white dark:border-slate-800"></div>
      </div>
    </header>
  );
}
