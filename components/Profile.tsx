import React, { useState, useEffect } from 'react';
import { User, Hostel } from '../types';
import Button from './Button';
import Input from './Input';
import BankDetailsForm from './BankDetailsForm';
import IdentityVerification from './IdentityVerification';

interface ProfileProps {
  user: User;
  allHostels: Hostel[];
  onSwitchRole: () => void;
  onUpdateUser: (updatedData: Partial<User> | FormData) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, allHostels, onSwitchRole, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [contactNumber, setContactNumber] = useState(user.contactNumber || '');
  const [email, setEmail] = useState(user.email || '');

  const [trustScore, setTrustScore] = useState<any>(null);

  useEffect(() => {
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setContactNumber(user.contactNumber || '');
    setEmail(user.email || '');
    fetchTrustScore();
  }, [user]);

  const fetchTrustScore = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      // Only fetch if user is logged in
      if (user.id) {
        const response = await fetch(`${apiUrl}/api/fraud/trust-score/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTrustScore(data);
        }
      }
    } catch (error) {
      console.error('Error fetching trust score:', error);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ firstName, lastName, contactNumber, email });
    setIsEditing(false);
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('profilePicture', file);
      onUpdateUser(formData);
    }
  };

  const userHostels = allHostels.filter(h => h.ownerId === user.id);
  const ratedHostels = allHostels.map(hostel => {
    const userRating = hostel.ratings?.find(r => r.userId === user.id);
    return userRating ? { ...hostel, userRating: userRating.score } : null;
  }).filter(Boolean) as (Hostel & { userRating: number })[];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Trusted User 🌟';
    if (score >= 70) return 'Verified User ✅';
    if (score >= 50) return 'Standard User';
    return 'High Risk ⚠️';
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header and role switch */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-5">
            <div className="relative group">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 text-2xl flex-shrink-0">
                  {(user.firstName || user.username).charAt(0).toUpperCase()}
                </div>
              )}
              <input
                type="file"
                id="profilePictureInput"
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={handlePictureChange}
              />
              <button
                onClick={() => document.getElementById('profilePictureInput')?.click()}
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center rounded-full transition-all opacity-0 group-hover:opacity-100"
                title="Change Profile Picture"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{user.firstName} {user.lastName}</h1>
                {trustScore && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(trustScore.score)}`}>
                    {getScoreLabel(trustScore.score)}
                  </span>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
              <button
                onClick={() => document.getElementById('profilePictureInput')?.click()}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
              >
                {user.profilePicture ? 'Change Profile Picture' : 'Upload Profile Picture'}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(!isEditing)} variant="secondary">
              {isEditing ? 'Cancel Editing' : 'Edit Profile'}
            </Button>
            {/* Only show role switch for owner/customer, not for admin */}
            {user.role !== 'admin' && (
              <Button onClick={onSwitchRole} className="w-full sm:w-auto">
                Switch to {user.role === 'owner' ? 'Customer' : 'Owner'} View
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Trust Score Card - Only for Owners */}
      {user.role === 'owner' && trustScore && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Trust Score</h2>
            <div className="text-right">
              <span className={`text-3xl font-bold ${trustScore.score >= 90 ? 'text-green-600' :
                trustScore.score >= 70 ? 'text-blue-600' :
                  trustScore.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                {trustScore.score}
              </span>
              <span className="text-gray-400 text-lg">/100</span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-6">
            <div
              className={`h-2.5 rounded-full ${trustScore.score >= 90 ? 'bg-green-600' :
                trustScore.score >= 70 ? 'bg-blue-600' :
                  trustScore.score >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
              style={{ width: `${trustScore.score}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Account Age</p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {trustScore.factors?.accountAge > 0 ? 'Verified' : 'New'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Identity</p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {trustScore.factors?.verificationStatus > 0 ? 'Verified' : 'Pending'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Activity</p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {trustScore.factors?.activityPattern > 0 ? 'Good' : 'Neutral'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reports</p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {trustScore.factors?.reportHistory === 0 ? 'Clean' : 'Flagged'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Details Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">Contact Information</h2>
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input id="firstName" label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
              <Input id="lastName" label="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <Input id="email" label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <Input id="contactNumber" label="Contact Number" type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
            <div className="flex justify-end pt-2">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 dark:text-gray-300">
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Contact:</strong> {user.contactNumber}</div>
          </div>
        )}
      </div>

      {/* Admin-specific content */}
      {user.role === 'admin' ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            🛡️ Administrator Account
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Role</p>
              <p className="font-semibold text-blue-600 dark:text-blue-400">System Administrator</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Access Level</p>
              <p className="font-semibold text-green-600 dark:text-green-400">Full Access</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Dashboard</p>
              <p className="font-semibold text-purple-600 dark:text-purple-400">Admin Dashboard Available</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Capabilities</p>
              <p className="font-semibold text-orange-600 dark:text-orange-400">User Management, Moderation, Analytics</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            As an administrator, you have access to all platform management features including user management,
            content moderation, verification reviews, analytics, and system settings.
          </p>
        </div>
      ) : (
        <>
          {/* Identity Verification Section - Only for non-admin users */}
          <IdentityVerification />

          {/* Role-specific content */}
          {user.role === 'owner' ? (
            <>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">My Hostel Listings ({userHostels.length})</h2>
                {userHostels.length > 0 ? (
                  <ul className="space-y-4">
                    {userHostels.map(hostel => (
                      <li key={hostel.id} className="p-4 border dark:border-gray-700 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{hostel.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{hostel.location}</p>
                        </div>
                        <p className="font-semibold text-blue-600 dark:text-blue-400">PKR {hostel.price.toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">You haven't listed any hostels yet.</p>
                )}
              </div>

              {/* Bank Details Section for Owners */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <BankDetailsForm />
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">My Rated Hostels ({ratedHostels.length})</h2>
              {ratedHostels.length > 0 ? (
                <ul className="space-y-4">
                  {ratedHostels.map(hostel => (
                    <li key={hostel.id} className="p-4 border dark:border-gray-700 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{hostel.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{hostel.location}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300 font-semibold">{hostel.userRating}/5</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">You haven't rated any hostels yet.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;