const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    targetModel: {
        type: String,
        required: true,
        enum: ['User', 'Hostel', 'Review', 'Message']
    },
    reason: {
        type: String,
        required: true,
        enum: ['spam', 'harassment', 'fraud', 'inappropriate', 'misleading', 'other']
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'investigating', 'resolved', 'dismissed'],
        default: 'pending'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolution: {
        action: {
            type: String,
            enum: ['none', 'warning', 'suspension', 'ban', 'delete_content']
        },
        note: String,
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        resolvedAt: Date
    },
    evidence: [{
        type: String, // URL to screenshot or file
        description: String
    }]
}, {
    timestamps: true
});

// Indexes
reportSchema.index({ status: 1, createdAt: 1 });
reportSchema.index({ reporterId: 1 });
reportSchema.index({ targetId: 1 });

// Methods
reportSchema.methods.assign = async function (adminId) {
    this.assignedTo = adminId;
    this.status = 'investigating';
    return this.save();
};

reportSchema.methods.resolve = async function (adminId, action, note) {
    this.status = 'resolved';
    this.resolution = {
        action,
        note,
        resolvedBy: adminId,
        resolvedAt: new Date()
    };
    return this.save();
};

module.exports = mongoose.model('Report', reportSchema);
