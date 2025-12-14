const mongoose = require('mongoose');

const imageFingerprintSchema = new mongoose.Schema({
    hostelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    fingerprint: {
        type: String,
        required: true,
        index: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient lookups (hash already has index: true in field)
imageFingerprintSchema.index({ hostelId: 1 });
imageFingerprintSchema.index({ uploadedBy: 1 });

// Static method to find duplicates
imageFingerprintSchema.statics.findDuplicates = async function (fingerprint, excludeHostelId) {
    const query = { fingerprint };
    if (excludeHostelId) {
        query.hostelId = { $ne: excludeHostelId };
    }
    return await this.find(query).populate('hostelId uploadedBy');
};

// Static method to find similar (Hamming distance)
imageFingerprintSchema.statics.findSimilar = async function (fingerprint, threshold = 5) {
    // In a real implementation, you would use a more sophisticated similarity search
    // For now, we'll just do exact matches
    return await this.find({ fingerprint }).populate('hostelId uploadedBy');
};

module.exports = mongoose.model('ImageFingerprint', imageFingerprintSchema);
