const RoommatePreferences = require('../models/RoommatePreferences');
const RoommateMatch = require('../models/RoommateMatch');

class RoommateMatchingService {
    // Calculate lifestyle compatibility (30 points max)
    static calculateLifestyleScore(pref1, pref2) {
        let score = 0;

        // Sleep schedule (10 points)
        if (pref1.sleepSchedule === pref2.sleepSchedule) {
            score += 10;
        } else if (pref1.sleepSchedule === 'flexible' || pref2.sleepSchedule === 'flexible') {
            score += 7;
        } else {
            score += 3; // Different schedules
        }

        // Cleanliness (10 points) - closer is better
        const cleanlinessDiff = Math.abs(pref1.cleanliness - pref2.cleanliness);
        if (cleanlinessDiff === 0) score += 10;
        else if (cleanlinessDiff === 1) score += 7;
        else if (cleanlinessDiff === 2) score += 4;
        else score += 1;

        // Social level (10 points) - closer is better
        const socialDiff = Math.abs(pref1.socialLevel - pref2.socialLevel);
        if (socialDiff === 0) score += 10;
        else if (socialDiff === 1) score += 7;
        else if (socialDiff === 2) score += 4;
        else score += 1;

        return Math.min(score, 30);
    }

    // Calculate habits compatibility (25 points max)
    static calculateHabitsScore(pref1, pref2) {
        let score = 0;

        // Smoking (10 points)
        if (pref1.smoking === pref2.smoking) {
            score += 10;
        } else if (pref1.smoking === 'occasionally' || pref2.smoking === 'occasionally') {
            score += 5;
        } else if ((pref1.smoking === 'no' && pref2.smoking === 'yes') ||
            (pref1.smoking === 'yes' && pref2.smoking === 'no')) {
            score += 0; // Deal breaker for many
        }

        // Drinking (8 points)
        if (pref1.drinking === pref2.drinking) {
            score += 8;
        } else if (pref1.drinking === 'occasionally' || pref2.drinking === 'occasionally') {
            score += 6;
        } else {
            score += 3;
        }

        // Pets (7 points)
        if (pref1.pets === pref2.pets) {
            score += 7;
        } else if (pref1.pets === 'allergic' || pref2.pets === 'allergic') {
            if (pref1.pets === 'yes' || pref2.pets === 'yes') {
                score += 0; // Deal breaker
            } else {
                score += 5;
            }
        } else {
            score += 4;
        }

        return Math.min(score, 25);
    }

    // Calculate preferences compatibility (25 points max)
    static calculatePreferencesScore(pref1, pref2) {
        let score = 0;

        // Gender preference (10 points)
        const pref1AcceptsPref2 = pref1.preferredGender.includes('any') ||
            pref1.preferredGender.includes(pref2.gender);
        const pref2AcceptsPref1 = pref2.preferredGender.includes('any') ||
            pref2.preferredGender.includes(pref1.gender);

        if (pref1AcceptsPref2 && pref2AcceptsPref1) {
            score += 10;
        } else if (pref1AcceptsPref2 || pref2AcceptsPref1) {
            score += 5;
        }

        // Age range (8 points)
        const pref1AcceptsAge = pref2.age >= pref1.preferredAgeRange.min &&
            pref2.age <= pref1.preferredAgeRange.max;
        const pref2AcceptsAge = pref1.age >= pref2.preferredAgeRange.min &&
            pref1.age <= pref2.preferredAgeRange.max;

        if (pref1AcceptsAge && pref2AcceptsAge) {
            score += 8;
        } else if (pref1AcceptsAge || pref2AcceptsAge) {
            score += 4;
        }

        // Deal breakers (7 points) - no overlapping deal breakers
        const hasDealBreakers = this.checkDealBreakers(pref1, pref2);
        if (!hasDealBreakers) {
            score += 7;
        }

        return Math.min(score, 25);
    }

    // Calculate interests compatibility (20 points max)
    static calculateInterestsScore(pref1, pref2) {
        let score = 0;

        // Common interests (15 points)
        const commonInterests = pref1.interests.filter(interest =>
            pref2.interests.includes(interest)
        );
        const interestScore = Math.min((commonInterests.length / 5) * 15, 15);
        score += interestScore;

        // Common languages (5 points)
        const commonLanguages = pref1.languages.filter(lang =>
            pref2.languages.includes(lang)
        );
        const languageScore = Math.min((commonLanguages.length / 2) * 5, 5);
        score += languageScore;

        return Math.min(score, 20);
    }

