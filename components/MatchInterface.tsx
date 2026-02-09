'use client';

import { useState, useEffect } from 'react';

interface Match {
  userId: string;
  randomName: string;
  similarityScore: number;
  visibleProfile: Record<string, any>;
}

export default function MatchInterface({ onMatchAccepted }: { onMatchAccepted: (session: any) => void }) {
  const [prompt, setPrompt] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  const findMatches = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.matches) {
        setMatches(data.matches);
      }
    } catch (error) {
      console.error('Error finding matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (receiverId: string) => {
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          receiverId,
          promptText: prompt,
        }),
      });

      const data = await response.json();
      if (data.invite) {
        loadInvites();
      }
    } catch (error) {
      console.error('Error sending invite:', error);
    }
  };

  const loadInvites = async () => {
    try {
      const response = await fetch('/api/invites?type=received', {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.invites) {
        setInvites(data.invites);
      }
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  };

  const acceptInvite = async (inviteId: string) => {
    try {
      const response = await fetch('/api/invites', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          inviteId,
          action: 'accept',
        }),
      });

      const data = await response.json();
      if (data.session) {
        onMatchAccepted(data.session);
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
    }
  };

  const declineInvite = async (inviteId: string) => {
    try {
      await fetch('/api/invites', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          inviteId,
          action: 'decline',
        }),
      });
      loadInvites();
    } catch (error) {
      console.error('Error declining invite:', error);
    }
  };

  useEffect(() => {
    loadInvites();
    const interval = setInterval(loadInvites, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="w-full space-y-6">
        {/* Prompt Input */}
        <div className="bg-white rounded-2xl shadow-soft p-6 md:p-8 border border-gray-100 card-hover">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What's on your mind?</h2>
            <p className="text-gray-600">Share what you'd like to talk about and find like-minded women</p>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={280}
            placeholder="e.g., Need advice on dealing with difficult boss, Want to talk about work-life balance, Looking for hiking buddies..."
            className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none resize-none text-gray-900 placeholder-gray-400"
            rows={4}
          />
          <div className="flex items-center justify-between mt-4">
            <span className={`text-sm font-medium ${prompt.length > 250 ? 'text-red-500' : 'text-gray-500'}`}>
              {prompt.length}/280
            </span>
            <button
              onClick={findMatches}
              disabled={loading || !prompt.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Finding Matches...
                </span>
              ) : (
                'Find Matches'
              )}
            </button>
          </div>
        </div>

        {/* Incoming Invites */}
        {invites.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl p-6 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-bold text-gray-900">Incoming Invites</h3>
            </div>
            <div className="space-y-3">
              {invites.map((invite) => (
                <div key={invite.invite_id} className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{invite.otherUser?.randomName || 'Someone'}</p>
                      <p className="text-sm text-gray-600 mt-1">{invite.prompt_text}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => acceptInvite(invite.invite_id)}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => declineInvite(invite.invite_id)}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Results */}
        {matches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {matches.length} {matches.length === 1 ? 'Match' : 'Matches'} Found
              </h3>
              <div className="text-sm text-gray-500">Online now</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {matches.map((match) => (
                <div key={match.userId} className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100 card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-lg">
                      {match.randomName.charAt(0)}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">{match.similarityScore}%</div>
                      <div className="text-xs text-gray-500">match</div>
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-3">{match.randomName}</h4>
                  <div className="text-sm text-gray-600 space-y-2 mb-5">
                    {Object.entries(match.visibleProfile).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700 capitalize">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => sendInvite(match.userId)}
                    className="w-full btn-primary"
                  >
                    Invite to Chat
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {matches.length === 0 && !loading && prompt && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-soft border border-gray-100">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No matches online right now</p>
            <p className="text-sm text-gray-500 mt-2">Try again later or adjust your prompt</p>
          </div>
        )}
      </div>
    </div>
  );
}

