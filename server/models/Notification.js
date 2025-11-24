const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['booking', 'message', 'review', 'appointment', 'system', 'payment'],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    data: {
        bookingId: mongoose.Schema.Types.ObjectId,
        messageId: mongoose.Schema.Types.ObjectId,
        reviewId: mongoose.Schema.Types.ObjectId,
        appointmentId: mongoose.Schema.Types.ObjectId,
        hostelId: mongoose.Schema.Types.ObjectId,
        conversationId: mongoose.Schema.Types.ObjectId,
        amount: Number,
        customData: mongoose.Schema.Types.Mixed
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    actionUrl: String,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ type: 1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
    this.read = true;
    this.readAt = new Date();
    return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function (notificationData) {
    const notification = new this(notificationData);
    await notification.save();

    // Emit real-time notification via Socket.io
    const { getIO } = require('../socket');
    const io = getIO();
    if (io) {
        io.to(`user:${notificationData.userId}`).emit('notification:new', notification);
    }

    // Send email if user preferences allow
    const NotificationPreferences = mongoose.model('NotificationPreferences');
    const preferences = await NotificationPreferences.findOne({ userId: notificationData.userId });

    if (preferences && preferences.shouldSendEmail(notificationData.type)) {
        // Email sending logic would go here
        // await sendEmail(notificationData);
    }

    return notification;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (userId) {
    return await this.countDocuments({ userId, read: false });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function (userId) {
    const result = await this.updateMany(
        { userId, read: false },
        { $set: { read: true, readAt: new Date() } }
    );
    return result;
};

module.exports = mongoose.model('Notification', notificationSchema);
