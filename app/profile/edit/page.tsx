'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    age: '',
    marital_status: '',
    employment: '',
    hobbies: [],
    hobbyInput: '',
    location: '',
    has_baby: '',
    baby_birth_date: '',
    career_field: '',
    privacy_settings: {},
  });

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setProfile({
            age: data.user.age || '',
            marital_status: data.user.marital_status || '',
            employment: data.user.employment || '',
            hobbies: data.user.hobbies || [],
            hobbyInput: '',
            location: data.user.location || '',
            has_baby: data.user.has_baby || '',
            baby_birth_date: data.user.baby_birth_date || '',
            career_field: data.user.career_field || '',
            privacy_settings: data.user.privacy_settings || {},
          });
        } else {
          router.push('/auth/login');
        }
      })
      .catch(() => router.push('/auth/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
        router.push('/dashboard');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-soft">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-soft p-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Edit Profile
            </h1>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-all"
            >
              Cancel
            </Link>
          </div>

          <div className="space-y-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600">Update your profile information and adjust visibility settings for each field</p>
            </div>

            {/* Age - Always visible */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">Age</label>
                <span className="text-sm font-medium text-gray-500 px-3 py-1 rounded-lg bg-gray-50">
                  Always Visible
                </span>
              </div>
              <select
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
              >
                <option value="">Select age</option>
                {Array.from({ length: 83 }, (_, i) => i + 18).map(age => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">Location</label>
                <button
                  type="button"
                  onClick={() => {
                    const currentPrivacy = profile.privacy_settings?.location || 'no_one_can_see';
                    const options = ['anonymous_can_see', 'match_can_see', 'no_one_can_see'];
                    const nextIndex = (options.indexOf(currentPrivacy) + 1) % options.length;
                    setProfile({
                      ...profile,
                      privacy_settings: {
                        ...profile.privacy_settings,
                        location: options[nextIndex],
                      },
                    });
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-primary-50 transition-all"
                >
                  {profile.privacy_settings?.location === 'anonymous_can_see' ? 'Visible' : profile.privacy_settings?.location === 'match_can_see' ? 'Friends Only' : 'Hidden'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <select
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
              >
                <option value="">Select location</option>
                <option value="Orchard">Orchard</option>
                <option value="Marina Bay">Marina Bay</option>
                <option value="Chinatown">Chinatown</option>
                <option value="Little India">Little India</option>
                <option value="Clarke Quay">Clarke Quay</option>
                <option value="Woodlands">Woodlands</option>
                <option value="Yishun">Yishun</option>
                <option value="Sembawang">Sembawang</option>
                <option value="Ang Mo Kio">Ang Mo Kio</option>
                <option value="Bishan">Bishan</option>
                <option value="Tampines">Tampines</option>
                <option value="Pasir Ris">Pasir Ris</option>
                <option value="Bedok">Bedok</option>
                <option value="Changi">Changi</option>
                <option value="Simei">Simei</option>
                <option value="Jurong">Jurong</option>
                <option value="Clementi">Clementi</option>
                <option value="Boon Lay">Boon Lay</option>
                <option value="Punggol">Punggol</option>
                <option value="Sengkang">Sengkang</option>
                <option value="Hougang">Hougang</option>
                <option value="Serangoon">Serangoon</option>
                <option value="Kovan">Kovan</option>
              </select>
            </div>

            {/* Marital Status */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">Marital Status</label>
                <button
                  type="button"
                  onClick={() => {
                    const currentPrivacy = profile.privacy_settings?.marital_status || 'no_one_can_see';
                    const options = ['anonymous_can_see', 'match_can_see', 'no_one_can_see'];
                    const nextIndex = (options.indexOf(currentPrivacy) + 1) % options.length;
                    setProfile({
                      ...profile,
                      privacy_settings: {
                        ...profile.privacy_settings,
                        marital_status: options[nextIndex],
                      },
                    });
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-primary-50 transition-all"
                >
                  {profile.privacy_settings?.marital_status === 'anonymous_can_see' ? 'Visible' : profile.privacy_settings?.marital_status === 'match_can_see' ? 'Friends Only' : 'Hidden'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <select
                value={profile.marital_status}
                onChange={(e) => setProfile({ ...profile, marital_status: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
              >
                <option value="">Select marital status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="In a Relationship">In a Relationship</option>
                <option value="It's Complicated">It's Complicated</option>
              </select>
            </div>

            {/* Employment */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">Employment</label>
                <button
                  type="button"
                  onClick={() => {
                    const currentPrivacy = profile.privacy_settings?.employment || 'no_one_can_see';
                    const options = ['anonymous_can_see', 'match_can_see', 'no_one_can_see'];
                    const nextIndex = (options.indexOf(currentPrivacy) + 1) % options.length;
                    setProfile({
                      ...profile,
                      privacy_settings: {
                        ...profile.privacy_settings,
                        employment: options[nextIndex],
                      },
                    });
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-primary-50 transition-all"
                >
                  {profile.privacy_settings?.employment === 'anonymous_can_see' ? 'Visible' : profile.privacy_settings?.employment === 'match_can_see' ? 'Friends Only' : 'Hidden'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <select
                value={profile.employment}
                onChange={(e) => setProfile({ ...profile, employment: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
              >
                <option value="">Select employment status</option>
                <option value="Employed Full-time">Employed Full-time</option>
                <option value="Employed Part-time">Employed Part-time</option>
                <option value="Self-employed">Self-employed</option>
                <option value="Unemployed">Unemployed</option>
                <option value="Student">Student</option>
                <option value="Retired">Retired</option>
                <option value="Homemaker">Homemaker</option>
              </select>
            </div>

            {/* Career Field */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">Career Field</label>
                <button
                  type="button"
                  onClick={() => {
                    const currentPrivacy = profile.privacy_settings?.career_field || 'no_one_can_see';
                    const options = ['anonymous_can_see', 'match_can_see', 'no_one_can_see'];
                    const nextIndex = (options.indexOf(currentPrivacy) + 1) % options.length;
                    setProfile({
                      ...profile,
                      privacy_settings: {
                        ...profile.privacy_settings,
                        career_field: options[nextIndex],
                      },
                    });
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-primary-50 transition-all"
                >
                  {profile.privacy_settings?.career_field === 'anonymous_can_see' ? 'Visible' : profile.privacy_settings?.career_field === 'match_can_see' ? 'Friends Only' : 'Hidden'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <input
                type="text"
                value={profile.career_field}
                onChange={(e) => setProfile({ ...profile, career_field: e.target.value })}
                maxLength={50}
                placeholder="e.g., Technology, Healthcare, Education"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Has Baby */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">Has Baby</label>
                <button
                  type="button"
                  onClick={() => {
                    const currentPrivacy = profile.privacy_settings?.has_baby || 'no_one_can_see';
                    const options = ['anonymous_can_see', 'match_can_see', 'no_one_can_see'];
                    const nextIndex = (options.indexOf(currentPrivacy) + 1) % options.length;
                    setProfile({
                      ...profile,
                      privacy_settings: {
                        ...profile.privacy_settings,
                        has_baby: options[nextIndex],
                      },
                    });
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-primary-50 transition-all"
                >
                  {profile.privacy_settings?.has_baby === 'anonymous_can_see' ? 'Visible' : profile.privacy_settings?.has_baby === 'match_can_see' ? 'Friends Only' : 'Hidden'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <select
                value={profile.has_baby}
                onChange={(e) => setProfile({ ...profile, has_baby: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Expecting">Expecting</option>
              </select>
            </div>

            {/* Baby Birth Date - Conditional based on has_baby */}
            {(profile.has_baby === 'Yes' || profile.has_baby === 'Expecting') && (
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Baby's Birth Date
                    {profile.has_baby === 'Expecting' && <span className="text-xs text-gray-500 ml-1">(Expected)</span>}
                  </label>
                </div>
                <input
                  type="date"
                  value={profile.baby_birth_date}
                  onChange={(e) => setProfile({ ...profile, baby_birth_date: e.target.value })}
                  max={profile.has_baby === 'Yes' ? new Date().toISOString().split('T')[0] : undefined}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {profile.has_baby === 'Yes'
                    ? "This helps us provide you with stage-specific support and resources in the Baby Journey tab."
                    : "Enter your expected due date to get relevant pregnancy resources."}
                </p>
              </div>
            )}

            {/* Hobbies */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Hobbies ({profile.hobbies?.length || 0}/10)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const currentPrivacy = profile.privacy_settings?.hobbies || 'no_one_can_see';
                    const options = ['anonymous_can_see', 'match_can_see', 'no_one_can_see'];
                    const nextIndex = (options.indexOf(currentPrivacy) + 1) % options.length;
                    setProfile({
                      ...profile,
                      privacy_settings: {
                        ...profile.privacy_settings,
                        hobbies: options[nextIndex],
                      },
                    });
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-primary-50 transition-all"
                >
                  {profile.privacy_settings?.hobbies === 'anonymous_can_see' ? 'Visible' : profile.privacy_settings?.hobbies === 'match_can_see' ? 'Friends Only' : 'Hidden'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={profile.hobbyInput || ''}
                    onChange={(e) => setProfile({ ...profile, hobbyInput: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (profile.hobbyInput?.trim() && (profile.hobbies?.length || 0) < 10) {
                          if ((profile.hobbyInput?.length || 0) <= 30) {
                            setProfile({
                              ...profile,
                              hobbies: [...(profile.hobbies || []), profile.hobbyInput.trim()],
                              hobbyInput: '',
                            });
                          } else {
                            toast.error('Hobby must be 30 characters or less');
                          }
                        }
                      }
                    }}
                    maxLength={30}
                    placeholder="Enter a hobby (max 30 characters)"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (profile.hobbyInput?.trim() && (profile.hobbies?.length || 0) < 10) {
                        if ((profile.hobbyInput?.length || 0) <= 30) {
                          setProfile({
                            ...profile,
                            hobbies: [...(profile.hobbies || []), profile.hobbyInput.trim()],
                            hobbyInput: '',
                          });
                        } else {
                          toast.error('Hobby must be 30 characters or less');
                        }
                      }
                    }}
                    disabled={(profile.hobbies?.length || 0) >= 10}
                    className="px-4 py-2 bg-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-300 transition-all text-gray-900 font-medium"
                  >
                    Add
                  </button>
                </div>
                {(profile.hobbies?.length || 0) > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.hobbies.map((hobby: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm flex items-center gap-2"
                      >
                        {hobby}
                        <button
                          type="button"
                          onClick={() => setProfile({ ...profile, hobbies: profile.hobbies.filter((_: string, idx: number) => idx !== i) })}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

