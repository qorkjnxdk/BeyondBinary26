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

function clampView(
    x: number,
    y: number,
    scale: number,
    viewportW: number,
    viewportH: number
) {
  const contentW = viewportW * scale;
  const contentH = viewportH * scale;

  // If content is smaller than viewport (can happen if you allow scale < 1),
  // lock it centered.
  const minX = contentW <= viewportW ? (viewportW - contentW) / 2 : viewportW - contentW;
  const maxX = contentW <= viewportW ? (viewportW - contentW) / 2 : 0;

  const minY = contentH <= viewportH ? (viewportH - contentH) / 2 : viewportH - contentH;
  const maxY = contentH <= viewportH ? (viewportH - contentH) / 2 : 0;

  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, maxY),
  };
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

    // DO NOT drag if clicking interactive element
    const target = e.target as HTMLElement;

    if (target.closest("button")) {
      return;
    }

    dragging.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    last.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;

    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };

    const el = containerRef.current;
    if (!el) return;

    const { width, height } = el.getBoundingClientRect();

    setView((v) => {
      const nextX = v.x + dx;
      const nextY = v.y + dy;
      const clamped = clampView(nextX, nextY, v.scale, width, height);
      return { ...v, ...clamped };
    });
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

        const rawX = cx - (cx - v.x) * scaleRatio;
        const rawY = cy - (cy - v.y) * scaleRatio;

        const clamped = clampView(rawX, rawY, nextScale, rect.width, rect.height);

        return { x: clamped.x, y: clamped.y, scale: nextScale };
      });
    };

    // KEY: passive must be false or preventDefault won’t work
    el.addEventListener("wheel", handler, { passive: false });

    return () => el.removeEventListener("wheel", handler as any);
  }, [view.scale]);

  const reset = () => setView({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    const onResize = () => {
      const el = containerRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      setView((v) => {
        const clamped = clampView(v.x, v.y, v.scale, width, height);
        return { ...v, ...clamped };
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const [friends, setFriends] = useState<any[]>([]);
  const [everyone, setEveryone] = useState<any[]>([]);

  const [scope, setScope] = useState<"friends" | "everyone">("friends");
  const [status, setStatus] = useState<"all" | "online">("all");

  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const load = async () => {
      try {
        setLoading(true);

        const [friendsRes, everyoneRes] = await Promise.all([
          fetch("/api/friends", { headers }).then(r => r.json()),
          fetch("/api/presence", { headers }).then(r => r.json()),
        ]);

        setFriends(friendsRes.friends || []);
        setEveryone(everyoneRes.presence || []);

      } finally {
        setLoading(false);
      }
    };

    load();

    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);

  }, []);

  const source = scope === "friends" ? friends : everyone;

  const filtered = source.filter((u: any) => {

    if (!u.location) return false;

    if (!singaporeLatLng[u.location]) return false;

    if (status === "online") return u.online;

    return true;

  });

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
            {filtered.filter((u:any) => u.online).length}
          </div>
          <span className="text-[10px] uppercase tracking-wide text-gray-400">Online now</span>
        </div>
      </div>

      {loading ? (
          <p className="text-gray-600 text-sm">Loading presence...</p>
      ) : (
          <div>

            {/* Filters ALWAYS visible */}
            <div className="flex gap-2 mb-3">

              <button
                  onClick={() => setScope("friends")}
                  className={`px-3 py-1 rounded-full border text-sm ${
                      scope === "friends"
                          ? "bg-primary-50 border-primary-400"
                          : "bg-white border-gray-200"
                  }`}
              >
                Friends
              </button>

              <button
                  onClick={() => setScope("everyone")}
                  className={`px-3 py-1 rounded-full border text-sm ${
                      scope === "everyone"
                          ? "bg-primary-50 border-primary-400"
                          : "bg-white border-gray-200"
                  }`}
              >
                Everyone
              </button>

              <button
                  onClick={() => setStatus("all")}
                  className={`px-3 py-1 rounded-full border text-sm ${
                      status === "all"
                          ? "bg-gray-100 border-gray-400"
                          : "bg-white border-gray-200"
                  }`}
              >
                All
              </button>

              <button
                  onClick={() => setStatus("online")}
                  className={`px-3 py-1 rounded-full border text-sm ${
                      status === "online"
                          ? "bg-gray-100 border-gray-400"
                          : "bg-white border-gray-200"
                  }`}
              >
                Online
              </button>

            </div>

            {/* Map ALWAYS visible */}
            <div className="relative w-full overflow-hidden rounded-3xl border border-gray-100 mb-4 bg-white aspect-[1536/895]">
              <DraggableMapViewport>

                <div
                    className="absolute inset-0"
                    onClick={() => setSelectedUser(null)}
                >
                  <img
                      src="/singapore.png"
                      alt="Singapore map"
                      draggable={false}
                      className="absolute inset-0 w-full h-full object-contain object-center select-none pointer-events-none"
                  />
                </div>

                <div className="absolute inset-0">

                  {/* Show pins */}
                  {filtered.map((user: any) => {

                    const coord = singaporeLatLng[user.location];
                    if (!coord) return null;

                    const { left, top } = latLngToPercent(coord.lat, coord.lng);

                    return (
                        <button
                            key={user.userId}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                            }}
                            style={{
                              position: "absolute",
                              left,
                              top,
                              transform: "translate(-50%, -100%)",
                              zIndex: selectedUser?.userId === user.userId ? 50 : 10,
                            }}
                            className="transition-all hover:scale-105 group"
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${
                              scope === "friends"
                                  ? "bg-gradient-to-r from-primary-500 to-accent-500"
                                  : "bg-gradient-to-r from-gray-500 to-gray-700"
                          }`}>
                            {user.realName?.[0] || "U"}
                          </div>

                          {user.online && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"/>
                          )}

                        </button>
                    );
                  })}

                  {/* Popup */}
                  {selectedUser && (() => {

                    const coord = singaporeLatLng[selectedUser.location];
                    if (!coord) return null;

                    const { left, top } = latLngToPercent(coord.lat, coord.lng);

                    return (
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: "absolute",
                              left,
                              top,
                              transform: "translate(-50%, -140%)",
                              zIndex: 999,
                            }}
                        >
                          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-48">

                            <div className="font-semibold text-gray-900">
                              {selectedUser.realName}
                            </div>

                            <div className="text-xs text-gray-500">
                              {selectedUser.location}
                            </div>

                            <div className="text-xs mt-1">
                              {selectedUser.online
                                  ? <span className="text-green-500">● Online</span>
                                  : <span className="text-gray-400">Offline</span>}
                            </div>

                            <button
                                onClick={() => setSelectedUser(null)}
                                className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                            >
                              Close
                            </button>

                          </div>
                        </div>
                    );

                  })()}

                  {/* Empty message INSIDE map */}
                  {filtered.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
                        No users match this filter
                      </div>
                  )}

                </div>

              </DraggableMapViewport>
            </div>

          </div>
      )}
    </div>
  )
}
