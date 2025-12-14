const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
let genAI;
let model;

if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✨ Gemini AI initialized');
} else {
    console.warn('⚠️  GEMINI_API_KEY not set. AI features will be disabled.');
}

/**
 * Generate personalized hostel recommendations
 */
const getPersonalizedRecommendations = async (hostels, userProfile) => {
    if (!model) {
        // Fallback: return hostels sorted by rating
        return hostels.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
    }

    try {
        const prompt = `You are a hostel recommendation expert. Based on the user's profile and preferences, recommend the top 5 hostels from the list below.

User Profile:
- Budget: PKR ${userProfile.minPrice || 0} - ${userProfile.maxPrice || 100000}
- Preferred Location: ${userProfile.location || 'Any'}
- Previous Bookings: ${userProfile.bookingHistory?.length || 0} bookings
- Preferred Amenities: ${userProfile.preferredAmenities?.join(', ') || 'None specified'}

Available Hostels:
${JSON.stringify(hostels.map(h => ({
            id: h._id,
            name: h.name,
            location: h.location,
            price: h.price,
            rating: h.rating,
            amenities: h.amenities,
            description: h.description?.substring(0, 100)
        })), null, 2)}

Please analyze and return ONLY a JSON array of the top 5 hostel IDs in order of recommendation, with a brief reason for each. Format:
[
  {"id": "hostel_id", "reason": "brief explanation", "score": 0-100},
  ...
]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const recommendations = JSON.parse(jsonMatch[0]);
            return recommendations.map(rec => {
                const hostel = hostels.find(h => h._id.toString() === rec.id);
                return {
                    ...hostel?._doc || hostel,
                    aiReason: rec.reason,
                    aiScore: rec.score
                };
            }).filter(Boolean);
        }

        // Fallback
        return hostels.slice(0, 5);
    } catch (error) {
        console.error('Gemini recommendation error:', error);
        // Fallback: return top-rated hostels
        return hostels.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
    }
};

/**
 * Parse natural language search query
 */
const parseSearchQuery = async (query) => {
    if (!model) {
        // Simple fallback parsing
        return {
            location: query,
            keywords: query.split(' ').filter(w => w.length > 2)
        };
    }

    try {
        const prompt = `Parse this hostel search query and extract structured information:

Query: "${query}"

Extract and return ONLY a JSON object with:
{
  "location": "city or area mentioned",
  "priceRange": {"min": number, "max": number},
  "amenities": ["list", "of", "amenities"],
  "keywords": ["other", "keywords"],
  "intent": "brief description of what user wants"
}

If something is not mentioned, use null. Be concise.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return { location: query, keywords: [query] };
    } catch (error) {
        console.error('Query parsing error:', error);
        return { location: query, keywords: [query] };
    }
};

/**
 * Generate smart search suggestions
 */
const getSearchSuggestions = async (partialQuery, popularSearches = []) => {
    if (!model || partialQuery.length < 2) {
        return popularSearches.slice(0, 5);
    }

    try {
        const prompt = `Given the partial search query "${partialQuery}", suggest 5 relevant hostel search queries.

Consider:
- Popular locations in Pakistan
- Common hostel amenities
- Price ranges
- Student preferences

Return ONLY a JSON array of strings:
["suggestion 1", "suggestion 2", ...]

Be concise and relevant.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return popularSearches.slice(0, 5);
    } catch (error) {
        console.error('Suggestion error:', error);
        return popularSearches.slice(0, 5);
    }
};

/**
 * Rank search results using AI
 */
const rankSearchResults = async (hostels, searchCriteria, userPreferences = {}) => {
    if (!model || hostels.length === 0) {
        // Simple ranking: rating * (1 / price_factor)
        return hostels.sort((a, b) => {
            const scoreA = (a.rating || 3) * (10000 / (a.price || 10000));
            const scoreB = (b.rating || 3) * (10000 / (b.price || 10000));
            return scoreB - scoreA;
        });
    }

    try {
        const prompt = `Rank these hostels based on search criteria and user preferences:

Search Criteria:
${JSON.stringify(searchCriteria, null, 2)}

User Preferences:
${JSON.stringify(userPreferences, null, 2)}

Hostels:
${JSON.stringify(hostels.map(h => ({
            id: h._id,
            name: h.name,
            location: h.location,
            price: h.price,
            rating: h.rating,
            amenities: h.amenities
        })), null, 2)}

Return ONLY a JSON array of hostel IDs in ranked order (best first):
["id1", "id2", "id3", ...]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const rankedIds = JSON.parse(jsonMatch[0]);
            return rankedIds.map(id =>
                hostels.find(h => h._id.toString() === id)
            ).filter(Boolean);
        }

        return hostels;
    } catch (error) {
        console.error('Ranking error:', error);
        return hostels;
    }
};

/**
 * Generate hostel description enhancement
 */
const enhanceHostelDescription = async (hostel) => {
    if (!model) {
        return hostel.description;
    }

    try {
        const prompt = `Enhance this hostel description to be more appealing and informative:

Name: ${hostel.name}
Location: ${hostel.location}
Price: PKR ${hostel.price}/month
Amenities: ${hostel.amenities?.join(', ')}
Current Description: ${hostel.description || 'No description'}

Write a compelling 2-3 sentence description highlighting key features. Be concise and professional.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('Description enhancement error:', error);
        return hostel.description;
    }
};

module.exports = {
    getPersonalizedRecommendations,
    parseSearchQuery,
    getSearchSuggestions,
    rankSearchResults,
    enhanceHostelDescription
};
