const mongoose = require('mongoose');

const imageHashSchema = new mongoose.Schema({
    hash: {
        type: String,
        required: true,
        index: true
    },
    imagePath: {
        type: String,
        required: true
    },
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
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient hash lookups
imageHashSchema.index({ hash: 1 });
imageHashSchema.index({ hostelId: 1 });

module.exports = mongoose.model('ImageHash', imageHashSchema);
