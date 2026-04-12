'use client'

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          {children}
        </main>
      </div>
    </>
  );
}
