const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
    agreementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agreement',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    signatureData: {
        type: String, // Base64 image data
        required: true
    },
    signatureType: {
        type: String,
        enum: ['drawn', 'typed', 'uploaded'],
        required: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationMethod: {
        type: String,
        enum: ['email', 'sms', 'none'],
        default: 'none'
    },
    verificationToken: String,
    verifiedAt: Date
}, {
    timestamps: true
});

// Methods
signatureSchema.methods.verify = async function (token) {
    if (this.verificationToken === token) {
        this.verified = true;
        this.verifiedAt = new Date();
        return this.save();
    }
    return false;
};

module.exports = mongoose.model('Signature', signatureSchema);
