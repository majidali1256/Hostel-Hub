const mongoose = require('mongoose');

const fraudReportSchema = new mongoose.Schema({
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    hostelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel'
    },
    type: {
        type: String,
        enum: ['fake_listing', 'duplicate_images', 'suspicious_text', 'scam', 'impersonation', 'other'],
        required: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    evidence: {
        images: [{
            type: String
        }],
        urls: [{
            type: String
        }],
        screenshots: [{
            type: String
        }]
    },
    aiAnalysis: {
        imageScore: {
            type: Number,
            min: 0,
            max: 30,
            default: 0
        },
        textScore: {
            type: Number,
            min: 0,
            max: 25,
            default: 0
        },
        behaviorScore: {
            type: Number,
            min: 0,
            max: 20,
            default: 0
        },
        priceScore: {
            type: Number,
            min: 0,
            max: 15,
            default: 0
        },
        accountScore: {
            type: Number,
            min: 0,
            max: 10,
            default: 0
        },
        totalRiskScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        riskLevel: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'low'
        },
        confidence: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        flags: [{
            type: String
        }],
        analyzedAt: Date
    },
    status: {
        type: String,
        enum: ['pending', 'investigating', 'confirmed', 'dismissed'],
        default: 'pending'
    },
    adminNotes: String,
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
fraudReportSchema.index({ hostelId: 1 });
fraudReportSchema.index({ reportedUserId: 1 });
fraudReportSchema.index({ status: 1 });
fraudReportSchema.index({ 'aiAnalysis.riskLevel': 1 });
fraudReportSchema.index({ createdAt: -1 });

// Method to update status
fraudReportSchema.methods.updateStatus = function (status, adminId, notes) {
    this.status = status;
    if (notes) this.adminNotes = notes;
    if (status === 'confirmed' || status === 'dismissed') {
        this.resolvedBy = adminId;
        this.resolvedAt = new Date();
    }
    return this.save();
};

// Static method to get statistics
fraudReportSchema.statics.getStats = async function () {
    const total = await this.countDocuments();
    const pending = await this.countDocuments({ status: 'pending' });
    const investigating = await this.countDocuments({ status: 'investigating' });
    const confirmed = await this.countDocuments({ status: 'confirmed' });
    const dismissed = await this.countDocuments({ status: 'dismissed' });

    const byRiskLevel = await this.aggregate([
        { $group: { _id: '$aiAnalysis.riskLevel', count: { $sum: 1 } } }
    ]);

    const byType = await this.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    return {
        total,
        byStatus: { pending, investigating, confirmed, dismissed },
        byRiskLevel: byRiskLevel.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {}),
        byType: byType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {})
    };
};

module.exports = mongoose.model('FraudReport', fraudReportSchema);
