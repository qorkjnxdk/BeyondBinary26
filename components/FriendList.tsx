'use client';

import { useState, useEffect } from 'react';

interface Friend {
  userId: string;
  realName: string;
  visibleProfile: Record<string, any>;
  lastActive?: number;
  createdAt: number;
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
  const [search, setSearch] = useState('');

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    if (isOpen) {
      loadFriends();
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
      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl lg:relative lg:shadow-none">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Friends</h2>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <div className="overflow-y-auto h-[calc(100vh-140px)]">
          {onlineFriends.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Online</h3>
              {onlineFriends.map((friend) => (
                <div
                  key={friend.userId}
                  onClick={() => onSelectFriend(friend.userId)}
                  className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-3 mb-2"
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <div className="flex-1">
                    <div className="font-medium">{friend.realName}</div>
                    <div className="text-sm text-gray-500">Online</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {offlineFriends.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Offline</h3>
              {offlineFriends.map((friend) => (
                <div
                  key={friend.userId}
                  onClick={() => onSelectFriend(friend.userId)}
                  className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-3 mb-2"
                >
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                  <div className="flex-1">
                    <div className="font-medium">{friend.realName}</div>
                    <div className="text-sm text-gray-500">
                      {friend.lastActive
                        ? `Last active: ${new Date(friend.lastActive).toLocaleDateString()}`
                        : 'Never'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredFriends.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {search ? 'No friends found' : 'No friends yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

