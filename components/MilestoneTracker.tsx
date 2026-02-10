'use client';

import { useState, useEffect } from 'react';

interface Milestone {
  milestone_id: string;
  stage: number;
  milestone_key: string;
  milestone_name: string;
  achieved: boolean;
  achieved_at: number | null;
  notes: string | null;
}

interface MilestoneTrackerProps {
  stage: number;
  onMilestoneUpdate: () => void;
}

export default function MilestoneTracker({ stage, onMilestoneUpdate }: MilestoneTrackerProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  const loadMilestones = () => {
    setLoading(true);
    const token = getToken();
    fetch(`/api/baby-journey/milestones?stage=${stage}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.milestones) {
          setMilestones(data.milestones);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMilestones();
  }, [stage]);

  const toggleMilestone = async (milestoneId: string, currentAchieved: boolean) => {
    try {
      const token = getToken();
      const res = await fetch('/api/baby-journey/milestones', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          milestone_id: milestoneId,
          achieved: !currentAchieved,
        }),
      });

      if (res.ok) {
        loadMilestones();
        onMilestoneUpdate();

        // Show celebration animation if newly achieved
        if (!currentAchieved) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="text-gray-600 text-sm">Loading milestones...</div>;
  }

  if (milestones.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <p className="text-sm text-gray-600">
          No milestones tracked for this stage yet. You can add custom milestones as you go!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Milestone Tracker</h3>
      <p className="text-xs text-gray-500 mb-4">
        Track milestones for personal memory-keeping. No pressure, no competition.
      </p>

      {/* Celebration animation */}
      {showCelebration && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg animate-fadeIn">
          <p className="text-center text-sm font-semibold text-green-700">
            Milestone achieved! You're doing great!
          </p>
        </div>
      )}

      <div className="space-y-3">
        {milestones.map((milestone) => (
          <div
            key={milestone.milestone_id}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
          >
            <button
              onClick={() => toggleMilestone(milestone.milestone_id, milestone.achieved)}
              className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-sm transition-all ${
                milestone.achieved
                  ? 'bg-green-500 text-white'
                  : 'bg-white border-2 border-gray-300 text-gray-400'
              }`}
            >
              {milestone.achieved ? '✓' : ''}
            </button>
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  milestone.achieved ? 'text-gray-500 line-through' : 'text-gray-800'
                }`}
              >
                {milestone.milestone_name}
              </p>
              {milestone.achieved && milestone.achieved_at && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(milestone.achieved_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
