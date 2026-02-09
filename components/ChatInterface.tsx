'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

interface ChatInterfaceProps {
  session: any;
  user: any;
  onChatEnd: () => void;
}

export default function ChatInterface({ session, user, onChatEnd }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [minimumTimeMet, setMinimumTimeMet] = useState(false);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [showFriendPrompt, setShowFriendPrompt] = useState(false);
  const [earlyExitRequested, setEarlyExitRequested] = useState(false);
  const [earlyExitApproval, setEarlyExitApproval] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 1000); // Poll every second
    return () => clearInterval(interval);
  }, [session.session_id]);

  useEffect(() => {
    // Timer countdown
    const elapsed = Math.floor((Date.now() - session.started_at) / 1000);
    const remaining = Math.max(0, 600 - elapsed);
    setTimeRemaining(remaining);

    if (remaining === 0 && !minimumTimeMet) {
      setMinimumTimeMet(true);
      setShowContinuePrompt(true);
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - session.started_at) / 1000);
      const remaining = Math.max(0, 600 - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0 && !minimumTimeMet) {
        setMinimumTimeMet(true);
        setShowContinuePrompt(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.started_at, minimumTimeMet]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat?sessionId=${session.session_id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          sessionId: session.session_id,
          messageText: messageText.trim(),
        }),
      });
      setMessageText('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleContinueChat = async (continueChat: boolean) => {
    if (!continueChat) {
      await endChat(false);
    } else {
      setShowContinuePrompt(false);
      // Mark minimum time as met
      await fetch('/api/chat', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          sessionId: session.session_id,
          action: 'mark-minimum-time',
        }),
      });
    }
  };

  const handleEarlyExit = async () => {
    if (timeRemaining > 0) {
      setEarlyExitRequested(true);
      // Request early exit
      const response = await fetch('/api/chat', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          sessionId: session.session_id,
          action: 'early-exit-request',
        }),
      });
      const data = await response.json();
      if (data.requiresApproval) {
        // Wait for other user's approval
        setEarlyExitApproval({ waiting: true });
      }
    } else {
      await endChat(false);
    }
  };

  const handleEarlyExitApproval = async (approved: boolean) => {
    await fetch('/api/chat', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        sessionId: session.session_id,
        action: 'early-exit-approval',
        data: { approved },
      }),
    });

    if (approved) {
      await endChat(false);
    } else {
      setEarlyExitRequested(false);
      setEarlyExitApproval(null);
    }
  };

  const endChat = async (becameFriends: boolean) => {
    await fetch('/api/chat', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        sessionId: session.session_id,
        action: 'end',
        data: { becameFriends },
      }),
    });

    if (becameFriends) {
      setShowFriendPrompt(true);
    } else {
      onChatEnd();
    }
  };

  const handleFriendPrompt = async (wantToBeFriends: boolean) => {
    // This would need to be handled with the other user's response
    // For now, just end the chat
    await endChat(wantToBeFriends);
    onChatEnd();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const otherUserName = session.otherRandomName || 'Unknown';

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onChatEnd()}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold">
            {otherUserName.charAt(0)}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{otherUserName}</h2>
            {minimumTimeMet ? (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Minimum time reached
              </span>
            ) : (
              <span className="text-xs text-gray-500 font-medium">Time remaining: <span className="text-primary-600 font-bold">{formatTime(timeRemaining)}</span></span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm bg-red-50 text-red-700 rounded-xl hover:bg-red-100 font-medium transition-all border border-red-200">
            Report
          </button>
          <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-all">
            Block
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500">Start the conversation...</p>
            </div>
          </div>
        )}
        {messages.map((message) => {
          const isMine = message.sender_id === user.user_id;
          return (
            <div
              key={message.message_id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2`}
            >
              {!isMine && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-300 to-accent-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {otherUserName.charAt(0)}
                </div>
              )}
              <div
                className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-sm ${
                  isMine
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-br-md'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                }`}
              >
                {!isMine && (
                  <div className="text-xs font-bold mb-1 text-gray-600">{otherUserName}</div>
                )}
                <div className={`${isMine ? 'text-white' : 'text-gray-900'} leading-relaxed`}>{message.message_text}</div>
                <div className={`text-xs mt-2 ${isMine ? 'text-primary-100' : 'text-gray-500'}`}>
                  {format(new Date(message.sent_at), 'HH:mm')}
                </div>
              </div>
              {isMine && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {session.myRandomName.charAt(0)}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 p-6 shadow-lg">
        {showContinuePrompt && (
          <div className="mb-4 p-5 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl shadow-sm">
            <p className="mb-3 font-bold text-gray-900">Continue chatting?</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleContinueChat(true)}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Yes, Continue
              </button>
              <button
                onClick={() => handleContinueChat(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all"
              >
                End Chat
              </button>
            </div>
          </div>
        )}

        {earlyExitApproval?.waiting && (
          <div className="mb-4 p-5 bg-blue-50 border-2 border-blue-300 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-medium text-blue-900">Request sent. Waiting for approval...</p>
            </div>
          </div>
        )}

        {earlyExitApproval && !earlyExitApproval.waiting && (
          <div className="mb-4 p-5 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl">
            <p className="mb-3 font-bold text-gray-900">
              {otherUserName} wants to leave early. Approve?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleEarlyExitApproval(true)}
                className="flex-1 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-md"
              >
                Approve
              </button>
              <button
                onClick={() => handleEarlyExitApproval(false)}
                className="flex-1 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md"
              >
                Deny
              </button>
            </div>
          </div>
        )}

        {showFriendPrompt && (
          <div className="mb-4 p-5 bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-300 rounded-2xl">
            <p className="mb-3 font-bold text-gray-900">Would you like to add {otherUserName} as a friend?</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleFriendPrompt(true)}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Yes, Add Friend
              </button>
              <button
                onClick={() => handleFriendPrompt(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all"
              >
                No Thanks
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900 placeholder-gray-400"
            disabled={showContinuePrompt || showFriendPrompt}
          />
          <button
            onClick={sendMessage}
            disabled={!messageText.trim() || showContinuePrompt || showFriendPrompt}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send
          </button>
        </div>

        {!minimumTimeMet && (
          <button
            onClick={handleEarlyExit}
            disabled={earlyExitRequested}
            className="mt-3 w-full px-4 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 disabled:opacity-50 font-medium border-2 border-red-200 transition-all"
          >
            Leave Early
          </button>
        )}
      </div>
    </div>
  );
}

