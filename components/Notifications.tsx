'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'friend_request' | 'friend_message';
  title: string;
  message: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  onClick?: () => void;
}

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFriend?: (friendId: string) => void;
  onSelectChat?: (sessionId: string) => void;
}

export default function Notifications({ isOpen, onClose, onSelectFriend, onSelectChat }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Get friend requests
      const requestsResponse = await fetch('/api/friend-requests?type=received', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const requestsData = await requestsResponse.json();
      
      // Get unread messages from friends
      const messagesResponse = await fetch('/api/notifications/messages', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const messagesData = await messagesResponse.ok ? await messagesResponse.json() : { messages: [] };

      const notifs: Notification[] = [];

      // Add friend request notifications
      if (requestsData.requests) {
        requestsData.requests.forEach((req: any) => {
          notifs.push({
            id: `fr-${req.request_id}`,
            type: 'friend_request',
            title: 'Friend Request',
            message: `${req.otherUser?.realName || 'Someone'} wants to be friends`,
            timestamp: req.created_at,
            userId: req.sender_id,
            onClick: () => {
              onSelectFriend?.(req.sender_id);
              onClose();
            },
          });
        });
      }

      // Add friend message notifications
      if (messagesData.messages) {
        messagesData.messages.forEach((msg: any) => {
          notifs.push({
            id: `msg-${msg.message_id}`,
            type: 'friend_message',
            title: 'New Message',
            message: `${msg.senderName}: ${msg.message_text.substring(0, 50)}${msg.message_text.length > 50 ? '...' : ''}`,
            timestamp: msg.sent_at,
            sessionId: msg.session_id,
            onClick: () => {
              onSelectChat?.(msg.session_id);
              onClose();
            },
          });
        });
      }

      // Sort by timestamp (newest first)
      notifs.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(notifs);
    } catch (error) {
      toast.error('Error loading notifications');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:z-auto">
      <div className="absolute inset-0 bg-black bg-opacity-50 lg:hidden" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl lg:relative lg:shadow-md border-l border-gray-100">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-accent-50 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Notifications</h2>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-white transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-80px)]">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No notifications</p>
              <p className="text-sm text-gray-500 mt-2">You're all caught up!</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={notif.onClick}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    notif.type === 'friend_request'
                      ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                      : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notif.type === 'friend_request'
                        ? 'bg-yellow-200'
                        : 'bg-blue-200'
                    }`}>
                      {notif.type === 'friend_request' ? (
                        <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-sm mb-1">{notif.title}</div>
                      <div className="text-sm text-gray-700 mb-2">{notif.message}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(notif.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

