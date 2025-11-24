const Booking = require('../models/Booking');
const Availability = require('../models/Availability');

// Check if dates are available for booking
async function checkAvailability(hostelId, checkIn, checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate dates
    if (checkInDate >= checkOutDate) {
        throw new Error('Check-out date must be after check-in date');
    }

    if (checkInDate < new Date()) {
        throw new Error('Check-in date must be in the future');
    }

    // Get availability settings
    const availability = await Availability.findOne({ hostelId });

    if (availability) {
        // Check if dates are blocked
        if (availability.isBlocked(checkInDate, checkOutDate)) {
            return { available: false, reason: 'Dates are blocked by owner' };
        }

        // Check stay duration
        const duration = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

        if (duration < availability.minStayDuration) {
            return {
                available: false,
                reason: `Minimum stay is ${availability.minStayDuration} days`
            };
        }

        if (duration > availability.maxStayDuration) {
            return {
                available: false,
                reason: `Maximum stay is ${availability.maxStayDuration} days`
            };
        }

        // Check advance booking limit
        const daysInAdvance = Math.ceil((checkInDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysInAdvance > availability.advanceBookingDays) {
            return {
                available: false,
                reason: `Can only book ${availability.advanceBookingDays} days in advance`
            };
        }
    }

    // Check for conflicting bookings
    const conflictingBookings = await Booking.find({
        hostelId,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
            {
                checkIn: { $lt: checkOutDate },
                checkOut: { $gt: checkInDate }
            }
        ]
    });

    if (conflictingBookings.length > 0) {
        return { available: false, reason: 'Dates conflict with existing booking' };
    }

    return { available: true };
}

// Get available date ranges for a hostel
async function getAvailableDates(hostelId, startDate, endDate) {
    const availability = await Availability.findOne({ hostelId });
    const bookings = await Booking.find({
        hostelId,
        status: { $in: ['pending', 'confirmed'] },
        checkIn: { $lte: endDate },
        checkOut: { $gte: startDate }
    }).sort({ checkIn: 1 });

    const blockedRanges = [];

    // Add blocked dates from availability
    if (availability && availability.blockedDates) {
        availability.blockedDates.forEach(blocked => {
            blockedRanges.push({
                start: blocked.startDate,
                end: blocked.endDate,
                reason: blocked.reason || 'Blocked by owner'
            });
        });
    }

    // Add booked dates
    bookings.forEach(booking => {
        blockedRanges.push({
            start: booking.checkIn,
            end: booking.checkOut,
            reason: 'Already booked'
        });
    });

    return { blockedRanges };
}

// Calculate total price for a booking
function calculatePrice(pricePerMonth, checkIn, checkOut) {
    const duration = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const pricePerDay = pricePerMonth / 30;
    return Math.round(pricePerDay * duration);
}

module.exports = {
    checkAvailability,
    getAvailableDates,
    calculatePrice
};
