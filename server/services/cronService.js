const cron = require('node-cron');
const Booking = require('../models/Booking');
const emailService = require('./emailService');

const initCronJobs = () => {
    console.log('⏰ Initializing Cron Jobs...');

    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('🔄 Running daily automated tasks...');
        await checkPaymentReminders();
        await checkCheckInReminders();
        await checkReviewReminders();
        console.log('✅ Daily automated tasks completed.');
    });
};

// 1. Payment Reminders: Send if payment is pending and booking was created > 24h ago
const checkPaymentReminders = async () => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const pendingBookings = await Booking.find({
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: { $lt: twentyFourHoursAgo },
            // Avoid sending multiple reminders (assuming we might add a flag later, for now just check date)
            // In a real app, we'd add a 'reminderSent' flag to the booking model
        })
            .populate('customerId')
            .populate('hostelId');

        console.log(`Found ${pendingBookings.length} bookings needing payment reminders.`);

        for (const booking of pendingBookings) {
            // Skip if customer or hostel is missing (data integrity)
            if (!booking.customerId || !booking.hostelId) continue;

            await emailService.sendPaymentReminder(booking, booking.customerId, booking.hostelId);
            console.log(`📧 Payment reminder sent for booking ${booking._id}`);

            // Ideally, update booking to mark reminder sent
        }
    } catch (error) {
        console.error('❌ Error in checkPaymentReminders:', error);
    }
};

// 2. Check-in Reminders: Send if check-in is tomorrow
const checkCheckInReminders = async () => {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        const upcomingBookings = await Booking.find({
            status: 'confirmed',
            checkIn: {
                $gte: tomorrow,
                $lt: dayAfterTomorrow
            }
        })
            .populate('customerId')
            .populate('hostelId');

        console.log(`Found ${upcomingBookings.length} bookings needing check-in reminders.`);

        for (const booking of upcomingBookings) {
            if (!booking.customerId || !booking.hostelId) continue;

            await emailService.sendCheckInReminder(booking, booking.customerId, booking.hostelId);
            console.log(`📧 Check-in reminder sent for booking ${booking._id}`);
        }
    } catch (error) {
        console.error('❌ Error in checkCheckInReminders:', error);
    }
};

// 3. Review Reminders: Send if check-out was yesterday
const checkReviewReminders = async () => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completedBookings = await Booking.find({
            status: 'confirmed', // Or 'completed' if we have that status transition
            checkOut: {
                $gte: yesterday,
                $lt: today
            }
        })
            .populate('customerId')
            .populate('hostelId');

        console.log(`Found ${completedBookings.length} bookings needing review reminders.`);

        for (const booking of completedBookings) {
            if (!booking.customerId || !booking.hostelId) continue;

            await emailService.sendReviewReminder(booking, booking.customerId, booking.hostelId);
            console.log(`📧 Review reminder sent for booking ${booking._id}`);

            // Auto-complete booking if needed
            if (booking.status !== 'completed') {
                booking.status = 'completed';
                await booking.save();
            }
        }
    } catch (error) {
        console.error('❌ Error in checkReviewReminders:', error);
    }
};

module.exports = { initCronJobs };
