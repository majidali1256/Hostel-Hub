const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },
    attachments: [{
        url: String,
        type: String,
        name: String,
        size: Number
    }],
    readBy: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: Date
    }],
    starredBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

// Method to check if read by user
messageSchema.methods.isReadBy = function (userId) {
    return this.readBy.some(r => r.userId.toString() === userId.toString());
};

// Method to mark as read
messageSchema.methods.markAsRead = function (userId) {
    if (!this.isReadBy(userId)) {
        this.readBy.push({
            userId,
            readAt: new Date()
        });
        return this.save();
    }
    return Promise.resolve(this);
};

module.exports = mongoose.model('Message', messageSchema);
