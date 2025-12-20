const mongoose = require('mongoose');

const trustScoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    score: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
    },
    // Verification factors
    factors: {
        verifiedEmail: {
            type: Boolean,
            default: false
        },
        verifiedPhone: {
            type: Boolean,
            default: false
        },
        verifiedId: {
            type: Boolean,
            default: false
        },
        completedBookings: {
            type: Number,
            default: 0
        },
        responseRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        responseTime: {
            type: Number,
            default: 0 // in hours
        },
        cancellationRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        positiveReviews: {
            type: Number,
            default: 0
        },
        accountAge: {
            type: Number,
            default: 0 // in days
        },
        // Document verification status: none, submitted, verified, rejected
        documentStatus: {
            type: String,
            enum: ['none', 'submitted', 'verified', 'rejected'],
            default: 'none'
        },
        // Number of reports against this user
        reportsCount: {
            type: Number,
            default: 0
        }
    },
    // Achievement badges
    badges: [{
        type: String,
        enum: [
            'verified',
            'superhost',
            'responsive',
            'reliable',
            'experienced',
            'new',
            'top-rated'
        ]
    }],
    lastCalculated: {
        type: Date,
        default: Date.now
    }
});

// Index (userId already has unique: true which creates an index)
trustScoreSchema.index({ score: -1 });

// Method to calculate trust score based on document verification and reports
trustScoreSchema.methods.calculate = async function () {
    const factors = this.factors;
    let score = 50; // Base score for all users

    // Document verification status
    switch (factors.documentStatus) {
        case 'submitted':
            score = 75; // Documents submitted, pending verification
            break;
        case 'verified':
            score = 100; // Documents verified by admin
            break;
        case 'rejected':
            score = 50; // Documents rejected, back to base
            break;
        case 'none':
        default:
            score = 50; // No documents submitted
    }

    // Deduct points for reports against user (5 points per report)
    if (factors.reportsCount > 0) {
        score = Math.max(0, score - (factors.reportsCount * 5));
    }

    this.score = Math.max(0, Math.min(Math.round(score), 100));
    this.lastCalculated = new Date();

    // Assign badges based on score and factors
    this.assignBadges();

    return this.save();
};

// Method to assign badges
trustScoreSchema.methods.assignBadges = function () {
    const badges = [];
    const factors = this.factors;

    // Verified badge
    if (factors.verifiedEmail && factors.verifiedPhone) {
        badges.push('verified');
    }

    // Superhost badge
    if (this.score >= 90 && factors.completedBookings >= 10 && factors.positiveReviews >= 8) {
        badges.push('superhost');
    }

    // Responsive badge
    if (factors.responseRate >= 90 && factors.responseTime <= 2) {
        badges.push('responsive');
    }

    // Reliable badge
    if (factors.cancellationRate <= 5 && factors.completedBookings >= 5) {
        badges.push('reliable');
    }

    // Experienced badge
    if (factors.completedBookings >= 20) {
        badges.push('experienced');
    }

    // New badge
    if (factors.accountAge <= 30) {
        badges.push('new');
    }

    // Top-rated badge
    if (this.score >= 85 && factors.positiveReviews >= 5) {
        badges.push('top-rated');
    }

    this.badges = badges;
};

// Static method to update trust score for a user
trustScoreSchema.statics.updateForUser = async function (userId) {
    const User = mongoose.models.User || require('./User');
    const Booking = mongoose.models.Booking || require('./Booking');
    const Review = mongoose.models.Review || require('./Review');
    const Verification = mongoose.models.Verification || require('./Verification');
    const FraudReport = mongoose.models.FraudReport || require('./FraudReport');

    let trustScore = await this.findOne({ userId });
    if (!trustScore) {
        trustScore = new this({ userId });
    }

    const user = await User.findById(userId);
    if (!user) return null;

    // Update verification status
    trustScore.factors.verifiedEmail = user.isVerified || false;
    trustScore.factors.verifiedPhone = user.phoneVerified || false;
    trustScore.factors.verifiedId = user.idVerified || false;

    // Calculate account age
    const accountAge = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));
    trustScore.factors.accountAge = accountAge;

    // Get document verification status from Verification model
    try {
        const verification = await Verification.findOne({
            userId,
            type: 'identity'
        }).sort({ createdAt: -1 });

        if (verification) {
            if (verification.status === 'approved' || verification.status === 'verified') {
                trustScore.factors.documentStatus = 'verified';
            } else if (verification.status === 'rejected') {
                trustScore.factors.documentStatus = 'rejected';
            } else if (verification.status === 'pending') {
                trustScore.factors.documentStatus = 'submitted';
            } else {
                trustScore.factors.documentStatus = 'none';
            }
        } else {
            trustScore.factors.documentStatus = 'none';
        }
    } catch (err) {
        console.error('Error checking verification status:', err);
        trustScore.factors.documentStatus = 'none';
    }

    // Count reports against this user
    try {
        const reportsCount = await FraudReport.countDocuments({
            reportedUserId: userId,
            status: { $in: ['pending', 'investigating', 'confirmed'] }
        });
        trustScore.factors.reportsCount = reportsCount;
    } catch (err) {
        console.error('Error counting reports:', err);
        trustScore.factors.reportsCount = 0;
    }

    // Count completed bookings
    const completedBookings = await Booking.countDocuments({
        $or: [{ customerId: userId }, { hostelId: { $in: await getHostelIds(userId) } }],
        status: 'completed'
    });
    trustScore.factors.completedBookings = completedBookings;

    // Calculate cancellation rate
    const totalBookings = await Booking.countDocuments({
        customerId: userId
    });
    const cancelledBookings = await Booking.countDocuments({
        customerId: userId,
        status: 'cancelled'
    });
    trustScore.factors.cancellationRate = totalBookings > 0
        ? Math.round((cancelledBookings / totalBookings) * 100)
        : 0;

    // Count positive reviews
    const positiveReviews = await Review.countDocuments({
        reviewerId: userId,
        rating: { $gte: 4 },
        status: 'approved'
    });
    trustScore.factors.positiveReviews = positiveReviews;

    // Calculate response rate and time (for owners)
    if (user.role === 'owner') {
        // This would need message tracking implementation
        trustScore.factors.responseRate = 85; // Placeholder
        trustScore.factors.responseTime = 2; // Placeholder
    }

    await trustScore.calculate();
    return trustScore;
};

// Helper function to get hostel IDs for a user
async function getHostelIds(userId) {
    const Hostel = mongoose.models.Hostel || require('./Hostel');
    const hostels = await Hostel.find({ ownerId: userId }).select('_id');
    return hostels.map(h => h._id);
}

module.exports = mongoose.model('TrustScore', trustScoreSchema);
