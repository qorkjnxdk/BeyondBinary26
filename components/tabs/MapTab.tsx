'use client';

import PresenceMap from '@/components/PresenceMap';

export default function MapTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
          Live Social Presence
        </h2>
        <p className="text-gray-600">
          See where other mums are online right now across Singapore
        </p>
      </div>
      <PresenceMap />
    </div>
  );
}

