'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChatInterface from '@/components/ChatInterface';
import MatchInterface from '@/components/MatchInterface';
import FriendList from '@/components/FriendList';
import Notifications from '@/components/Notifications';
import PresenceMap from '@/components/PresenceMap';
import type { HabitType } from '@/lib/habits';

function NotificationButton({ onOpenNotifications }: { onOpenNotifications: () => void }) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    const loadNotifications = () => {
      Promise.all([
        fetch('/api/friend-requests?type=received', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => res.json()).then(data => data.requests?.length || 0),
        fetch('/api/notifications/messages', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : { messages: [] }).then(data => data.messages?.length || 0).catch(() => 0),
      ]).then(([requestCount, messageCount]) => {
        setNotificationCount(requestCount + messageCount);
      }).catch(console.error)
      .finally(() => setLoading(false));
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading || notificationCount === 0) return null;

  return (
    <button
      onClick={onOpenNotifications}
      className="relative px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {notificationCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {notificationCount}
        </span>
      )}
    </button>
  );
}

function FriendRequestButton({ onOpenFriends }: { onOpenFriends: () => void }) {
  const [requestCount, setRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;

    const loadRequests = () => {
      fetch('/api/friend-requests?type=received', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.requests) {
            setRequestCount(data.requests.length);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    loadRequests();
    const interval = setInterval(loadRequests, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading || requestCount === 0) return null;

  return (
    <button
      onClick={onOpenFriends}
      className="relative px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
      Requests
      {requestCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {requestCount}
        </span>
      )}
    </button>
  );
}

interface JournalEntry {
  entry_id: string;
  content: string;
  sentiment: number | null;
  created_at: number;
}

interface HabitSummary {
  id: HabitType;
  label: string;
  completed: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [showFriends, setShowFriends] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'map' | 'journal' | 'habits'>('chat');
  const [loading, setLoading] = useState(true);
  
  // Journal state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalContent, setJournalContent] = useState('');
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalSaving, setJournalSaving] = useState(false);
  
  // Habits state
  const [habits, setHabits] = useState<HabitSummary[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(false);
  const [habitSavingId, setHabitSavingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Get user profile
    fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push('/auth/login');
        }
      })
      .catch(() => router.push('/auth/login'))
      .finally(() => setLoading(false));
  }, [router]);

  // Check for active session
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    fetch('/api/chat', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.session) {
          setActiveChat(data.session);
        }
      })
      .catch(console.error);
  }, [user]);

  // Load journal entries when journal tab is active
  useEffect(() => {
    if (activeTab !== 'journal' || !user) return;
    
    setJournalLoading(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    fetch('/api/journal', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.entries) setJournalEntries(data.entries);
      })
      .finally(() => setJournalLoading(false));
  }, [activeTab, user]);

  // Load habits when habits tab is active
  useEffect(() => {
    if (activeTab !== 'habits' || !user) return;
    
    setHabitsLoading(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    fetch('/api/habits', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.habits) setHabits(data.habits);
      })
      .finally(() => setHabitsLoading(false));
  }, [activeTab, user]);

  // Journal handlers
  const handleSaveJournal = async () => {
    if (!journalContent.trim()) return;
    setJournalSaving(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: journalContent }),
      });
      const data = await res.json();
      if (res.ok && data.entry) {
        setJournalEntries([data.entry, ...journalEntries]);
        setJournalContent('');
      } else {
        alert(data.error || 'Failed to save entry');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving entry');
    } finally {
      setJournalSaving(false);
    }
  };

  const sentimentLabel = (score: number | null) => {
    if (score === null) return '';
    if (score > 0) return 'Gentle positive tone';
    if (score < 0) return 'Sounds heavy today';
    return 'Neutral tone';
  };

  // Habits handlers
  const toggleHabit = async (habitId: HabitType) => {
    setHabitSavingId(habitId);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
        // Reload habits
        fetch('/api/habits', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(data => {
            if (data.habits) setHabits(data.habits);
          });
      }
    } catch (e) {
      console.error(e);
      alert('Error logging habit');
    } finally {
      setHabitSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-soft">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your space...</p>
        </div>
      </div>
    );
  }

  if (activeChat) {
    return (
      <ChatInterface
        session={activeChat}
        user={user}
        onChatEnd={() => setActiveChat(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Friend List Sidebar */}
      <FriendList
        isOpen={showFriends}
        onClose={() => setShowFriends(false)}
        onSelectFriend={(friendId) => {
          // Handle friend chat selection
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          // Get or create friend chat session
          fetch(`/api/chat?friendId=${friendId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
            .then(res => res.json())
            .then(data => {
              if (data.session) {
                setActiveChat(data.session);
              }
            });
        }}
      />

      {/* Notifications Sidebar */}
      <Notifications
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onSelectFriend={(friendId) => {
          setShowFriends(true);
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          fetch(`/api/chat?friendId=${friendId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
            .then(res => res.json())
            .then(data => {
              if (data.session) {
                setActiveChat(data.session);
              }
            });
        }}
        onSelectChat={(sessionId) => {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          fetch(`/api/chat?sessionId=${sessionId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
            .then(res => res.json())
            .then(data => {
              if (data.session) {
                setActiveChat(data.session);
              }
            });
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg">
              {user?.real_name?.charAt(0) || 'B'}
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Beyond Binary
              </h1>
              <p className="text-xs text-gray-500">Welcome back, {user?.real_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationButton onOpenNotifications={() => setShowNotifications(true)} />
            <FriendRequestButton onOpenFriends={() => setShowFriends(true)} />
            <button
              onClick={() => setShowFriends(!showFriends)}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Friends
            </button>
            <Link
              href="/profile/edit"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium transition-all"
            >
              Edit Profile
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                router.push('/');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium transition-all"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Feature Tabs - In-page navigation */}
        <div className="sticky top-0 z-20 px-6 pt-3 pb-2 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 text-sm rounded-full font-semibold transition-all border ${
                activeTab === 'chat'
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Anonymous Chat
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 text-sm rounded-full font-semibold transition-all border ${
                activeTab === 'map'
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Presence Map
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-4 py-2 text-sm rounded-full font-semibold transition-all border ${
                activeTab === 'journal'
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Journal
            </button>
            <button
              onClick={() => setActiveTab('habits')}
              className={`px-4 py-2 text-sm rounded-full font-semibold transition-all border ${
                activeTab === 'habits'
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Habits
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'chat' && (
            <MatchInterface
              onMatchAccepted={(session) => setActiveChat(session)}
            />
          )}
          
          {activeTab === 'map' && (
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
          )}
          
          {activeTab === 'journal' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl shadow-soft p-8 border border-gray-100 mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
                  Private Journal
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  A quiet space just for you. Nothing here is shared or used for matching.
                </p>
                <textarea
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="How are you really feeling today?"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900 placeholder-gray-400 min-h-[120px]"
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSaveJournal}
                    disabled={journalSaving || !journalContent.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {journalSaving ? 'Saving...' : 'Save Entry'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {journalLoading ? (
                  <p className="text-gray-600">Loading entries...</p>
                ) : journalEntries.length === 0 ? (
                  <p className="text-gray-500">No entries yet. Start with a small note to yourself.</p>
                ) : (
                  journalEntries.map((entry) => (
                    <div key={entry.entry_id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                        {entry.sentiment !== null && (
                          <span className="text-xs font-medium text-gray-600">
                            {sentimentLabel(entry.sentiment)}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 whitespace-pre-line text-sm leading-relaxed">{entry.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'habits' && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl shadow-soft p-8 border border-gray-100 mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
                  Gentle Habit Check-in
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Small physical check-ins that support your mood. No streaks, no pressure.
                </p>

                {habitsLoading ? (
                  <p className="text-gray-600">Loading habits...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {habits.map(habit => (
                      <button
                        key={habit.id}
                        onClick={() => toggleHabit(habit.id)}
                        disabled={habitSavingId === habit.id}
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
          )}
        </div>
      </div>
    </div>
  );
}

