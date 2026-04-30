import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';

export default function AppLayout() {
  const { theme } = useAppContext();

  return (
    <div className={cn("min-h-screen bg-background relative overflow-hidden flex", theme)}>
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-grow relative z-10 lg:ml-64 flex flex-col min-h-screen">
        <TopNav />
        <main className="max-w-[1600px] w-full mx-auto px-4 md:px-8 pt-24 pb-10 flex-grow">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
