const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'json'],
        required: true
    },
    group: {
        type: String,
        enum: ['general', 'fees', 'limits', 'features', 'maintenance'],
        default: 'general'
    },
    description: {
        type: String,
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
