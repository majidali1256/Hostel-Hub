import React, { useState, useEffect } from 'react';

interface Match {
    user: any;
    preferences: any;
    compatibilityScore: number;
    scoreBreakdown: {
        lifestyle: number;
        habits: number;
        preferences: number;
        interests: number;
    };
}

const RoommateMatchList: React.FC = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    useEffect(() => {
        loadMatches();
    }, []);

    const loadMatches = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Loading roommate matches with token:', token ? 'present' : 'missing');
            const res = await fetch('http://localhost:5001/api/roommate/matches', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Roommate matches response status:', res.status);
            const data = await res.json();
            console.log('Roommate matches data:', data);

            // Check if data is an array, otherwise set empty array
            if (Array.isArray(data)) {
                setMatches(data);
            } else {
                setMatches([]);
                if (data.error) {
                    console.log('Roommate API error:', data.error);
                }
            }
        } catch (error) {
            console.error('Failed to load matches:', error);
            setMatches([]);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMatchRequest = async (userId: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5001/api/roommate/matches/${userId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('Match request sent!');
        } catch (error) {
            console.error('Failed to send request:', error);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-blue-600 dark:text-blue-400';
        if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-gray-600 dark:text-gray-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700';
        if (score >= 60) return 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700';
        if (score >= 40) return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700';
        return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="text-gray-500 dark:text-gray-400">Finding your matches...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Roommate Matches</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Found {matches.length} compatible roommates</p>
            </div>

            {matches.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-gray-600 dark:text-gray-300">No matches found. Try updating your preferences!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matches.map((match) => (
                        <div
                            key={match.user._id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                {/* User Info */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                        {match.user.firstName[0]}{match.user.lastName[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {match.user.firstName} {match.user.lastName}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{match.preferences.occupation}</p>
                                    </div>
                                </div>

                                {/* Compatibility Score */}
                                <div className={`p-4 rounded-lg border-2 mb-4 ${getScoreBg(match.compatibilityScore)}`}>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Compatibility</p>
                                        <p className={`text-3xl font-bold ${getScoreColor(match.compatibilityScore)}`}>
                                            {match.compatibilityScore}%
                                        </p>
                                    </div>
                                </div>

                                {/* Score Breakdown */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-300">Lifestyle</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{match.scoreBreakdown.lifestyle}/30</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-300">Habits</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{match.scoreBreakdown.habits}/25</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-300">Preferences</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{match.scoreBreakdown.preferences}/25</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-300">Interests</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{match.scoreBreakdown.interests}/20</span>
                                    </div>
                                </div>

                                {/* Bio */}
                                {match.preferences.bio && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                                        {match.preferences.bio}
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSelectedMatch(match)}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        View Profile
                                    </button>
                                    <button
                                        onClick={() => sendMatchRequest(match.user._id)}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                                    >
                                        Connect
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Match Detail Modal */}
            {selectedMatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {selectedMatch.user.firstName} {selectedMatch.user.lastName}
                                </h2>
                                <button
                                    onClick={() => setSelectedMatch(null)}
                                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Compatibility */}
                            <div className={`p-6 rounded-lg border-2 ${getScoreBg(selectedMatch.compatibilityScore)}`}>
                                <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Compatibility Score</p>
                                <p className={`text-center text-4xl font-bold ${getScoreColor(selectedMatch.compatibilityScore)}`}>
                                    {selectedMatch.compatibilityScore}%
                                </p>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-4 text-gray-900 dark:text-white">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Age</p>
                                    <p className="font-medium">{selectedMatch.preferences.age}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Occupation</p>
                                    <p className="font-medium">{selectedMatch.preferences.occupation}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Sleep Schedule</p>
                                    <p className="font-medium capitalize">{selectedMatch.preferences.sleepSchedule.replace('-', ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Cleanliness</p>
                                    <p className="font-medium">{selectedMatch.preferences.cleanliness}/5</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Smoking</p>
                                    <p className="font-medium capitalize">{selectedMatch.preferences.smoking}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Pets</p>
                                    <p className="font-medium capitalize">{selectedMatch.preferences.pets}</p>
                                </div>
                            </div>

                            {/* Bio */}
                            {selectedMatch.preferences.bio && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">About</p>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedMatch.preferences.bio}</p>
                                </div>
                            )}

                            {/* Interests */}
                            {selectedMatch.preferences.interests?.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interests</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMatch.preferences.interests.map((interest: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-sm"
                                            >
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action */}
                            <button
                                onClick={() => {
                                    sendMatchRequest(selectedMatch.user._id);
                                    setSelectedMatch(null);
                                }}
                                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                            >
                                Send Connection Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoommateMatchList;
