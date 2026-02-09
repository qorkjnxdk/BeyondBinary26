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
    <div className="min-h-screen gradient-soft py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-soft p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
            Join Beyond Binary
          </h1>
          <p className="text-gray-600">Create your account and start connecting</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={singpassData.gender}
                onChange={(e) => setSingpassData({ ...singpassData, gender: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
              >
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </div>
            <button
              onClick={handleSingpassVerify}
              className="btn-primary w-full"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
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
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="btn-primary flex-1"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
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
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="btn-primary flex-1"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={credentials.confirmPassword}
                onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-gray-900"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
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