    // Check for deal breakers
    static checkDealBreakers(pref1, pref2) {
        const dealBreakers1 = pref1.dealBreakers || [];
        const dealBreakers2 = pref2.dealBreakers || [];

        // Check if any deal breakers match the other person's habits
        for (const dealBreaker of dealBreakers1) {
            if (dealBreaker === 'smoking' && pref2.smoking === 'yes') return true;
            if (dealBreaker === 'drinking' && pref2.drinking === 'yes') return true;
            if (dealBreaker === 'pets' && pref2.pets === 'yes') return true;
        }

        for (const dealBreaker of dealBreakers2) {
            if (dealBreaker === 'smoking' && pref1.smoking === 'yes') return true;
            if (dealBreaker === 'drinking' && pref1.drinking === 'yes') return true;
            if (dealBreaker === 'pets' && pref1.pets === 'yes') return true;
        }

        return false;
    }

    // Calculate overall compatibility score
    static async calculateCompatibility(userId1, userId2) {
        const pref1 = await RoommatePreferences.findOne({ userId: userId1 }).populate('userId');
        const pref2 = await RoommatePreferences.findOne({ userId: userId2 }).populate('userId');

        if (!pref1 || !pref2) {
            throw new Error('Preferences not found for one or both users');
        }

        const lifestyleScore = this.calculateLifestyleScore(pref1, pref2);
        const habitsScore = this.calculateHabitsScore(pref1, pref2);
        const preferencesScore = this.calculatePreferencesScore(pref1, pref2);
        const interestsScore = this.calculateInterestsScore(pref1, pref2);

        const totalScore = lifestyleScore + habitsScore + preferencesScore + interestsScore;

        return {
            compatibilityScore: Math.round(totalScore),
            scoreBreakdown: {
                lifestyle: Math.round(lifestyleScore),
                habits: Math.round(habitsScore),
                preferences: Math.round(preferencesScore),
                interests: Math.round(interestsScore)
            }
        };
    }

    // Find matches for a user
    static async findMatches(userId, limit = 20) {
        const userPrefs = await RoommatePreferences.findOne({ userId });

        if (!userPrefs) {
            throw new Error('User preferences not found');
        }

        // Find other users looking for roommates
        const query = {
            userId: { $ne: userId },
            lookingForRoommate: true
        };

        // Filter by budget if specified
        if (userPrefs.budgetRange && userPrefs.budgetRange.min && userPrefs.budgetRange.max) {
            query.$or = [
                { 'budgetRange.min': { $lte: userPrefs.budgetRange.max } },
                { 'budgetRange.max': { $gte: userPrefs.budgetRange.min } }
            ];
        }

        const potentialMatches = await RoommatePreferences.find(query)
            .populate('userId')
            .limit(100); // Get more to calculate scores

        // Calculate compatibility for each
        const matches = [];
        for (const match of potentialMatches) {
            try {
                const compatibility = await this.calculateCompatibility(userId, match.userId._id);

                // Only include matches with score > 40
                if (compatibility.compatibilityScore > 40) {
                    matches.push({
                        user: match.userId,
                        preferences: match,
                        ...compatibility
                    });
                }
            } catch (error) {
                console.error('Error calculating compatibility:', error);
            }
        }

        // Sort by compatibility score
        matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

        // Return top matches
        return matches.slice(0, limit);
    }

    // Create or update match
    static async createMatch(user1Id, user2Id, requestedBy) {
        // Check if match already exists
        let match = await RoommateMatch.findMatch(user1Id, user2Id);

        if (match) {
            // Update existing match
            if (match.status === 'suggested') {
                match.status = 'requested';
                match.requestedBy = requestedBy;
                await match.save();
            }
            return match;
        }

        // Calculate compatibility
        const compatibility = await this.calculateCompatibility(user1Id, user2Id);

        // Create new match
        match = new RoommateMatch({
            user1Id,
            user2Id,
            ...compatibility,
            status: 'requested',
            requestedBy
        });

        await match.save();
        return match;
    }
}

module.exports = RoommateMatchingService;
