const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate personalized hostel recommendations using Gemini AI
 * @param {Object} userProfile - User's profile and preferences
 * @param {Array} hostels - List of available hostels
 * @returns {Promise<Array>} - Ranked recommendations with reasoning
 */
async function generateRecommendations(userProfile, hostels) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY not set. Returning default ranking.');
            return hostels.slice(0, 5).map((h, i) => ({
                hostel: h,
                rank: i + 1,
                reason: 'Top rated hostel in your area'
            }));
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        // Prepare user context
        const userContext = `
User Profile:
- Budget Range: Rs ${userProfile.minBudget || 5000} - Rs ${userProfile.maxBudget || 30000}
- Preferred Amenities: ${userProfile.preferredAmenities?.join(', ') || 'Any'}
- Previous Bookings: ${userProfile.bookingCount || 0}
- Location Preference: ${userProfile.preferredLocation || 'Any'}
- Gender: ${userProfile.gender || 'Any'}
        `.trim();

        // Prepare hostel list (limit to top 20 by rating to reduce token usage)
        const topHostels = hostels
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 20);

        const hostelsList = topHostels.map((h, i) => `
${i + 1}. ${h.name}
   - Location: ${h.location}
   - Price: Rs ${h.price}/month
   - Rating: ${h.rating ? h.rating.toFixed(1) : 'New'}
   - Amenities: ${h.amenities?.slice(0, 5).join(', ') || 'Basic'}
   - Room Type: ${h.category || 'Standard'}
   - Gender: ${h.genderPreference || 'Any'}
        `).join('\n');

        const prompt = `
${userContext}

Available Hostels:
${hostelsList}

Task: Based on the user's profile and preferences, recommend the TOP 5 hostels that best match their needs.
Consider: budget fit, location relevance, amenities match, and ratings.

IMPORTANT: Respond in this EXACT format (one per line):
1|[Hostel Name]|[One sentence reason (max 15 words)]
2|[Hostel Name]|[One sentence reason (max 15 words)]
3|[Hostel Name]|[One sentence reason (max 15 words)]
4|[Hostel Name]|[One sentence reason (max 15 words)]
5|[Hostel Name]|[One sentence reason (max 15 words)]

Example:
1|Green Valley Hostel|Perfect budget match with WiFi and kitchen facilities
        `.trim();

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // Parse AI response
        const recommendations = parseAIResponse(response, topHostels);

        return recommendations;
    } catch (error) {
        console.error('Gemini API error:', error);
        // Fallback: Return top-rated hostels
        return hostels
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 5)
            .map((h, i) => ({
                hostel: h,
                rank: i + 1,
                reason: 'Highly rated hostel'
            }));
    }
}

/**
 * Parse AI response into structured recommendations
 */
function parseAIResponse(responseText, hostels) {
    const lines = responseText.split('\n').filter(line => line.trim());
    const recommendations = [];

    for (const line of lines) {
        // Match format: 1|Hostel Name|Reason
        const match = line.match(/^(\d+)\|(.+?)\|(.+)$/);
        if (match) {
            const [, rank, hostelName, reason] = match;

            // Find matching hostel (case-insensitive, partial match)
            const hostel = hostels.find(h =>
                h.name.toLowerCase().includes(hostelName.toLowerCase().trim()) ||
                hostelName.toLowerCase().includes(h.name.toLowerCase())
            );

            if (hostel) {
                recommendations.push({
                    hostel,
                    rank: parseInt(rank),
                    reason: reason.trim()
                });
            }
        }
    }

    // If parsing failed, return top-rated hostels
    if (recommendations.length === 0) {
        return hostels.slice(0, 5).map((h, i) => ({
            hostel: h,
            rank: i + 1,
            reason: 'Top recommendation based on ratings'
        }));
    }

    return recommendations.slice(0, 5);
}

/**
 * Rank hostels based on search criteria using AI
 */
async function rankHostels(searchCriteria, hostels) {
    try {
        if (!process.env.GEMINI_API_KEY || hostels.length <= 5) {
            // If no API key or few hostels, use simple ranking
            return hostels.sort((a, b) => {
                // Score based on multiple factors
                const scoreA = calculateSimpleScore(a, searchCriteria);
                const scoreB = calculateSimpleScore(b, searchCriteria);
                return scoreB - scoreA;
            });
        }

        // For larger sets, use AI ranking
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `
Rank these hostels based on: ${JSON.stringify(searchCriteria)}

Hostels:
${hostels.slice(0, 20).map((h, i) => `${i + 1}. ${h.name} - Rs ${h.price} - ${h.location}`).join('\n')}

Return only hostel names in order of best match, one per line.
        `;

        const result = await model.generateContent(prompt);
        const rankedNames = result.response.text().split('\n').map(l => l.trim());

        // Reorder hostels based on AI ranking
        const ranked = [];
        rankedNames.forEach(name => {
            const hostel = hostels.find(h => h.name.includes(name) || name.includes(h.name));
            if (hostel && !ranked.includes(hostel)) {
                ranked.push(hostel);
            }
        });

        // Add any remaining hostels
        hostels.forEach(h => {
            if (!ranked.includes(h)) {
                ranked.push(h);
            }
        });

        return ranked;
    } catch (error) {
        console.error('Ranking error:', error);
        return hostels;
    }
}

/**
 * Simple scoring function for fallback
 */
function calculateSimpleScore(hostel, criteria) {
    let score = 0;

    // Rating score (0-5 points)
    score += (hostel.rating || 0);

    // Price match (0-3 points)
    if (criteria.minPrice && criteria.maxPrice) {
        if (hostel.price >= criteria.minPrice && hostel.price <= criteria.maxPrice) {
            score += 3;
        }
    }

    // Amenities match (0-2 points)
    if (criteria.amenities && hostel.amenities) {
        const matchCount = criteria.amenities.filter(a =>
            hostel.amenities.includes(a)
        ).length;
        score += Math.min(matchCount, 2);
    }

    // Verified bonus (1 point)
    if (hostel.verified) {
        score += 1;
    }

    return score;
}

module.exports = {
    generateRecommendations,
    rankHostels
};
