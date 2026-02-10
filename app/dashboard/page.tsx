'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChatInterface from '@/components/ChatInterface';
import MatchInterface from '@/components/MatchInterface';
import FriendList from '@/components/FriendList';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [showFriends, setShowFriends] = useState(false);
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

        {/* Match Interface */}
        <MatchInterface
          onMatchAccepted={(session) => setActiveChat(session)}
        />
      </div>
    </div>
  );
}

