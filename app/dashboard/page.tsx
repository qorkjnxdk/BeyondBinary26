'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-pink-600">Beyond Binary</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFriends(!showFriends)}
              className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200"
            >
              Friends
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{user?.real_name}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  sessionStorage.removeItem('token');
                  router.push('/');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                Logout
              </button>
            </div>
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

