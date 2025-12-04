const mongoose = require('mongoose');

const fraudCheckSchema = new mongoose.Schema({
    hostelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    checkType: {
        type: String,
        enum: ['image', 'text', 'combined'],
        default: 'combined'
    },
    riskScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
    },
    flags: [{
        type: {
            type: String,
            enum: ['duplicate_image', 'suspicious_text', 'unrealistic_promise', 'pressure_tactic', 'payment_warning', 'contact_bypass', 'price_anomaly'],
            required: true
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high'],
            required: true
        },
        description: {
            type: String,
            required: true
        },
        evidence: mongoose.Schema.Types.Mixed
    }],
    aiAnalysis: String, // Gemini API response
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'approved', 'rejected'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    reviewNotes: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
fraudCheckSchema.index({ hostelId: 1, createdAt: -1 });
fraudCheckSchema.index({ status: 1, riskScore: -1 });
fraudCheckSchema.index({ ownerId: 1 });

module.exports = mongoose.model('FraudCheck', fraudCheckSchema);
