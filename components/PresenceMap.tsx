'use client';

import { useEffect, useState } from 'react';

interface PresenceEntry {
  location: string;
  count: number;
}

export default function PresenceMap() {
  const [presence, setPresence] = useState<PresenceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    const loadPresence = () => {
      fetch('/api/debug/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (!data.users) return;
          const online = data.users.filter((u: any) => u.status === 'online');
          const counts: Record<string, number> = {};
          online.forEach((u: any) => {
            const loc = u.location || 'Somewhere in SG';
            counts[loc] = (counts[loc] || 0) + 1;
          });
          const entries = Object.entries(counts).map(([location, count]) => ({ location, count }));
          entries.sort((a, b) => b.count - a.count);
          setPresence(entries);
        })
        .finally(() => setLoading(false));
    };

    loadPresence();
    const interval = setInterval(loadPresence, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalOnline = presence.reduce((sum, p) => sum + p.count, 0);
  const pins = presence.slice(0, 6); // show top locations as pins
  const pinPositions = [
    'top-6 left-10',
    'top-10 right-16',
    'top-1/2 left-1/4 -translate-y-1/2',
    'top-1/2 right-8 -translate-y-1/2',
    'bottom-10 left-1/3',
    'bottom-6 right-12',
  ];

  return (
    <div className="bg-white rounded-3xl shadow-soft p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Live Presence Map</h2>
          <p className="text-xs text-gray-500">
            Inspired by Snap Map, showing which areas mums are online in — never exact addresses.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-sm">
            {totalOnline}
          </div>
          <span className="text-[10px] uppercase tracking-wide text-gray-400">Online now</span>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600 text-sm">Loading presence...</p>
      ) : presence.length === 0 ? (
        <p className="text-gray-500 text-sm">
          You might be the first one here right now. Others will join soon.
        </p>
      ) : (
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-sky-100 via-indigo-100 to-emerald-100 h-64 mb-4">
          {/* Stylised \"map\" background grid */}
          <div className="absolute inset-0 opacity-30">
            <div className="w-full h-full bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.6)_0,transparent_40%),radial-gradient(circle_at_80%_0,rgba(255,255,255,0.8)_0,transparent_45%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.5)_0,transparent_50%)]" />
          </div>

          {/* Pins */}
          <div className="absolute inset-0">
            {pins.map((entry, index) => {
              const pos = pinPositions[index % pinPositions.length];
              const isSelected = selectedLocation === entry.location;
              return (
                <button
                  key={entry.location}
                  type="button"
                  onClick={() =>
                    setSelectedLocation(
                      selectedLocation === entry.location ? null : entry.location
                    )
                  }
                  className={`absolute ${pos} transform transition-all duration-200 ${
                    isSelected ? 'scale-110 z-20' : 'hover:scale-105'
                  }`}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      {entry.count}
                    </div>
                    <div className="absolute inset-x-1/2 top-8 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-primary-500 opacity-80" />
                  </div>
                  <div className="mt-2 px-2 py-1 rounded-full bg-white/90 backdrop-blur text-[10px] font-semibold text-gray-800 max-w-[120px] truncate shadow-sm">
                    {entry.location}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {presence.length > 0 && (
        <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
          {presence.slice(0, 10).map((entry) => (
            <button
              key={entry.location}
              type="button"
              onClick={() =>
                setSelectedLocation(
                  selectedLocation === entry.location ? null : entry.location
                )
              }
              className={`px-2.5 py-1 rounded-full border text-xs transition-all ${
                selectedLocation === entry.location
                  ? 'border-primary-400 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              {entry.location} · {entry.count}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
