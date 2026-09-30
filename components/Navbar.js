'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Compass, Library, MessageSquare, CalendarClock, Sparkles, Settings, ListOrdered, Bot } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function Navbar() {
  const pathname = usePathname();
  const { bgCanvas, borderTone, accentSolid, textPrimary } = useTheme();
  
  // Hydration fix: Prevent rendering dynamic classes until the client mounts
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return a placeholder of the exact same height during SSR to prevent layout shift
  if (!mounted) {
    return <nav className="fixed bottom-0 left-0 w-full h-16 border-t z-50 bg-[#FDF1E2] dark:bg-[#0a0a0a]" />;
  }

  // Hide navbar inside active communication sessions
  if (pathname === '/communication') return null;

  const navItems = [
    { name: 'Hub', path: '/communication-hub', icon: Home },
    { name: 'Guide', path: '/guide', icon: Sparkles },
    { name: 'Domains', path: '/', icon: Compass },
    { name: 'Chat', path: '/conversation', icon: MessageSquare },
    { name: 'Phrases', path: '/phrasebook', icon: Library },
    { name: 'Planner', path: '/followups', icon: CalendarClock },
    { name: 'Requests', path: '/history', icon: History },
    { name: 'Prefs', path: '/preferences', icon: Settings },
    { name: 'Steps', path: '/steps', icon: ListOrdered },
    { name: 'AI Studio', path: '/ai-studio', icon: Bot },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 w-full border-t z-50 ${bgCanvas} ${borderTone}`}>
      <style dangerouslySetInnerHTML={{__html: `
        .nav-scroll::-webkit-scrollbar { display: none; }
        .nav-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      
      <div className="max-w-xl mx-auto px-2 sm:px-4 h-16 flex items-center justify-start sm:justify-center overflow-x-auto nav-scroll gap-1 sm:gap-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center min-w-[3.5rem] sm:w-14 h-full gap-1 transition-all shrink-0 ${
                isActive ? 'opacity-100 scale-105' : 'opacity-50 hover:opacity-100'
              }`}
            >
              <div className={`p-1.5 rounded-full ${isActive ? accentSolid : 'bg-transparent'}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className={`text-[9px] sm:text-[10px] font-mono font-bold tracking-tight truncate ${isActive ? textPrimary : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}