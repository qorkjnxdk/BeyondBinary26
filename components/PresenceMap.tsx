'use client';

import { useEffect, useState, useRef } from 'react';
import { singaporeLatLng} from "@/lib/singaporeLatLng";

interface PresenceEntry {
  location: string;
  count: number;
}

const SG_BOUNDS = {
  minLat: 1.240,
  maxLat: 1.475,
  minLng: 103.600,
  maxLng: 104.050,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function latLngToPercent(lat: number, lng: number) {
  const x01 = (lng - SG_BOUNDS.minLng) / (SG_BOUNDS.maxLng - SG_BOUNDS.minLng);
  const y01 = (SG_BOUNDS.maxLat - lat) / (SG_BOUNDS.maxLat - SG_BOUNDS.minLat);

  // keep away from edges
  const x = 8 + clamp(x01, 0, 1) * 84;
  const y = 10 + clamp(y01, 0, 1) * 80;

  return { left: `${x}%`, top: `${y}%` };
}

export function DraggableMapViewport({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });

  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    last.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };

    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      // stop the page from scrolling
      e.preventDefault();
      e.stopPropagation();

      const zoomIntensity = 0.0015;
      const nextScale = clamp(view.scale * (1 - e.deltaY * zoomIntensity), 0.8, 2.5);

      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      setView((v) => {
        const scaleRatio = nextScale / v.scale;
        const nextX = cx - (cx - v.x) * scaleRatio;
        const nextY = cy - (cy - v.y) * scaleRatio;
        return { x: nextX, y: nextY, scale: nextScale };
      });
    };

    // KEY: passive must be false or preventDefault won’t work
    el.addEventListener("wheel", handler, { passive: false });

    return () => el.removeEventListener("wheel", handler as any);
  }, [view.scale]);

  const reset = () => setView({ x: 0, y: 0, scale: 1 });

  return (
      <div
          ref={containerRef}
          className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none overscroll-contain"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          // onWheelCapture={onWheel}
      >
        {/* Optional reset control */}
        <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="absolute z-30 top-3 right-3 px-2 py-1 rounded-lg bg-white/90 backdrop-blur border border-gray-200 text-xs text-gray-700 hover:bg-white"
        >
          Reset
        </button>

        <div
            className="absolute inset-0"
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
              transformOrigin: "0 0",
              willChange: "transform",
            }}
        >
          {children}
        </div>
      </div>
  );
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
          <div className="relative w-full overflow-hidden rounded-3xl border border-gray-100 mb-4 bg-white aspect-[1536/895]">
            <DraggableMapViewport>
              <img
                  src="/singapore.png"
                  alt="Singapore map"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-contain object-center select-none pointer-events-none"
              />

              {/* Pins overlay */}
              <div className="absolute inset-0">
                {pins.map((entry) => {
                  const coord = singaporeLatLng[entry.location];
                  if (!coord) return null;

                  const { left, top } = latLngToPercent(coord.lat, coord.lng);

                  return (
                      <button
                          key={entry.location}
                          type="button"
                          onClick={() =>
                              setSelectedLocation(selectedLocation === entry.location ? null : entry.location)
                          }
                          style={{
                            position: "absolute",
                            left,
                            top,
                            transform: "translate(-50%, -100%)",
                          }}
                          className="transition-all hover:scale-105"
                      >
                        {/* your pin UI */}
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
            </DraggableMapViewport>
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
