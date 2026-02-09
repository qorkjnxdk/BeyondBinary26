'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed', 'In a Relationship', "It's Complicated"];
const employmentTypes = ['Employed Full-time', 'Employed Part-time', 'Self-employed', 'Unemployed', 'Student', 'Retired', 'Homemaker'];
const districts = Array.from({ length: 28 }, (_, i) => String(i + 1).padStart(2, '0'));
const careerFields = [
  'Technology', 'Healthcare', 'Education', 'Finance', 'Marketing', 'Law', 'Engineering',
  'Design', 'Sales', 'Human Resources', 'Operations', 'Consulting', 'Media', 'Hospitality',
  'Retail', 'Real Estate', 'Non-profit', 'Government', 'Research', 'Other'
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Singpass verification (simulated)
  const [singpassData, setSingpassData] = useState({
    nric: '',
    name: '',
    gender: 'F',
  });

  // Step 2: Profile
  const [profile, setProfile] = useState({
    age: '',
    maritalStatus: '',
    employment: '',
    hobbies: [] as string[],
    hobbyInput: '',
    location: '',
    hasBaby: '',
    careerField: '',
    careerOther: '',
  });

  // Step 3: Privacy settings
  const [privacy, setPrivacy] = useState<Record<string, string>>({});

  // Step 4: Credentials
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSingpassVerify = () => {
    // Simulated Singpass verification
    // In production, this would redirect to Singpass OAuth
    if (!singpassData.nric || !singpassData.name) {
      setError('Please enter your details');
      return;
    }
    if (singpassData.gender !== 'F') {
      setError('Only women are allowed on this platform');
      return;
    }
    setStep(2);
  };

  const handleAddHobby = () => {
    if (profile.hobbyInput.trim() && profile.hobbies.length < 10) {
      if (profile.hobbyInput.length <= 30) {
        setProfile({
          ...profile,
          hobbies: [...profile.hobbies, profile.hobbyInput.trim()],
          hobbyInput: '',
        });
      } else {
        setError('Hobby must be 30 characters or less');
      }
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // Validate
      if (credentials.password !== credentials.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Create privacy settings object
      const privacySettings: Record<string, string> = {};
      const fields = ['age', 'maritalStatus', 'employment', 'hobbies', 'location', 'hasBaby', 'careerField'];
      fields.forEach(field => {
        privacySettings[field] = privacy[field] || 'no_one_can_see';
      });

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          singpassNric: singpassData.nric,
          email: credentials.email,
          password: credentials.password,
          realName: singpassData.name,
          gender: singpassData.gender,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      // Store token
      sessionStorage.setItem('token', data.token);

      // Update profile
      const profileResponse = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`,
        },
        body: JSON.stringify({
          age: parseInt(profile.age),
          marital_status: profile.maritalStatus,
          employment: profile.employment,
          hobbies: profile.hobbies,
          location: profile.location,
          has_baby: profile.hasBaby,
          career_field: profile.careerField === 'Other' ? profile.careerOther : profile.careerField,
          privacy_settings: privacySettings,
        }),
      });

      if (!profileResponse.ok) {
        console.error('Failed to update profile');
      }

      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
          Sign Up
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              In production, this would redirect to Singpass for verification.
              For now, please enter your details:
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NRIC
              </label>
              <input
                type="text"
                value={singpassData.nric}
                onChange={(e) => setSingpassData({ ...singpassData, nric: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="S1234567A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={singpassData.name}
                onChange={(e) => setSingpassData({ ...singpassData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={singpassData.gender}
                onChange={(e) => setSingpassData({ ...singpassData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </div>
            <button
              onClick={handleSingpassVerify}
              className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-pink-700"
            >
              Verify & Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <select
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select age</option>
                {Array.from({ length: 83 }, (_, i) => i + 18).map(age => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
              <select
                value={profile.maritalStatus}
                onChange={(e) => setProfile({ ...profile, maritalStatus: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select status</option>
                {maritalStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment</label>
              <select
                value={profile.employment}
                onChange={(e) => setProfile({ ...profile, employment: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select employment</option>
                {employmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hobbies ({profile.hobbies.length}/10)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={profile.hobbyInput}
                  onChange={(e) => setProfile({ ...profile, hobbyInput: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHobby())}
                  maxLength={30}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Add hobby (max 30 chars)"
                />
                <button
                  type="button"
                  onClick={handleAddHobby}
                  disabled={profile.hobbies.length >= 10}
                  className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.hobbies.map((hobby, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {hobby}
                    <button
                      onClick={() => setProfile({ ...profile, hobbies: profile.hobbies.filter((_, idx) => idx !== i) })}
                      className="text-pink-600 hover:text-pink-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (District)</label>
              <select
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select district</option>
                {districts.map(district => (
                  <option key={district} value={district}>District {district}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Has Baby</label>
              <select
                value={profile.hasBaby}
                onChange={(e) => setProfile({ ...profile, hasBaby: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Expecting">Expecting</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Career Field</label>
              <select
                value={profile.careerField}
                onChange={(e) => setProfile({ ...profile, careerField: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select field</option>
                {careerFields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
              {profile.careerField === 'Other' && (
                <input
                  type="text"
                  value={profile.careerOther}
                  onChange={(e) => setProfile({ ...profile, careerOther: e.target.value })}
                  maxLength={50}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Specify career field"
                />
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-pink-700"
              >
                Next: Privacy Settings
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
            <p className="text-sm text-gray-600 mb-4">
              Choose who can see each field. "Anonymous can see" means visible during matching and anonymous chats.
              "Match can see" means only visible to friends. "No one can see" means never visible.
            </p>

            {['age', 'maritalStatus', 'employment', 'hobbies', 'location', 'hasBaby', 'careerField'].map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {field.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <select
                  value={privacy[field] || 'no_one_can_see'}
                  onChange={(e) => setPrivacy({ ...privacy, [field]: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="anonymous_can_see">Anonymous can see</option>
                  <option value="match_can_see">Match can see</option>
                  <option value="no_one_can_see">No one can see</option>
                </select>
              </div>
            ))}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 bg-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-pink-700"
              >
                Next: Create Account
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Create Login Credentials</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password (min 8 chars, must include uppercase, lowercase, number)
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={credentials.confirmPassword}
                onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            <div className="text-center">
              <Link href="/auth/login" className="text-sm text-pink-600 hover:underline">
                Already have an account? Log in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

