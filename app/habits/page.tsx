"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { HabitType } from "@/lib/habits";
import FeatureTabs from "@/components/FeatureTabs";

interface HabitSummary {
  id: HabitType;
  label: string;
  completed: boolean;
}

export default function HabitsPage() {
  const router = useRouter();
  const [habits, setHabits] = useState<HabitSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  const loadHabits = () => {
    const token = getToken();
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetch('/api/habits', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.habits) setHabits(data.habits);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const toggleHabit = async (habitId: HabitType) => {
    setSavingId(habitId);
    try {
      const token = getToken();
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ habitType: habitId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to log habit');
      } else {
        loadHabits();
      }
    } catch (e) {
      console.error(e);
      alert('Error logging habit');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FeatureTabs />
      <div className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="bg-white rounded-2xl shadow-soft p-8 border border-gray-100 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
            Gentle Habit Check-in
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Small physical check-ins that support your mood. No streaks, no pressure.
          </p>

          {loading ? (
            <p className="text-gray-600">Loading habits...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {habits.map(habit => (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id)}
                  disabled={savingId === habit.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    habit.completed
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : 'bg-white border-gray-200 text-gray-800 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  <span className="text-sm font-semibold mr-3">{habit.label}</span>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    habit.completed ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {habit.completed ? '✓' : '+'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
