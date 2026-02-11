'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChatInterface from '@/components/ChatInterface';
import FriendList from '@/components/FriendList';
import Notifications from '@/components/Notifications';
import ChatTab from '@/components/tabs/ChatTab';
import MapTab from '@/components/tabs/MapTab';
import JournalTab from '@/components/tabs/JournalTab';
import HabitsTab from '@/components/tabs/HabitsTab';
import BabyJourneyTab from '@/components/tabs/BabyJourneyTab';

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
      className="relative px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-md transition-all duration-200 flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {notificationCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
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
      className="relative px-4 py-2.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-xl font-medium hover:shadow-md transition-all duration-200 flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
      Requests
      {requestCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
          {requestCount}
        </span>
      )}
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [showFriends, setShowFriends] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'map' | 'journal' | 'habits' | 'babyJourney'>('babyJourney');
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-accent-50/30 flex">
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
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-primary-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg">
              {user?.real_name?.charAt(0) || 'B'}
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Harbour
              </h1>
              <p className="text-xs text-gray-500">Welcome back, {user?.real_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationButton onOpenNotifications={() => setShowNotifications(true)} />
            <FriendRequestButton onOpenFriends={() => setShowFriends(true)} />
            <button
              onClick={() => setShowFriends(!showFriends)}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-md transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Friends
            </button>
            <Link
              href="/profile/edit"
              className="px-4 py-2 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 text-sm font-medium transition-all border border-primary-100"
            >
              Edit Profile
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                router.push('/');
              }}
              className="px-4 py-2 bg-primary-50 text-primary-700 rounded-xl hover:bg-primary-100 text-sm font-medium transition-all border border-primary-100"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Feature Tabs - In-page navigation */}
        <div className="sticky top-0 z-20 px-6 pt-3 pb-2 bg-white/80 backdrop-blur-sm border-b border-primary-100">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('babyJourney')}
              className={`px-4 py-2 text-sm rounded-full font-medium transition-all border ${
                activeTab === 'babyJourney'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-500 shadow-sm'
                  : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50 hover:border-primary-300'
              }`}
            >
              Baby Journey
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 text-sm rounded-full font-medium transition-all border ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-500 shadow-sm'
                  : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50 hover:border-primary-300'
              }`}
            >
              Anonymous Chat
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 text-sm rounded-full font-medium transition-all border ${
                activeTab === 'map'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-500 shadow-sm'
                  : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50 hover:border-primary-300'
              }`}
            >
              Presence Map
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-4 py-2 text-sm rounded-full font-medium transition-all border ${
                activeTab === 'journal'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-500 shadow-sm'
                  : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50 hover:border-primary-300'
              }`}
            >
              Journal
            </button>
            <button
              onClick={() => setActiveTab('habits')}
              className={`px-4 py-2 text-sm rounded-full font-medium transition-all border ${
                activeTab === 'habits'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-primary-500 shadow-sm'
                  : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50 hover:border-primary-300'
              }`}
            >
              Habits
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'chat' && (
            <ChatTab onMatchAccepted={(session) => setActiveChat(session)} />
          )}
          
          {activeTab === 'map' && <MapTab />}
          
          {activeTab === 'journal' && <JournalTab isActive={activeTab === 'journal'} />}

          {activeTab === 'habits' && <HabitsTab isActive={activeTab === 'habits'} />}

          {activeTab === 'babyJourney' && <BabyJourneyTab isActive={activeTab === 'babyJourney'} />}
        </div>
      </div>

      {/* Bottom-right hotline button */}
      <a
        href="tel:+6599990000"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all"
      >
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 border border-white/20">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.25 6.75C2.25 5.507 3.257 4.5 4.5 4.5h2.25c.621 0 1.152.363 1.38.923l1.103 2.758a1.5 1.5 0 01-.376 1.636l-1.21 1.21a.75.75 0 000 1.06 11.25 11.25 0 004.242 2.778.75.75 0 00.806-.162l1.346-1.346a1.5 1.5 0 011.487-.375l2.758 1.103c.56.224.923.759.923 1.38V19.5c0 1.243-1.007 2.25-2.25 2.25h-.75C9.473 21.75 2.25 14.527 2.25 5.25v1.5z"
            />
          </svg>
        </span>
      </a>
    </div>
  );
}

