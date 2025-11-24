import React, { useState } from 'react';

interface RoommatePreferencesFormProps {
    initialData?: any;
    onSuccess?: () => void;
    onClose?: () => void;
}

const RoommatePreferencesForm: React.FC<RoommatePreferencesFormProps> = ({
    initialData,
    onSuccess,
    onClose
}) => {
    const [formData, setFormData] = useState({
        bio: initialData?.bio || '',
        age: initialData?.age || '',
        gender: initialData?.gender || 'prefer-not-to-say',
        occupation: initialData?.occupation || '',
        sleepSchedule: initialData?.sleepSchedule || 'flexible',
        cleanliness: initialData?.cleanliness || 3,
        socialLevel: initialData?.socialLevel || 3,
        smoking: initialData?.smoking || 'no',
        drinking: initialData?.drinking || 'occasionally',
        pets: initialData?.pets || 'no',
        preferredGender: initialData?.preferredGender || ['any'],
        preferredAgeRange: initialData?.preferredAgeRange || { min: 18, max: 100 },
        dealBreakers: initialData?.dealBreakers || [],
        interests: initialData?.interests || [],
        languages: initialData?.languages || [],
        lookingForRoommate: initialData?.lookingForRoommate !== false,
        budgetRange: initialData?.budgetRange || { min: '', max: '' }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('http://localhost:5001/api/roommate/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save preferences');
            }

            onSuccess?.();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addInterest = (interest: string) => {
        if (interest && !formData.interests.includes(interest)) {
            setFormData(prev => ({
                ...prev,
                interests: [...prev.interests, interest]
            }));
        }
    };

    const removeInterest = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.filter(i => i !== interest)
        }));
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Roommate Preferences</h1>
                <p className="text-gray-600 mt-2">Help us find your perfect roommate match</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Basic Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Age *</label>
                            <input
                                type="number"
                                value={formData.age}
                                onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                                required
                                min="18"
                                max="100"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                            <input
                                type="text"
                                value={formData.occupation}
                                onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Student, Software Engineer"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                rows={3}
                                maxLength={500}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Tell potential roommates about yourself..."
                            />
                        </div>
                    </div>
                </div>

                {/* Lifestyle */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Lifestyle</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Schedule</label>
                            <select
                                value={formData.sleepSchedule}
                                onChange={(e) => setFormData(prev => ({ ...prev, sleepSchedule: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="early-bird">Early Bird (sleep before 11pm)</option>
                                <option value="night-owl">Night Owl (sleep after 1am)</option>
                                <option value="flexible">Flexible</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cleanliness Level: {formData.cleanliness}/5
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={formData.cleanliness}
                                onChange={(e) => setFormData(prev => ({ ...prev, cleanliness: parseInt(e.target.value) }))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-600">
                                <span>Messy</span>
                                <span>Very Clean</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Social Level: {formData.socialLevel}/5
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={formData.socialLevel}
                                onChange={(e) => setFormData(prev => ({ ...prev, socialLevel: parseInt(e.target.value) }))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-600">
                                <span>Introvert</span>
                                <span>Extrovert</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Habits */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Habits</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Smoking</label>
                            <select
                                value={formData.smoking}
                                onChange={(e) => setFormData(prev => ({ ...prev, smoking: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                                <option value="occasionally">Occasionally</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Drinking</label>
                            <select
                                value={formData.drinking}
                                onChange={(e) => setFormData(prev => ({ ...prev, drinking: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                                <option value="occasionally">Occasionally</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pets</label>
                            <select
                                value={formData.pets}
                                onChange={(e) => setFormData(prev => ({ ...prev, pets: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="yes">Have pets</option>
                                <option value="no">No pets</option>
                                <option value="allergic">Allergic to pets</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Budget */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Budget Range</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Min Budget</label>
                            <input
                                type="number"
                                value={formData.budgetRange.min}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    budgetRange: { ...prev.budgetRange, min: parseInt(e.target.value) }
                                }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="$500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max Budget</label>
                            <input
                                type="number"
                                value={formData.budgetRange.max}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    budgetRange: { ...prev.budgetRange, max: parseInt(e.target.value) }
                                }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="$1500"
                            />
                        </div>
                    </div>
                </div>

                {/* Looking for Roommate */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={formData.lookingForRoommate}
                            onChange={(e) => setFormData(prev => ({ ...prev, lookingForRoommate: e.target.checked }))}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            I'm currently looking for a roommate
                        </span>
                    </label>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RoommatePreferencesForm;
