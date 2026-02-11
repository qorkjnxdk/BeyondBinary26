'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BabyJourneyTimeline from '@/components/BabyJourneyTimeline';
import StageCard from '@/components/StageCard';
import BabyJourneySetup from '@/components/BabyJourneySetup';
import MilestoneTracker from '@/components/MilestoneTracker';

interface BabyJourneyTabProps {
  isActive: boolean;
}

interface StageContent {
  stage: number;
  title: string;
  tagline: string;
  age_range: string;
  milestones: string[];
  challenges: string[];
  look_forward: string[];
  journal_prompts: string[];
}

interface JourneyData {
  baby_name: string | null;
  baby_birth_date: string | null;
  baby_age_days: number | null;
  baby_age_display: string | null;
  current_stage: number;
  current_stage_content: StageContent | null;
  next_stage: number | null;
  next_stage_date: string | null;
  progress_in_stage: number;
  notifications_enabled: boolean;
  milestone_tracking_enabled: boolean;
}

export default function BabyJourneyTab({ isActive }: BabyJourneyTabProps) {
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [allStages, setAllStages] = useState<StageContent[]>([]);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  const loadJourneyData = () => {
    setLoading(true);
    const token = getToken();
    fetch('/api/baby-journey', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.journey && data.all_stages) {
          setJourneyData(data.journey);
          setAllStages(data.all_stages);

          // Auto-select current stage if birth date is set
          if (data.journey.current_stage >= 0) {
            setSelectedStage(data.journey.current_stage);
          }
        }
      })
      .catch((error) => {
        toast.error('Error loading baby journey');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isActive) return;
    loadJourneyData();
  }, [isActive]);

  // Show setup modal if no birth date is set
  useEffect(() => {
    if (journeyData && !journeyData.baby_birth_date) {
      setShowSetup(true);
    }
  }, [journeyData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your journey...</p>
        </div>
      </div>
    );
  }

  if (!journeyData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load journey data.</p>
      </div>
    );
  }

  const selectedStageContent = selectedStage !== null
    ? allStages.find(s => s.stage === selectedStage)
    : null;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Setup Modal */}
      {showSetup && (
        <BabyJourneySetup
          onClose={() => setShowSetup(false)}
          onSave={() => {
            setShowSetup(false);
            loadJourneyData();
          }}
        />
      )}

      {/* Header with baby info */}
      {journeyData.baby_birth_date && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl shadow-soft p-6 border border-pink-100 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {journeyData.baby_name ? `${journeyData.baby_name}'s` : 'Your Baby\'s'} Journey
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {journeyData.baby_age_display}
              </p>
            </div>
            <button
              onClick={() => setShowSetup(true)}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 border border-gray-200 transition-all"
            >
              Settings
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {journeyData.baby_birth_date && (
        <div className="mb-8">
          <BabyJourneyTimeline
            currentStage={journeyData.current_stage}
            allStages={allStages}
            selectedStage={selectedStage}
            onStageSelect={setSelectedStage}
            progressInStage={journeyData.progress_in_stage}
          />
        </div>
      )}

      {/* Stage Content Card */}
      {selectedStageContent && (
        <div className="mb-6">
          <StageCard
            stage={selectedStageContent}
            isCurrent={selectedStage === journeyData.current_stage}
            isCompleted={selectedStage !== null && selectedStage < journeyData.current_stage}
          />
        </div>
      )}

      {/* Milestone Tracker (if enabled) */}
      {journeyData.milestone_tracking_enabled && selectedStage !== null && (
        <div className="mb-6">
          <MilestoneTracker
            stage={selectedStage}
            onMilestoneUpdate={() => {
              // Optionally reload milestones
            }}
          />
        </div>
      )}

      {/* Call-to-action if no birth date */}
      {!journeyData.baby_birth_date && (
        <div className="bg-white rounded-2xl shadow-soft p-8 border border-gray-100 text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Welcome to Your Baby Journey
            </h2>
            <p className="text-gray-600 mb-6">
              Track your baby's developmental stages, milestones, and get support tailored to where you are in your journey.
            </p>
            <button
              onClick={() => setShowSetup(true)}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
