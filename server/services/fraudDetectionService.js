const FraudReport = require('../models/FraudReport');
const ImageFingerprint = require('../models/ImageFingerprint');
const Hostel = require('../models/Hostel');
const User = require('../models/User');
const crypto = require('crypto');

class FraudDetectionService {
    // Suspicious keywords for text analysis
    static suspiciousKeywords = [
        'wire transfer', 'western union', 'moneygram', 'bitcoin', 'cryptocurrency',
        'advance payment', 'deposit first', 'pay upfront', 'send money',
        'whatsapp', 'telegram', 'contact me at', 'email me at',
        'too good to be true', 'limited time', 'act now', 'urgent',
        'guaranteed', '100% safe', 'risk free', 'no questions asked'
    ];

    static contactPatterns = [
        /\b\d{10}\b/, // Phone numbers
        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone with separators
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
        /whatsapp/i,
        /telegram/i,
        /\+\d{1,3}\s?\d{6,}/  // International phone
    ];

    // Generate simple perceptual hash (in production, use a proper library)
    static generateImageFingerprint(imageUrl) {
        // Simplified fingerprint - in production use actual perceptual hashing
        return crypto.createHash('md5').update(imageUrl).digest('hex');
    }

    // Check images for duplicates
    static async checkImages(images, hostelId) {
        const results = {
            duplicates: [],
            score: 0,
            flags: []
        };

        for (const imageUrl of images) {
            const fingerprint = this.generateImageFingerprint(imageUrl);
            const duplicates = await ImageFingerprint.findDuplicates(fingerprint, hostelId);

            if (duplicates.length > 0) {
                results.duplicates.push({
                    imageUrl,
                    duplicateCount: duplicates.length,
                    duplicateHostels: duplicates.map(d => ({
                        hostelId: d.hostelId._id,
                        hostelName: d.hostelId.name,
                        uploadedBy: d.uploadedBy._id
                    }))
                });
                results.score += Math.min(duplicates.length * 10, 30);
                results.flags.push(`Image found in ${duplicates.length} other listing(s)`);
            }

            // Save fingerprint
            await ImageFingerprint.create({
                hostelId,
                imageUrl,
                fingerprint,
                uploadedBy: hostelId // This should be the actual user ID
            });
        }

        return results;
    }

    // Analyze text for suspicious patterns
    static analyzeText(text) {
        const results = {
            score: 0,
            flags: [],
            suspiciousWords: [],
            contactInfo: []
        };

        if (!text) return results;

        const lowerText = text.toLowerCase();

        // Check for suspicious keywords
        this.suspiciousKeywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                results.suspiciousWords.push(keyword);
                results.score += 3;
                results.flags.push(`Contains suspicious keyword: "${keyword}"`);
            }
        });

        // Check for contact information
        this.contactPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                results.contactInfo.push(...matches);
                results.score += 5;
                results.flags.push('Contains contact information in description');
            }
        });

        // Check for excessive caps
        const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
        if (capsRatio > 0.3 && text.length > 50) {
            results.score += 2;
            results.flags.push('Excessive use of capital letters');
        }

        // Check for excessive punctuation
        const punctRatio = (text.match(/[!?]{2,}/g) || []).length;
        if (punctRatio > 3) {
            results.score += 2;
            results.flags.push('Excessive punctuation');
        }

        // Cap the score at 25
        results.score = Math.min(results.score, 25);

        return results;
    }

    // Analyze user behavior
    static async analyzeBehavior(userId) {
        const results = {
            score: 0,
            flags: []
        };

        const user = await User.findById(userId);
        if (!user) return results;

        // Check account age
        const accountAge = (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24); // days
        if (accountAge < 7) {
            results.score += 5;
            results.flags.push('Account less than 7 days old');
        }

        // Check if email verified
        if (!user.isVerified) {
            results.score += 5;
            results.flags.push('Email not verified');
        }

        // Check number of listings
        const listingCount = await Hostel.countDocuments({ ownerId: userId });
        if (listingCount > 10) {
            results.score += 5;
            results.flags.push('User has many listings');
        }

        // Check for previous fraud reports
        const previousReports = await FraudReport.countDocuments({
            reportedUserId: userId,
            status: 'confirmed'
        });
        if (previousReports > 0) {
            results.score += 10;
            results.flags.push(`User has ${previousReports} confirmed fraud report(s)`);
        }

        // Cap at 20
        results.score = Math.min(results.score, 20);

        return results;
    }

    // Analyze price anomalies
    static async analyzePrice(hostel) {
        const results = {
            score: 0,
            flags: []
        };

        // Get average price for similar hostels in the area
        const similarHostels = await Hostel.find({
            category: hostel.category,
            'location.city': hostel.location?.city,
            _id: { $ne: hostel._id }
        }).select('price');

        if (similarHostels.length > 0) {
            const avgPrice = similarHostels.reduce((sum, h) => sum + h.price, 0) / similarHostels.length;
            const priceDiff = Math.abs(hostel.price - avgPrice) / avgPrice;

            // If price is 50% below average
            if (hostel.price < avgPrice * 0.5) {
                results.score += 15;
                results.flags.push('Price significantly below market average');
            }
            // If price is 200% above average
            else if (hostel.price > avgPrice * 2) {
                results.score += 10;
                results.flags.push('Price significantly above market average');
            }
        }

        return results;
    }

    // Calculate overall risk score
    static async calculateRiskScore(hostelId) {
        const hostel = await Hostel.findById(hostelId);
        if (!hostel) throw new Error('Hostel not found');

        // Analyze all aspects
        const imageResults = await this.checkImages(hostel.images || [], hostelId);
        const textResults = this.analyzeText(hostel.description);
        const behaviorResults = await this.analyzeBehavior(hostel.ownerId);
        const priceResults = await this.analyzePrice(hostel);

        const totalScore =
            imageResults.score +
            textResults.score +
            behaviorResults.score +
            priceResults.score;

        const allFlags = [
            ...imageResults.flags,
            ...textResults.flags,
            ...behaviorResults.flags,
            ...priceResults.flags
        ];

        // Determine risk level
        let riskLevel = 'low';
        if (totalScore >= 70) riskLevel = 'critical';
        else if (totalScore >= 50) riskLevel = 'high';
        else if (totalScore >= 30) riskLevel = 'medium';

        // Calculate confidence based on number of flags
        const confidence = Math.min((allFlags.length / 10) * 100, 100);

        return {
            imageScore: imageResults.score,
            textScore: textResults.score,
            behaviorScore: behaviorResults.score,
            priceScore: priceResults.score,
            totalRiskScore: totalScore,
            riskLevel,
            confidence,
            flags: allFlags,
            details: {
                images: imageResults,
                text: textResults,
                behavior: behaviorResults,
                price: priceResults
            }
        };
    }

    // Create fraud report with AI analysis
    static async createReport(reportData) {
        const report = new FraudReport(reportData);

        // Run AI analysis if hostel is provided
        if (reportData.hostelId) {
            const analysis = await this.calculateRiskScore(reportData.hostelId);
            report.aiAnalysis = {
                ...analysis,
                analyzedAt: new Date()
            };
        }

        await report.save();
        return report;
    }
}

module.exports = FraudDetectionService;
