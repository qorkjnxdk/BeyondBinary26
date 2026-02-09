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
    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">
      <div className="w-full space-y-6">
        {/* Prompt Input */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">What would you like to talk about?</h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={280}
            placeholder="e.g., Need advice on dealing with difficult boss..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
            rows={3}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-500">{prompt.length}/280</span>
            <button
              onClick={findMatches}
              disabled={loading || !prompt.trim()}
              className="px-6 py-2 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Finding Matches...' : 'Find Matches'}
            </button>
          </div>
        </div>

        {/* Incoming Invites */}
        {invites.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Incoming Invites</h3>
            {invites.map((invite) => (
              <div key={invite.invite_id} className="bg-white rounded p-4 mb-2">
                <p className="font-medium">{invite.otherUser?.randomName || 'Someone'}</p>
                <p className="text-sm text-gray-600 mb-2">{invite.prompt_text}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptInvite(invite.invite_id)}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineInvite(invite.invite_id)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Match Results */}
        {matches.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {matches.length} {matches.length === 1 ? 'match' : 'matches'} found online
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <div key={match.userId} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{match.randomName}</h4>
                    <span className="text-sm text-pink-600 font-medium">
                      {match.similarityScore}% match
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    {Object.entries(match.visibleProfile).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium capitalize">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => sendInvite(match.userId)}
                    className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                  >
                    Invite to Chat
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {matches.length === 0 && !loading && prompt && (
          <div className="text-center text-gray-500 py-8">
            No matches online right now. Try again later or adjust your prompt.
          </div>
        )}
      </div>
    </div>
  );
}

