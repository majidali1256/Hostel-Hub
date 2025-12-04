const { imageHash } = require('image-hash');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ImageHash = require('../models/ImageHash');
const path = require('path');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Calculate perceptual hash for an image
 */
async function computeImageHash(imagePath) {
    return new Promise((resolve, reject) => {
        imageHash(imagePath, 16, true, (error, data) => {
            if (error) reject(error);
            else resolve(data);
        });
    });
}

/**
 * Calculate Hamming distance between two binary strings
 */
function hammingDistance(hash1, hash2) {
    let distance = 0;
    const minLength = Math.min(hash1.length, hash2.length);

    for (let i = 0; i < minLength; i++) {
        if (hash1[i] !== hash2[i]) {
            distance++;
        }
    }

    return distance + Math.abs(hash1.length - hash2.length);
}

/**
 * Detect duplicate images
 */
async function detectDuplicateImages(imagePaths, hostelId, ownerId) {
    const duplicates = [];
    const SIMILARITY_THRESHOLD = 10; // Hamming distance threshold

    try {
        for (const imagePath of imagePaths) {
            // Compute hash for new image
            const fullPath = path.join(__dirname, '..', '..', imagePath);
            const newHash = await computeImageHash(fullPath);

            // Find similar existing images
            const existingHashes = await ImageHash.find({}).populate('hostelId');

            for (const existing of existingHashes) {
                // Skip if same hostel
                if (existing.hostelId._id.toString() === hostelId.toString()) {
                    continue;
                }

                const distance = hammingDistance(newHash, existing.hash);

                if (distance < SIMILARITY_THRESHOLD) {
                    const similarity = ((64 - distance) / 64 * 100).toFixed(1);
                    duplicates.push({
                        matchedHostelId: existing.hostelId._id,
                        matchedHostelName: existing.hostelId.name,
                        matchedImage: existing.imagePath,
                        similarity: parseFloat(similarity),
                        distance
                    });
                }
            }

            // Store hash for future comparisons
            await ImageHash.create({
                hash: newHash,
                imagePath,
                hostelId,
                ownerId
            });
        }

        return duplicates;
    } catch (error) {
        console.error('Duplicate image detection error:', error);
        return [];
    }
}

/**
 * Scam patterns database
 */
const SCAM_PATTERNS = {
    promises: {
        patterns: [
            /100%\s*guaranteed/i,
            /risk\s*free/i,
            /guaranteed\s*profit/i,
            /no\s*risk/i,
            /can'?t\s*lose/i
        ],
        severity: 'high',
        points: 30
    },
    pressure: {
        patterns: [
            /limited\s*(time|spots?|offer)/i,
            /act\s*now/i,
            /hurry\s*up/i,
            /only\s*\d+\s*(rooms?|spots?)\s*left/i,
            /today\s*only/i,
            /this\s*deal\s*won'?t\s*last/i
        ],
        severity: 'medium',
        points: 20
    },
    payment: {
        patterns: [
            /wire\s*(transfer|money)/i,
            /western\s*union/i,
            /moneygram/i,
            /send\s*money/i,
            /cash\s*only/i,
            /pay\s*upfront/i,
            /deposit\s*required/i
        ],
        severity: 'high',
        points: 30
    },
    contact: {
        patterns: [
            /\b\d{10,11}\b/, // Phone numbers
            /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, // Emails
            /whatsapp/i,
            /call\s*me\s*at/i,
            /email\s*me\s*at/i
        ],
        severity: 'medium',
        points: 15
    },
    vague: {
        patterns: [
            /amazing\s*deal/i,
            /best\s*price/i,
            /you\s*won'?t\s*believe/i,
            /incredible\s*offer/i,
            /contact\s*for\s*details/i
        ],
        severity: 'low',
        points: 5
    }
};

/**
 * Detect scam patterns in text
 */
function detectScamPatterns(text) {
    const foundPatterns = [];

    for (const [category, config] of Object.entries(SCAM_PATTERNS)) {
        for (const pattern of config.patterns) {
            const match = text.match(pattern);
            if (match) {
                foundPatterns.push({
                    category,
                    matched: match[0],
                    severity: config.severity,
                    points: config.points
                });
            }
        }
    }

    return foundPatterns;
}

