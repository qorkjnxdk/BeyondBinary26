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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onChatEnd()}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
          <div>
            <h2 className="font-semibold">{otherUserName}</h2>
            {minimumTimeMet ? (
              <span className="text-sm text-gray-500">Minimum time reached</span>
            ) : (
              <span className="text-sm text-gray-500">Time remaining: {formatTime(timeRemaining)}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100">
            Report
          </button>
          <button className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
            Block
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isMine = message.sender_id === user.user_id;
          return (
            <div
              key={message.message_id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isMine
                    ? 'bg-pink-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {isMine ? session.myRandomName : otherUserName}
                </div>
                <div>{message.message_text}</div>
                <div className={`text-xs mt-1 ${isMine ? 'text-pink-100' : 'text-gray-500'}`}>
                  {format(new Date(message.sent_at), 'HH:mm')}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        {showContinuePrompt && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="mb-2 font-medium">Continue chatting?</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleContinueChat(true)}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              >
                Yes
              </button>
              <button
                onClick={() => handleContinueChat(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                No
              </button>
            </div>
          </div>
        )}

        {earlyExitApproval?.waiting && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm">Request sent. Waiting for approval...</p>
          </div>
        )}

        {earlyExitApproval && !earlyExitApproval.waiting && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="mb-2 font-medium">
              {otherUserName} wants to leave early. Approve?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleEarlyExitApproval(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Yes
              </button>
              <button
                onClick={() => handleEarlyExitApproval(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                No
              </button>
            </div>
          </div>
        )}

        {showFriendPrompt && (
          <div className="mb-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
            <p className="mb-2 font-medium">Would you like to add {otherUserName} as a friend?</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleFriendPrompt(true)}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              >
                Yes
              </button>
              <button
                onClick={() => handleFriendPrompt(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                No
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            disabled={showContinuePrompt || showFriendPrompt}
          />
          <button
            onClick={sendMessage}
            disabled={!messageText.trim() || showContinuePrompt || showFriendPrompt}
            className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        {!minimumTimeMet && (
          <button
            onClick={handleEarlyExit}
            disabled={earlyExitRequested}
            className="mt-2 w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50"
          >
            Leave Early
          </button>
        )}
      </div>
    </div>
  );
}

