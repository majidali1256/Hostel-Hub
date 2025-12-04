const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['email', 'phone', 'identity', 'address', 'business']
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'expired'],
        default: 'pending'
    },
    data: {
        // Type-specific data
        email: String,
        phone: String,
        documentType: String, // 'cnic', 'passport', 'driving_license'
        documentNumber: String,
        fullName: String,
        address: String,
        city: String,
        country: String
    },
    documents: [{
        url: String,
        type: String, // 'front', 'back', 'selfie'
        uploadedAt: Date
    }],
    verificationCode: String,
    verificationCodeExpiry: Date,
    attempts: {
        type: Number,
        default: 0
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date,
    expiresAt: Date,
    rejectionReason: String,
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
verificationSchema.index({ userId: 1, type: 1 });
verificationSchema.index({ status: 1 });
verificationSchema.index({ verificationCode: 1 });
verificationSchema.index({ expiresAt: 1 });

// Update timestamp on save
verificationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Check if verification is expired
verificationSchema.methods.isExpired = function () {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
};

// Generate verification code
verificationSchema.methods.generateCode = function () {
    this.verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    return this.verificationCode;
};

module.exports = mongoose.model('Verification', verificationSchema);