/**
 * Calculate risk score from patterns
 */
function calculateRiskScore(patterns, aiBoost = 0) {
    const patternScore = patterns.reduce((sum, p) => sum + p.points, 0);
    const totalScore = Math.min(patternScore + aiBoost, 100);
    return totalScore;
}

/**
 * Analyze text using Gemini AI
 */
async function analyzeTextWithAI(title, description) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY not set. Skipping AI analysis.');
            return null;
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
Analyze this hostel listing for fraud/scam indicators:

Title: "${title}"
Description: "${description}"

Check for:
1. Unrealistic promises or guarantees
2. Pressure tactics
3. Payment red flags
4. Contact information (bypassing platform)
5. Vague or exaggerated descriptions
6. Grammar/spelling issues suggesting unprofessionalism

Respond in this EXACT JSON format:
{
  "isSuspicious": true/false,
  "riskLevel": "low"|"medium"|"high",
  "concerns": ["concern 1", "concern 2"],
  "reasoning": "brief explanation"
}
        `.trim();

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return null;
    } catch (error) {
        console.error('Gemini AI analysis error:', error);
        return null;
    }
}

/**
 * Perform comprehensive fraud check
 */
async function performFraudCheck(hostel, imagePaths = []) {
    try {
        const flags = [];
        let riskScore = 0;

        // 1. Check for duplicate images
        if (imagePaths.length > 0) {
            const duplicates = await detectDuplicateImages(
                imagePaths,
                hostel._id || hostel.id,
                hostel.ownerId
            );

            if (duplicates.length > 0) {
                duplicates.forEach(dup => {
                    flags.push({
                        type: 'duplicate_image',
                        severity: 'high',
                        description: `Image matches ${dup.matchedHostelName} (${dup.similarity}% similar)`,
                        evidence: dup
                    });
                });
                riskScore += 40; // Major red flag
            }
        }

        // 2. Analyze text for scam patterns
        const textToAnalyze = `${hostel.name} ${hostel.description || ''}`;
        const patterns = detectScamPatterns(textToAnalyze);

        patterns.forEach(pattern => {
            flags.push({
                type: 'suspicious_text',
                severity: pattern.severity,
                description: `Detected ${pattern.category}: "${pattern.matched}"`,
                evidence: { category: pattern.category, matched: pattern.matched }
            });
        });

        riskScore += calculateRiskScore(patterns);

        // 3. AI analysis (if available)
        let aiAnalysis = null;
        try {
            aiAnalysis = await analyzeTextWithAI(hostel.name, hostel.description);

            if (aiAnalysis && aiAnalysis.isSuspicious) {
                const aiPoints = aiAnalysis.riskLevel === 'high' ? 20 :
                    aiAnalysis.riskLevel === 'medium' ? 10 : 5;
                riskScore += aiPoints;

                aiAnalysis.concerns.forEach(concern => {
                    flags.push({
                        type: 'suspicious_text',
                        severity: aiAnalysis.riskLevel,
                        description: `AI detected: ${concern}`,
                        evidence: { ai: true }
                    });
                });
            }
        } catch (aiError) {
            console.error('AI analysis failed:', aiError);
        }

        // 4. Price anomaly check (optional)
        if (hostel.price && hostel.price < 1000) {
            flags.push({
                type: 'price_anomaly',
                severity: 'medium',
                description: 'Unusually low price may indicate scam',
                evidence: { price: hostel.price }
            });
            riskScore += 15;
        }

        // Cap risk score at 100
        riskScore = Math.min(riskScore, 100);

        return {
            riskScore,
            flags,
            aiAnalysis: aiAnalysis ? JSON.stringify(aiAnalysis) : null,
            checkType: imagePaths.length > 0 ? 'combined' : 'text'
        };
    } catch (error) {
        console.error('Fraud check error:', error);
        return {
            riskScore: 0,
            flags: [],
            aiAnalysis: null,
            checkType: 'error'
        };
    }
}

module.exports = {
    detectDuplicateImages,
    analyzeTextWithAI,
    performFraudCheck,
    computeImageHash,
    detectScamPatterns,
    calculateRiskScore
};
