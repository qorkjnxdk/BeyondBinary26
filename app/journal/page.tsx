"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FeatureTabs from "@/components/FeatureTabs";

interface JournalEntry {
  entry_id: string;
  content: string;
  sentiment: number | null;
  created_at: number;
}

export default function JournalPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetch('/api/journal', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.entries) setEntries(data.entries);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok && data.entry) {
        setEntries([data.entry, ...entries]);
        setContent('');
      } else {
        alert(data.error || 'Failed to save entry');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving entry');
    } finally {
      setSaving(false);
    }
  };

  const sentimentLabel = (score: number | null) => {
    if (score === null) return '';
    if (score > 0) return 'Gentle positive tone';
    if (score < 0) return 'Sounds heavy today';
    return 'Neutral tone';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FeatureTabs />
      <div className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="bg-white rounded-2xl shadow-soft p-8 border border-gray-100 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
            Private Journal
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            A quiet space just for you. Nothing here is shared or used for matching.
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="How are you really feeling today?"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900 placeholder-gray-400 min-h-[120px]"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-600">Loading entries...</p>
          ) : entries.length === 0 ? (
            <p className="text-gray-500">No entries yet. Start with a small note to yourself.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.entry_id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                  {entry.sentiment !== null && (
                    <span className="text-xs font-medium text-gray-600">
                      {sentimentLabel(entry.sentiment)}
                    </span>
                  )}
                </div>
                <p className="text-gray-800 whitespace-pre-line text-sm leading-relaxed">{entry.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
