'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const tabs = [
  { id: 'chat', label: 'Anonymous Chat', href: '/dashboard#chat-section' },
  { id: 'presence', label: 'Presence Map', href: '/dashboard#presence-section' },
  { id: 'journal', label: 'Journal', href: '/journal' },
  { id: 'habits', label: 'Habits', href: '/habits' },
];

export default function FeatureTabs() {
  const pathname = usePathname();
  const [active, setActive] = useState<string>('chat');

  useEffect(() => {
    if (pathname === '/journal') setActive('journal');
    else if (pathname === '/habits') setActive('habits');
    else setActive('chat');
  }, [pathname]);

  return (
    <div className="sticky top-0 z-20 px-6 pt-3 pb-2 bg-white/95 backdrop-blur border-b border-gray-100 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            onClick={() => setActive(tab.id)}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-full font-semibold transition-all border ${
              isActive
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
