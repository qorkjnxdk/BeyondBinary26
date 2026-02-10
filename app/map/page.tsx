'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FeatureTabs from '@/components/FeatureTabs';
import PresenceMap from '@/components/PresenceMap';

export default function PresenceMapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-soft">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FeatureTabs />
      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
            Live Social Presence
          </h1>
          <p className="text-gray-600">
            See where other mums are online right now across Singapore
          </p>
        </div>
        <PresenceMap />
      </div>
    </div>
  );
}

