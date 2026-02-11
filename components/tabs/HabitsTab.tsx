'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import type { HabitType } from '@/lib/habits';

interface HabitSummary {
  id: HabitType;
  label: string;
  completed: boolean;
}

interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
}

interface HabitsTabProps {
  isActive: boolean;
}

export default function HabitsTab({ isActive }: HabitsTabProps) {
  const [habits, setHabits] = useState<HabitSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<Record<string, HabitLog[]>>({});
  const [socialCounts, setSocialCounts] = useState<Record<string, number>>({});

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  const getDateSuffix = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getSocialKey = (habitId: string) => {
    return `habitSocialCount:${habitId}:${getDateSuffix()}`;
  };

  // Generate mock historical data for past 7 days (excluding today)
  const generateMockHistory = (habitId: string): HabitLog[] => {
    const history: HabitLog[] = [];
    const today = new Date();

    // Different completion patterns for different habits (7 days ago to yesterday)
    const patterns: Record<string, number[]> = {
      'drink_water': [1, 1, 1, 0, 1, 1, 1], // Very consistent
      'sleep': [0, 1, 0, 0, 1, 0, 1], // Inconsistent (challenging)
      'go_outside': [1, 0, 0, 1, 0, 1, 1], // Moderate
      'eat_meal': [1, 1, 1, 1, 0, 1, 1], // Mostly consistent
      'move': [1, 0, 1, 0, 0, 1, 0], // Moderate
      'rest': [0, 0, 1, 0, 1, 0, 1], // Challenging
    };

    const pattern = patterns[habitId] || [1, 0, 1, 0, 1, 0, 1];

    // Generate history for days 7-1 ago (excluding today)
    for (let i = 7; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      history.push({
        habitId,
        date: date.toISOString().split('T')[0],
        completed: pattern[7 - i] === 1,
      });
    }

    return history;
  };

  // Memoized social context - only generates once per historical data change
  // Shows positive message if >50% success rate, negative if <50%
  const socialContextMap = useMemo(() => {
    // Always-positive social messages per habit, using a shared random count
    const contexts: Record<string, (count: number) => string> = {
      drink_water: (count) => `${count} other mothers stayed hydrated today`,
      sleep: (count) => `${count} other mothers got decent rest last night`,
      go_outside: (count) => `${count} other mothers went outside today`,
      eat_meal: (count) => `${count} other mothers ate a full meal today`,
      move: (count) => `${count} other mothers stretched today`,
      rest: (count) => `${count} other mothers took time to rest today`,
    };

    const map: Record<string, string> = {};
    habits.forEach(habit => {
      const count = socialCounts[habit.id] ?? 0;
      const makeMessage = contexts[habit.id] || ((c: number) => `${c} other mothers are doing this today`);
      map[habit.id] = makeMessage(count);
    });
    return map;
  }, [habits, socialCounts]);

  // Memoized gentle insight - only generates once per historical data change
  const insight = useMemo(() => {
    if (Object.keys(historicalData).length === 0) return null;

    const insights: { habitId: string; completionRate: number; message: string }[] = [];

    // Custom messages for each habit at different completion rates
    const habitMessages: Record<string, { low: string; high: string; moderate: string }> = {
      'drink_water': {
        low: 'Staying hydrated has been tough lately. You\'re doing your best, and that\'s enough.',
        high: 'You\'ve been good about drinking water — that\'s caring for yourself.',
        moderate: 'You\'ve been drinking less water this week — even a few sips helps.',
      },
      'sleep': {
        low: 'Sleep has been tough lately. You\'re doing your best, and that\'s enough.',
        high: 'You\'ve been getting decent rest — that\'s wonderful.',
        moderate: 'Sleep has been harder this week — rest when you can.',
      },
      'go_outside': {
        low: 'Getting outside has been challenging. You\'re doing your best, and that\'s enough.',
        high: 'You\'ve been good about getting outside — that\'s caring for yourself.',
        moderate: 'You\'ve been outside less this week — even 5 minutes helps.',
      },
      'eat_meal': {
        low: 'Eating regular meals has been tough lately. You\'re doing your best, and that\'s enough.',
        high: 'You\'ve been good about eating — that\'s caring for yourself.',
        moderate: 'You\'ve been eating less regularly this week — small bites count too.',
      },
      'move': {
        low: 'Moving your body has been challenging. You\'re doing your best, and that\'s enough.',
        high: 'You\'ve been good about stretching and moving — that\'s wonderful.',
        moderate: 'You\'ve been moving less this week — gentle stretches are enough.',
      },
      'rest': {
        low: 'Finding time to rest has been tough lately. You\'re doing your best, and that\'s enough.',
        high: 'You\'ve been good about resting — you deserve this time.',
        moderate: 'You\'ve been resting less this week — you deserve this time.',
      },
    };

    Object.entries(historicalData).forEach(([habitId, logs]) => {
      const completedCount = logs.filter(log => log.completed).length;
      const rate = completedCount / logs.length;

      const messages = habitMessages[habitId];
      if (!messages) return;

      let message: string;
      if (rate <= 0.3) {
        message = messages.low;
      } else if (rate >= 0.7) {
        message = messages.high;
      } else if (rate < 0.5) {
        message = messages.moderate;
      } else {
        return; // Skip neutral rates
      }

      insights.push({
        habitId,
        completionRate: rate,
        message,
      });
    });

    // Return one random insight
    if (insights.length > 0) {
      return insights[Math.floor(Math.random() * insights.length)].message;
    }

    return null;
  }, [historicalData, habits]);

  const loadHabits = () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    fetch('/api/habits', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.habits) {
          setHabits(data.habits);

          // Generate mock historical data for each habit
          const history: Record<string, HabitLog[]> = {};
          data.habits.forEach((habit: HabitSummary) => {
            history[habit.id] = generateMockHistory(habit.id);
          });
          setHistoricalData(history);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isActive) return;
    loadHabits();
  }, [isActive]);

  // Initialize per-habit social counts once per day
  useEffect(() => {
    if (!isActive || habits.length === 0) return;
    if (typeof window === 'undefined') return;

    const nextCounts: Record<string, number> = {};

    habits.forEach((habit) => {
      const key = getSocialKey(habit.id);
      const stored = localStorage.getItem(key);
      let value: number;

      if (stored !== null && !isNaN(parseInt(stored, 10))) {
        value = parseInt(stored, 10);
      } else {
        // Baseline ranges (similar to previous random ranges)
        const ranges: Record<string, { min: number; max: number }> = {
          'drink_water': { min: 15, max: 34 },
          'sleep': { min: 10, max: 24 },
          'go_outside': { min: 10, max: 29 },
          'eat_meal': { min: 15, max: 39 },
          'move': { min: 12, max: 31 },
          'rest': { min: 10, max: 27 },
        };
        const range = ranges[habit.id] || { min: 10, max: 30 };
        value = range.min + Math.floor(Math.random() * (range.max - range.min + 1));
        localStorage.setItem(key, String(value));
      }

      nextCounts[habit.id] = value;
    });

    setSocialCounts(nextCounts);
  }, [isActive, habits]);

  // Auto-increment social counts every 1–2 minutes (demo effect)
  useEffect(() => {
    if (!isActive || habits.length === 0) return;
    if (typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      const delay = 60000 + Math.random() * 60000; // 1–2 minutes
      timeoutId = setTimeout(() => {
        setSocialCounts(prev => {
          const updated: Record<string, number> = { ...prev };
          habits.forEach(habit => {
            const key = getSocialKey(habit.id);
            const current =
              typeof updated[habit.id] === 'number'
                ? updated[habit.id]
                : (() => {
                    const stored = localStorage.getItem(key);
                    const parsed = stored !== null ? parseInt(stored, 10) : NaN;
                    return !isNaN(parsed) ? parsed : 0;
                  })();
            const next = current + 1;
            updated[habit.id] = next;
            localStorage.setItem(key, String(next));
          });
          return updated;
        });
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isActive, habits]);

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
        toast.error(data.error || 'Failed to log habit');
      } else {
        loadHabits();
        // For demo: adjust the social count for this habit based on new completion state
        const key = getSocialKey(habitId);
        setSocialCounts(prev => {
          const current = prev[habitId] ?? 0;
          // If it was previously completed, we toggled off -> decrement.
          // If it was previously not completed, we toggled on -> increment.
          const wasCompleted = habits.find(h => h.id === habitId)?.completed ?? false;
          const delta = wasCompleted ? -1 : 1;
          const next = current + delta;
          if (typeof window !== 'undefined') {
            localStorage.setItem(key, String(next));
          }
          return { ...prev, [habitId]: next };
        });
      }
    } catch (e) {
      toast.error('Error logging habit');
    } finally {
      setSavingId(null);
    }
  };

  const toggleExpanded = (habitId: string) => {
    setExpandedHabit(expandedHabit === habitId ? null : habitId);
  };

  const getDayLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-soft p-8 border border-gray-100 mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
          Gentle Habit Check-in
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Small physical check-ins that support your mood. No streaks, no pressure.
        </p>

        {loading ? (
          <p className="text-gray-600">Loading habits...</p>
        ) : (
          <div className="space-y-3">
            {habits.map(habit => {
              const isExpanded = expandedHabit === habit.id;
              const history = historicalData[habit.id] || [];
              const socialContext = socialContextMap[habit.id] || 'Others are doing this too';

              return (
                <div
                  key={habit.id}
                  className="border-2 border-gray-200 rounded-xl overflow-hidden transition-all hover:border-primary-300"
                >
                  {/* Main habit row */}
                  <div className="flex items-center justify-between p-4 bg-white">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-semibold text-gray-800">
                          {habit.label}
                        </span>
                        {habit.completed && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            Done today
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 italic">
                        {socialContext}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quick log button */}
                      <button
                        onClick={() => toggleHabit(habit.id)}
                        disabled={savingId === habit.id}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                          habit.completed
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-primary-100 hover:text-primary-600'
                        }`}
                      >
                        {savingId === habit.id ? '...' : habit.completed ? '✓' : '+'}
                      </button>

                      {/* Expand button */}
                      <button
                        onClick={() => toggleExpanded(habit.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
                      >
                        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Historical view (expandable) */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200 animate-fadeIn">
                      <div className="pt-3">
                        <p className="text-xs font-medium text-gray-600 mb-3">Past 7 days (not including today)</p>
                        <div className="grid grid-cols-7 gap-1">
                          {history.map((log) => {
                            return (
                              <div
                                key={log.date}
                                className="flex flex-col items-center gap-1"
                              >
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                    log.completed
                                      ? 'bg-primary-500 text-white'
                                      : 'bg-gray-200 text-gray-400'
                                  }`}
                                >
                                  {log.completed ? '✓' : '·'}
                                </div>
                                <span className="text-xs text-gray-500 text-center">
                                  {getDayLabel(log.date)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gentle Insight */}
      {insight && !loading && (
        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl shadow-soft p-6 border border-primary-100">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💝</span>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                A gentle reminder
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {insight}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
