const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    targetModel: {
        type: String,
        required: true,
        enum: ['User', 'Hostel', 'Review', 'Booking', 'Report', 'SystemSetting']
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String
    },
    reason: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes
adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ targetId: 1 });
adminLogSchema.index({ action: 1 });

// Static method to log action
adminLogSchema.statics.logAction = async function (adminId, action, targetId, targetModel, details, ipAddress, reason) {
    return this.create({
        adminId,
        action,
        targetId,
        targetModel,
        details,
        ipAddress,
        reason
    });
};

module.exports = mongoose.model('AdminLog', adminLogSchema);
