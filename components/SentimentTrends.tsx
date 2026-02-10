'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TrendData {
  date: string;
  sentiment: number;
  entry_id: string;
}

interface TrendsResponse {
  period: string;
  data: TrendData[];
  average: number | null;
  trend: 'improving' | 'declining' | 'stable';
}

export default function SentimentTrends() {
  const [period, setPeriod] = useState<'7days' | '1month'>('7days');
  const [trendsData, setTrendsData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    fetchTrends();
  }, [period]);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      console.log('Fetching trends for period:', period);

      const response = await fetch(`/api/journal/trends?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Trends API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Trends API error:', errorData);
        throw new Error('Failed to fetch trends');
      }

      const result = await response.json();
      console.log('Trends data received:', result);
      console.log('Number of data points:', result.data?.length);

      setTrendsData(result);
    } catch (err) {
      console.error('Error fetching trends:', err);
      setError('Failed to load trends');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getTrendTitle = (trend: string, average: number | null): string => {
    if (average === null) return 'Not enough data yet';

    if (trend === 'improving') return 'Things are shifting upward';
    if (trend === 'declining') return 'This has been a challenging period';

    if (average >= 70) return 'You\'ve been doing well';
    if (average <= 30) return 'This has been tough';
    return 'Navigating the ups and downs';
  };

  const getTrendMessage = (trend: string, average: number | null, periodType: string): string => {
    if (average === null) return 'Keep journaling to see your journey over time. We\'ll show trends once you have a few more entries.';

    const timeframe = periodType === '7days' ? 'this week' : 'this month';

    if (trend === 'improving') {
      return `Your entries show improvement ${timeframe}. Whatever you're doing or however things are shifting - that matters.`;
    }

    if (trend === 'declining') {
      return `Your entries show ${timeframe} has been harder. These patterns are real. If you need support, reaching out is a sign of strength, not weakness.`;
    }

    if (average >= 70) {
      return `You've had mostly good moments ${timeframe}. Hold onto these feelings - they're just as real as the hard days.`;
    }

    if (average <= 30) {
      return `You've been carrying a lot ${timeframe}. Many mothers go through periods like this. You're not alone, and support is available.`;
    }

    return `You're experiencing a mix of days ${timeframe} - that's so normal in motherhood. Be gentle with yourself through all of it.`;
  };

  const getSentimentColor = (sentiment: number): string => {
    if (sentiment <= 29) return '#F87171'; // red-400
    if (sentiment >= 70) return '#34D399'; // green-400
    return '#94A3B8'; // gray-400
  };

  if (loading) {
    return (
      <div className="w-full p-6 bg-white rounded-2xl shadow-soft border border-gray-100">
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Loading your journey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-white rounded-2xl shadow-soft border border-gray-100">
        <div className="h-64 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const hasData = trendsData && trendsData.data.length > 0;
  const { data, average, trend } = trendsData || {};

  return (
    <div className="w-full p-6 bg-white rounded-2xl shadow-soft border border-gray-100">
      {/* Header with Period Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
          Your Journey
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('7days')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              period === '7days'
                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setPeriod('1month')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              period === '1month'
                ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            1 Month
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-center px-4">
          <p className="text-gray-600 text-lg mb-2">Keep journaling to see your journey over time</p>
          <p className="text-sm text-gray-500">
            We'll show trends once you have a few more entries
          </p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={formatDate}
                  stroke="#E5E7EB"
                />
                <YAxis
                  domain={[0, 99]}
                  ticks={[0, 30, 70, 99]}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  stroke="#E5E7EB"
                />
                <Tooltip
                  formatter={(value: number) => [value, 'Sentiment']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '8px',
                  }}
                />

                {/* Reference lines for sentiment zones */}
                <ReferenceLine y={30} stroke="#CBD5E1" strokeDasharray="3 3" />
                <ReferenceLine y={70} stroke="#CBD5E1" strokeDasharray="3 3" />

                {/* Average line */}
                {average !== null && (
                  <ReferenceLine
                    y={average}
                    stroke="#6366F1"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: `Avg: ${average}`,
                      position: 'right',
                      fill: '#6366F1',
                      fontSize: 12,
                    }}
                  />
                )}

                {/* Main line */}
                <Line
                  type="monotone"
                  dataKey="sentiment"
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={{ fill: '#6366F1', r: 5, strokeWidth: 2, stroke: 'white' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Insight Card */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2 text-lg">
              {getTrendTitle(trend || 'stable', average || null)}
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              {getTrendMessage(trend || 'stable', average || null, period)}
            </p>

            {/* Support Prompt for Concerning Trends */}
            {average !== null && average < 30 && trend === 'declining' && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm text-blue-900 mb-2">
                  If these feelings are persistent, talking to someone might help. Professional support is available and reaching out is a sign of strength.
                </p>
                <button className="text-blue-600 hover:text-blue-700 underline text-sm font-medium transition-colors">
                  View support resources
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
