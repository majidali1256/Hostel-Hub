const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

/**
 * Convert natural language query to structured filters
 */
const interpretQuery = async (query) => {
    const prompt = `
You are a hostel search assistant. Convert this natural language query into structured JSON filters.

Query: "${query}"

Available filters:
- category: "Shared Room", "Private Room", "Entire Place", "Dormitory"
- genderPreference: "boys", "girls", "any"
- minPrice: number
- maxPrice: number
- amenities: array of strings (e.g., ["WiFi", "Kitchen", "Parking", "AC", "Laundry"])
- location: string
- minRating: number (1-5)

Return ONLY a valid JSON object with the relevant filters. If a filter is not mentioned, omit it.
Example: {"category":"Shared Room","amenities":["WiFi"],"maxPrice":1000}
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return {};
    } catch (error) {
        console.error('Error interpreting query:', error);
        return {};
    }
};

/**
 * Generate personalized hostel recommendations
 */
const generateRecommendations = async (userProfile, hostels) => {
    const hostelSummary = hostels.slice(0, 10).map(h => ({
        id: h.id,
        name: h.name,
        location: h.location,
        price: h.price,
        category: h.category,
        rating: h.rating,
        amenities: h.amenities
    }));

    const prompt = `
You are a hostel recommendation expert. Based on the user profile and available hostels, recommend the top 5 hostels and explain why.

User Profile:
${JSON.stringify(userProfile, null, 2)}

Available Hostels:
${JSON.stringify(hostelSummary, null, 2)}

Return a JSON array of recommendations with this format:
[
  {
    "hostelId": "id",
    "reason": "brief explanation why this hostel is recommended",
    "score": number (0-100)
  }
]

Consider: user preferences, past searches, budget, location, amenities, and ratings.
Return ONLY the JSON array.
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return [];
    } catch (error) {
        console.error('Error generating recommendations:', error);
        return [];
    }
};

/**
 * AI-powered ranking of search results
 */
const rankHostels = async (query, userPreferences, hostels) => {
    const hostelSummary = hostels.map(h => ({
        id: h.id,
        name: h.name,
        location: h.location,
        price: h.price,
        category: h.category,
        rating: h.rating,
        amenities: h.amenities,
        reviews: h.reviews?.length || 0
    }));

    const prompt = `
You are a hostel ranking AI. Rank these hostels based on the user's query and preferences.

User Query: "${query}"
User Preferences: ${JSON.stringify(userPreferences)}

Hostels:
${JSON.stringify(hostelSummary, null, 2)}

Return a JSON array of hostel IDs in ranked order (best first):
["id1", "id2", "id3", ...]

Consider: relevance to query, price-value ratio, ratings, amenities match, location convenience.
Return ONLY the JSON array of IDs.
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const rankedIds = JSON.parse(jsonMatch[0]);
            // Reorder hostels based on AI ranking
            const rankedHostels = [];
            rankedIds.forEach(id => {
                const hostel = hostels.find(h => h.id === id);
                if (hostel) rankedHostels.push(hostel);
            });
            // Add any hostels not in the ranking at the end
            hostels.forEach(h => {
                if (!rankedIds.includes(h.id)) rankedHostels.push(h);
            });
            return rankedHostels;
        }
        return hostels;
    } catch (error) {
        console.error('Error ranking hostels:', error);
        return hostels;
    }
};

/**
 * Generate search suggestions based on partial input
 */
const generateSuggestions = async (partialQuery, recentSearches = []) => {
    const prompt = `
Generate 5 search suggestions for a hostel search platform.

Partial query: "${partialQuery}"
Recent searches: ${JSON.stringify(recentSearches)}

Return ONLY a JSON array of suggestion strings:
["suggestion 1", "suggestion 2", ...]

Make suggestions relevant, specific, and helpful.
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return [];
    } catch (error) {
        console.error('Error generating suggestions:', error);
        return [];
    }
};

module.exports = {
    interpretQuery,
    generateRecommendations,
    rankHostels,
    generateSuggestions
};
