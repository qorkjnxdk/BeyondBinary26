'use client';

import { useState, useEffect, useRef } from 'react';
import { initializeSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

interface Match {
  userId: string;
  randomName: string;
  similarityScore: number;
  visibleProfile: Record<string, any>;
  otherUserPrompt?: string | null;
}

export default function MatchInterface({ onMatchAccepted }: { onMatchAccepted: (session: any) => void }) {
  const [prompt, setPrompt] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false); // Track if user is in matching mode
  const socketRef = useRef<Socket | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  // Load prompt from localStorage on mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem('currentPrompt');
    if (savedPrompt) {
      setPrompt(savedPrompt);
      // Check if we're still in matching mode
      checkMatchingStatus();
    }
  }, []);

  // Check for URL parameter prompt (takes precedence)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const promptParam = urlParams.get('prompt');
    if (promptParam) {
      setPrompt(promptParam);
      // Clear URL parameter to avoid re-triggering
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
  }, []);

  const checkMatchingStatus = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/matches', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.prompt) {
        setIsSearching(true);
        setMatches(data.matches || []);
        setPrompt(data.prompt);
        localStorage.setItem('currentPrompt', data.prompt);
        startAutoRefresh();
      }
    } catch (error) {
      console.error('Error checking matching status:', error);
    }
  };

  const startAutoRefresh = () => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Refresh every 2 seconds
    refreshIntervalRef.current = setInterval(async () => {
      await refreshMatches();
    }, 2000);
  };

  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  const refreshMatches = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/matches', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.matches) {
        setMatches(data.matches);
      }
    } catch (error) {
      console.error('Error refreshing matches:', error);
    }
  };

  const leaveMatching = async () => {
    try {
      const token = getToken();
      if (!token) return;

      await fetch('/api/matches', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Clear state
      setIsSearching(false);
      setMatches([]);
      setPrompt('');
      localStorage.removeItem('currentPrompt');
      stopAutoRefresh();
    } catch (error) {
      console.error('Error leaving matching mode:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoRefresh();
    };
  }, []);

  const findMatches = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt to find matches.');
      return;
    }
    
    setLoading(true);
    setMatches([]); // Clear previous matches
    
    try {
      const token = getToken();
      if (!token) {
        alert('You must be logged in to find matches.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error finding matches:', data.error, data.details);
        alert(data.error || data.details || 'Failed to find matches. Please try again.');
        setLoading(false);
        return;
      }

      if (data.matches && Array.isArray(data.matches)) {
        setMatches(data.matches);
        // Save prompt to localStorage
        localStorage.setItem('currentPrompt', prompt.trim());
        // Enter matching mode
        setIsSearching(true);
        // Start auto-refresh
        startAutoRefresh();
        
        if (data.matches.length === 0) {
          console.log('No matches found');
        }
      } else {
        setMatches([]);
      }
    } catch (error: any) {
      console.error('Error finding matches:', error);
      alert(`An error occurred while finding matches: ${error.message || 'Unknown error'}. Please try again.`);
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
      
      if (!response.ok) {
        console.error('Error accepting invite:', data.error || 'Unknown error');
        alert(data.error || 'Failed to accept invite. Please try again.');
        return;
      }

      if (data.session) {
        // Clear matching status and stop auto-refresh
        await leaveMatching();
        onMatchAccepted(data.session);
      } else {
        console.error('No session returned from accept invite');
        alert('Failed to start chat. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      alert('An error occurred. Please try again.');
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

  const checkForActiveSession = async () => {
    try {
      const response = await fetch('/api/chat', {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.session) {
        // Someone accepted our invite and a session was created
        onMatchAccepted(data.session);
      }
    } catch (error) {
      console.error('Error checking for active session:', error);
    }
  };

  useEffect(() => {
    loadInvites(); // Initial load
    checkForActiveSession(); // Check immediately

    let mounted = true;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    async function setupSocket() {
      try {
        const socket = await initializeSocket();
        if (!mounted) return;

        socketRef.current = socket;

        // Listen for incoming invites
        socket.on('invite-received', (invite: any) => {
          if (!mounted) return;
          setInvites((prev) => {
            // Deduplicate by invite_id
            if (prev.some((i) => i.invite_id === invite.invite_id)) {
              return prev;
            }
            return [invite, ...prev];
          });
        });

        // Listen for invite acceptance (someone accepted our invite)
        socket.on('invite-accepted', async (data: any) => {
          if (!mounted) return;
          // Remove the invite from sent invites
          setInvites((prev) => prev.filter((i) => i.invite_id !== data.inviteId));
          // Clear matching status and start the chat session
          if (data.session) {
            await leaveMatching();
            onMatchAccepted(data.session);
          }
        });

        // Listen for invite decline
        socket.on('invite-declined', (data: any) => {
          if (!mounted) return;
          // Remove the declined invite
          setInvites((prev) => prev.filter((i) => i.invite_id !== data.inviteId));
        });

        // On reconnect, reload invites
        socket.on('connect', () => {
          loadInvites();
          checkForActiveSession();
        });
      } catch (error) {
        console.error('Failed to initialize socket, falling back to polling:', error);
        fallbackInterval = setInterval(() => {
          loadInvites();
          checkForActiveSession();
        }, 3000);
      }
    }

    setupSocket();

    return () => {
      mounted = false;
      if (fallbackInterval) clearInterval(fallbackInterval);
      const socket = socketRef.current;
      if (socket) {
        socket.off('invite-received');
        socket.off('invite-accepted');
        socket.off('invite-declined');
        socket.off('connect');
      }
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="w-full space-y-6">
        {/* Prompt Input */}
        {!isSearching ? (
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
        ) : (
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl shadow-soft p-6 md:p-8 border-2 border-primary-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                  <h2 className="text-xl font-bold text-gray-900">Searching for matches...</h2>
                </div>
                <p className="text-gray-700 bg-white/50 rounded-lg p-3 border border-primary-100 italic">
                  "{prompt}"
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {matches.length > 0 
                    ? `Found ${matches.length} ${matches.length === 1 ? 'match' : 'matches'} online` 
                    : 'No one online right now, we will keep trying...'}
                </p>
              </div>
              <button
                onClick={leaveMatching}
                className="ml-4 px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 border-2 border-gray-200 font-medium transition-all shadow-sm hover:shadow"
              >
                Leave
              </button>
            </div>
          </div>
        )}

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
        {isSearching && matches.length > 0 && (
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
                  <h4 className="font-bold text-gray-900 text-lg mb-4">{match.randomName}</h4>
                  
                  {/* Show other user's prompt if available */}
                  {match.otherUserPrompt && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-xs font-semibold text-blue-900 mb-1">Their prompt:</p>
                      <p className="text-sm text-gray-700 italic">"{match.otherUserPrompt}"</p>
                    </div>
                  )}
                  
                  <div className="space-y-3 mb-5">
                    {/* Field display configuration */}
                    {(() => {
                      const fieldConfig: Record<string, { label: string; icon: JSX.Element; bgColor: string; iconColor: string; format?: (value: any) => string }> = {
                        age: {
                          label: 'Age',
                          icon: (
                            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ),
                          bgColor: 'bg-primary-100',
                          iconColor: 'text-primary-600',
                          format: (v) => `${v} years old`
                        },
                        location: {
                          label: 'Location',
                          icon: (
                            <svg className="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          ),
                          bgColor: 'bg-accent-100',
                          iconColor: 'text-accent-600'
                        },
                        employment: {
                          label: 'Employment',
                          icon: (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          ),
                          bgColor: 'bg-green-100',
                          iconColor: 'text-green-600'
                        },
                        career_field: {
                          label: 'Career Field',
                          icon: (
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ),
                          bgColor: 'bg-blue-100',
                          iconColor: 'text-blue-600'
                        },
                        marital_status: {
                          label: 'Marital Status',
                          icon: (
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          ),
                          bgColor: 'bg-purple-100',
                          iconColor: 'text-purple-600'
                        },
                        has_baby: {
                          label: 'Has Baby',
                          icon: (
                            <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          ),
                          bgColor: 'bg-pink-100',
                          iconColor: 'text-pink-600'
                        },
                        baby_birth_date: {
                          label: 'Baby\'s Birth Date',
                          icon: (
                            <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          ),
                          bgColor: 'bg-rose-100',
                          iconColor: 'text-rose-600'
                        }
                      };

                      // Special handling for hobbies (array) - show as tags
                      const hasHobbies = match.visibleProfile.hobbies && Array.isArray(match.visibleProfile.hobbies) && match.visibleProfile.hobbies.length > 0;
                      
                      return (
                        <>
                          {hasHobbies && (
                            <div className="flex items-start gap-3 text-sm">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="text-gray-700 font-medium mb-1">Interests</div>
                                <div className="flex flex-wrap gap-1">
                                  {match.visibleProfile.hobbies.slice(0, 5).map((hobby: string, idx: number) => (
                                    <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs">
                                      {hobby}
                                    </span>
                                  ))}
                                  {match.visibleProfile.hobbies.length > 5 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                                      +{match.visibleProfile.hobbies.length - 5}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          {Object.entries(match.visibleProfile)
                            .filter(([key, value]) => {
                              // Skip hobbies (handled separately) and empty values
                              if (key === 'hobbies') return false;
                              if (value === null || value === undefined || value === '') return false;
                              return true;
                            })
                            .map(([key, value]) => {
                              const config = fieldConfig[key];
                              if (!config) {
                                // Fallback for unknown fields
                                return (
                                  <div key={key} className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                    <span className="text-gray-700 font-medium">
                                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {String(value)}
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <div key={key} className="flex items-center gap-3 text-sm">
                                  <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                                    {config.icon}
                                  </div>
                                  <span className="text-gray-700 font-medium">
                                    {config.format ? config.format(value) : String(value)}
                                  </span>
                                </div>
                              );
                            })}
                        </>
                      );
                    })()}
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

      </div>
    </div>
  );
}

