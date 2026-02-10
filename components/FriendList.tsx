'use client';

import { useState, useEffect } from 'react';

interface Friend {
  userId: string;
  realName: string;
  visibleProfile: Record<string, any>;
  lastActive?: number;
  createdAt: number;
}

interface FriendRequest {
  request_id: string;
  sender_id: string;
  receiver_id: string;
  otherUser: {
    userId: string;
    realName: string;
  };
  created_at: number;
}

export default function FriendList({
  isOpen,
  onClose,
  onSelectFriend,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectFriend: (friendId: string) => void;
}) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    if (isOpen) {
      loadFriends();
      loadFriendRequests();
      loadUnreadCounts();
      
      // Refresh unread counts every 5 seconds
      const interval = setInterval(loadUnreadCounts, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadFriends = async () => {
    try {
      const response = await fetch('/api/friends', {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.friends) {
        setFriends(data.friends);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    const confirmed = window.confirm(`Remove ${friendName} as a friend? This will also delete your chat history with her.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/friends?friendId=${encodeURIComponent(friendId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to remove friend:', data);
        alert(data.error || 'Failed to remove friend');
        return;
      }
      // Refresh friends + unread counts
      loadFriends();
      loadUnreadCounts();
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('An error occurred while removing friend. Please try again.');
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await fetch('/api/friend-requests?type=received', {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.requests) {
        setFriendRequests(data.requests);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      const response = await fetch('/api/friends/unread', {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.unreadCounts) {
        setUnreadCounts(data.unreadCounts);
      }
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/friend-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          requestId,
          action: 'accept',
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Reload friends and requests
        loadFriends();
        loadFriendRequests();
      } else {
        alert(data.error || 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('An error occurred while accepting friend request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/friend-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          requestId,
          action: 'decline',
        }),
      });

      if (response.ok) {
        // Reload requests
        loadFriendRequests();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to decline friend request');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      alert('An error occurred while declining friend request');
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.realName.toLowerCase().includes(search.toLowerCase())
  );

  const onlineFriends = filteredFriends.filter(friend => {
    if (!friend.lastActive) return false;
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return friend.lastActive > fiveMinutesAgo;
  });

  const offlineFriends = filteredFriends.filter(friend => {
    if (!friend.lastActive) return true;
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return friend.lastActive <= fiveMinutesAgo;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:z-auto">
      <div className="absolute inset-0 bg-black bg-opacity-50 lg:hidden" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl lg:relative lg:shadow-md border-l border-gray-100">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-accent-50 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Friends</h2>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-white transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none bg-white"
          />
        </div>

        <div className="overflow-y-auto h-[calc(100vh-180px)]">
          {/* Friend Requests Section */}
          {friendRequests.length > 0 && (
            <div className="p-4 border-b border-gray-200 bg-yellow-50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Friend Requests ({friendRequests.length})</h3>
              </div>
              {friendRequests.map((request) => (
                <div
                  key={request.request_id}
                  className="p-4 rounded-xl bg-white border-2 border-yellow-200 mb-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {request.otherUser.realName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 truncate">{request.otherUser.realName}</div>
                      <div className="text-xs text-gray-500">wants to be friends</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.request_id)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request.request_id)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {onlineFriends.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Online</h3>
              </div>
              {onlineFriends.map((friend) => (
                <div
                  key={friend.userId}
                  className="p-4 rounded-xl hover:bg-gray-50 flex items-center gap-4 mb-3 transition-all border border-transparent hover:border-gray-200 hover:shadow-sm relative"
                >
                  <div
                    onClick={() => onSelectFriend(friend.userId)}
                    className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {friend.realName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 truncate">{friend.realName}</div>
                      <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Online now
                      </div>
                    </div>
                  </div>
                  {unreadCounts[friend.userId] && unreadCounts[friend.userId] > 0 && (
                    <div className="absolute top-2 right-10 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                      {unreadCounts[friend.userId] > 9 ? '9+' : unreadCounts[friend.userId]}
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveFriend(friend.userId, friend.realName)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {offlineFriends.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wide">Offline</h3>
              {offlineFriends.map((friend) => (
                <div
                  key={friend.userId}
                  className="p-4 rounded-xl hover:bg-gray-50 flex items-center gap-4 mb-3 transition-all border border-transparent hover:border-gray-200 hover:shadow-sm relative"
                >
                  <div
                    onClick={() => onSelectFriend(friend.userId)}
                    className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg flex-shrink-0">
                      {friend.realName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 truncate">{friend.realName}</div>
                      <div className="text-sm text-gray-500">
                        {friend.lastActive
                          ? `Last active ${new Date(friend.lastActive).toLocaleDateString()}`
                          : 'Never active'}
                      </div>
                    </div>
                  </div>
                  {unreadCounts[friend.userId] && unreadCounts[friend.userId] > 0 && (
                    <div className="absolute top-2 right-10 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                      {unreadCounts[friend.userId] > 9 ? '9+' : unreadCounts[friend.userId]}
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveFriend(friend.userId, friend.realName)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {filteredFriends.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">{search ? 'No friends found' : 'No friends yet'}</p>
              <p className="text-sm text-gray-500 mt-2">{search ? 'Try a different search' : 'Start chatting to make friends!'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

