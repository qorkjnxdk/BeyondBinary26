'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface SetupProps {
  onClose: () => void;
  onSave: () => void;
}

export default function BabyJourneySetup({ onClose, onSave }: SetupProps) {
  const [babyName, setBabyName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [milestoneTrackingEnabled, setMilestoneTrackingEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  // Load existing settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = getToken();
        const res = await fetch('/api/baby-journey', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.journey) {
          if (data.journey.baby_name) setBabyName(data.journey.baby_name);
          if (data.journey.baby_birth_date) setBirthDate(data.journey.baby_birth_date);
          if (data.journey.notifications_enabled !== undefined) {
            setNotificationsEnabled(data.journey.notifications_enabled);
          }
          if (data.journey.milestone_tracking_enabled !== undefined) {
            setMilestoneTrackingEnabled(data.journey.milestone_tracking_enabled);
          }
        }
      } catch (e) {
        console.error('Error loading settings:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!birthDate) {
      toast.error('Please enter your baby\'s birth date');
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch('/api/baby-journey/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          baby_name: babyName || null,
          baby_birth_date: birthDate,
          notifications_enabled: notificationsEnabled,
          milestone_tracking_enabled: milestoneTrackingEnabled,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSave();
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (e) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Set Up Your Baby Journey
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Tell us a bit about your baby to personalize your journey timeline.
        </p>

        <div className="space-y-4">
          {/* Baby name (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Baby's Name (Optional)
            </label>
            <input
              type="text"
              value={babyName}
              onChange={(e) => setBabyName(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Only you will see this. It helps personalize your experience.
            </p>
          </div>

          {/* Birth date (required) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Baby's Birth Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              This helps us calculate your baby's developmental stage.
            </p>
          </div>

          {/* Notifications toggle */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="notifications"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="notifications" className="text-sm text-gray-700">
              <span className="font-medium">Enable stage transition notifications</span>
              <p className="text-gray-500 text-xs mt-1">
                Get notified when your baby enters a new developmental stage.
              </p>
            </label>
          </div>

          {/* Milestone tracking toggle */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="milestones"
              checked={milestoneTrackingEnabled}
              onChange={(e) => setMilestoneTrackingEnabled(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="milestones" className="text-sm text-gray-700">
              <span className="font-medium">Enable milestone tracking</span>
              <p className="text-gray-500 text-xs mt-1">
                Track your baby's milestones for personal memory-keeping (not competitive).
              </p>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !birthDate}
            className="px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
