require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const User = require('./models/User');
const passport = require('./config/passport');
const Hostel = require('./models/Hostel');
const { generateAccessToken, generateRefreshToken } = require('./utils/jwt');
const { authMiddleware, roleMiddleware } = require('./middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./utils/email');

const app = express();
app.use(passport.initialize());
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel-hub';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Root route - API status
app.get('/', (req, res) => {
    res.json({
        message: 'Hostel Hub API Server',
        status: 'running',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth/*',
            users: '/api/users/*',
            hostels: '/api/hostels/*',
            search: '/api/search/*',
            recommendations: '/api/recommendations/*'
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, username, ...otherData } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = new User({
            email,
            password, // Will be hashed by pre-save hook
            username: username || email.split('@')[0],
            verificationToken,
            ...otherData
        });

        await newUser.save();

        // Send verification email (optional - don't block signup if email fails)
        try {
            if (process.env.EMAIL_USER) {
                await sendVerificationEmail(email, verificationToken);
            }
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }

        // Generate tokens
        const accessToken = generateAccessToken(newUser._id);
        const refreshToken = generateRefreshToken(newUser._id);

        res.status(201).json({
            user: newUser,
            accessToken,
            refreshToken
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// OAuth routes
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account consent' }));
app.get('/api/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
    const { accessToken, refreshToken } = req.user.tokens || {};
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${req.user._id}`);
});

app.get('/api/auth/facebook', passport.authenticate('facebook'));
app.get('/api/auth/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/login' }), (req, res) => {
    const { accessToken, refreshToken } = req.user.tokens || {};
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${req.user._id}`);
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.json({
            user,
            accessToken,
            refreshToken
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Email verification
app.get('/api/auth/verify-email/:token', async (req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        user.emailVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Request password reset
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'No account found with this email address' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send reset email
        try {
            if (process.env.EMAIL_USER) {
                await sendPasswordResetEmail(email, resetToken);
            }
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
        }

        res.json({ message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset password
app.post('/api/auth/reset-password/:token', async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        user.password = password; // Will be hashed by pre-save hook
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const path = require('path');
const multer = require('multer');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.use('/uploads', express.static('uploads'));

// User Routes
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users/:id', upload.single('profilePicture'), async (req, res) => {
    try {
        let updateData = req.body;

        if (req.file) {
            // If a file was uploaded, add the path to updateData
            // Construct full URL or relative path as needed by frontend
            const profilePictureUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            updateData = { ...updateData, profilePicture: profilePictureUrl };
        }

        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Hostel Routes
app.get('/api/hostels', async (req, res) => {
    try {
        const hostels = await Hostel.find();
        res.json(hostels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Only owners can create hostels
app.post('/api/hostels', authMiddleware, roleMiddleware('owner', 'admin'), async (req, res) => {
    try {
        const newHostel = new Hostel({
            ...req.body,
            ownerId: req.userId // Set owner to current user
        });
        await newHostel.save();
        res.status(201).json(newHostel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Only owners can update their own hostels (or admins can update any)
app.put('/api/hostels/:id', authMiddleware, async (req, res) => {
    try {
        const hostel = await Hostel.findById(req.params.id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

        const user = await User.findById(req.userId);
        if (hostel.ownerId !== req.userId && user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this hostel' });
        }

        const updatedHostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedHostel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Only owners can delete their own hostels (or admins can delete any)
app.delete('/api/hostels/:id', authMiddleware, async (req, res) => {
    try {
        const hostel = await Hostel.findById(req.params.id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

        const user = await User.findById(req.userId);
        if (hostel.ownerId !== req.userId && user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this hostel' });
        }

        await Hostel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Hostel deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add review to hostel
app.post('/api/hostels/:id/reviews', authMiddleware, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const hostel = await Hostel.findById(req.params.id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

        hostel.reviews.push({
            userId: req.userId,
            rating,
            comment
        });

        hostel.calculateAverageRating();
        await hostel.save();

        res.json(hostel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update hostel status (owner only)
app.patch('/api/hostels/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const hostel = await Hostel.findById(req.params.id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

        const user = await User.findById(req.userId);
        if (hostel.ownerId !== req.userId && user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        hostel.status = status;
        await hostel.save();

        res.json(hostel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Advanced search with filters
app.get('/api/hostels/search', async (req, res) => {
    try {
        const {
            category,
            status,
            minPrice,
            maxPrice,
            amenities,
            genderPreference,
            minRating,
            sortBy
        } = req.query;

        let query = {};

        if (category) query.category = category;
        if (status) query.status = status;
        if (genderPreference) query.genderPreference = genderPreference;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        if (amenities) {
            const amenitiesArray = amenities.split(',');
            query.amenities = { $all: amenitiesArray };
        }
        if (minRating) query.rating = { $gte: Number(minRating) };

        let hostels = await Hostel.find(query);

        // Sorting
        if (sortBy === 'price-asc') {
            hostels.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            hostels.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'rating') {
            hostels.sort((a, b) => b.rating - a.rating);
        }

        res.json(hostels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// AI-Powered Search Endpoints
const aiService = require('./services/ai');

// Natural language query search
app.post('/api/search/ai-query', async (req, res) => {
    try {
        const { query, userPreferences } = req.body;

        // Interpret natural language query
        const filters = await aiService.interpretQuery(query);

        // Build MongoDB query from AI-interpreted filters
        let mongoQuery = {};
        if (filters.category) mongoQuery.category = filters.category;
        if (filters.genderPreference) mongoQuery.genderPreference = filters.genderPreference;
        if (filters.minPrice || filters.maxPrice) {
            mongoQuery.price = {};
            if (filters.minPrice) mongoQuery.price.$gte = filters.minPrice;
            if (filters.maxPrice) mongoQuery.price.$lte = filters.maxPrice;
        }
        if (filters.amenities) mongoQuery.amenities = { $all: filters.amenities };
        if (filters.minRating) mongoQuery.rating = { $gte: filters.minRating };
        if (filters.location) mongoQuery.location = new RegExp(filters.location, 'i');

        let hostels = await Hostel.find(mongoQuery);

        // AI-powered ranking
        if (userPreferences) {
            hostels = await aiService.rankHostels(query, userPreferences, hostels);
        }

        res.json({
            filters,
            hostels,
            interpretation: `Found ${hostels.length} hostels matching your search`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get personalized recommendations
app.post('/api/recommendations/personal', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const allHostels = await Hostel.find({ status: 'Available' });

        const userProfile = {
            role: user.role,
            stayHistory: user.stayHistory,
            preferences: req.body.preferences || {}
        };

        const recommendations = await aiService.generateRecommendations(userProfile, allHostels);

        // Get full hostel details for recommended IDs
        const recommendedHostels = recommendations.map(rec => {
            const hostel = allHostels.find(h => h.id === rec.hostelId);
            return {
                ...hostel?.toJSON(),
                recommendationReason: rec.reason,
                recommendationScore: rec.score
            };
        }).filter(h => h.id); // Remove nulls

        res.json(recommendedHostels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get search suggestions
app.get('/api/search/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        const recentSearches = req.query.recent ? JSON.parse(req.query.recent) : [];

        const suggestions = await aiService.generateSuggestions(q || '', recentSearches);
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get nearby hostels (location-based)
app.get('/api/hostels/nearby', async (req, res) => {
    try {
        const { location, radius } = req.query;

        // Simple location-based search (can be enhanced with actual geolocation)
        const hostels = await Hostel.find({
            location: new RegExp(location, 'i'),
            status: 'Available'
        });

        res.json(hostels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// BOOKING ROUTES
// ============================================

const Booking = require('./models/Booking');
const Availability = require('./models/Availability');
const { checkAvailability, getAvailableDates, calculatePrice } = require('./services/availabilityService');

// Create booking request
app.post('/api/bookings', authMiddleware, async (req, res) => {
    try {
        const { hostelId, checkIn, checkOut, numberOfGuests, specialRequests } = req.body;

        // Get hostel details
        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ error: 'Hostel not found' });
        }

        // Check availability
        const availabilityCheck = await checkAvailability(hostelId, checkIn, checkOut);
        if (!availabilityCheck.available) {
            return res.status(400).json({ error: availabilityCheck.reason });
        }

        // Calculate total price
        const totalPrice = calculatePrice(hostel.price, new Date(checkIn), new Date(checkOut));

        // Create booking
        const booking = new Booking({
            hostelId,
            customerId: req.user.userId,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            numberOfGuests: numberOfGuests || 1,
            specialRequests,
            totalPrice,
            status: 'pending'
        });

        await booking.save();

        // Populate hostel and customer details
        await booking.populate('hostelId customerId');

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user's bookings
app.get('/api/bookings', authMiddleware, async (req, res) => {
    try {
        const { status } = req.query;
        const query = { customerId: req.user.userId };

        if (status) {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate('hostelId')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get booking by ID
app.get('/api/bookings/:id', authMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('hostelId customerId');

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check if user is authorized
        if (booking.customerId._id.toString() !== req.user.userId) {
            const hostel = await Hostel.findById(booking.hostelId);
            if (!hostel || hostel.ownerId.toString() !== req.user.userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get hostel bookings (owner only)
app.get('/api/hostels/:id/bookings', authMiddleware, async (req, res) => {
    try {
        const hostel = await Hostel.findById(req.params.id);

        if (!hostel) {
            return res.status(404).json({ error: 'Hostel not found' });
        }

        if (hostel.ownerId.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const bookings = await Booking.find({ hostelId: req.params.id })
            .populate('customerId')
            .sort({ checkIn: 1 });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Confirm booking (owner only)
app.post('/api/bookings/:id/confirm', authMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('hostelId');

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.hostelId.ownerId.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({ error: 'Booking is not pending' });
        }

        booking.status = 'confirmed';
        booking.confirmedAt = new Date();
        await booking.save();

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel booking
app.post('/api/bookings/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const { reason } = req.body;
        const booking = await Booking.findById(req.params.id).populate('hostelId');

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check authorization
        const isCustomer = booking.customerId.toString() === req.user.userId;
        const isOwner = booking.hostelId.ownerId.toString() === req.user.userId;

        if (!isCustomer && !isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (booking.status === 'cancelled' || booking.status === 'completed') {
            return res.status(400).json({ error: `Cannot cancel ${booking.status} booking` });
        }

        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        booking.cancelReason = reason;
        await booking.save();

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check availability
app.post('/api/bookings/check-availability', async (req, res) => {
    try {
        const { hostelId, checkIn, checkOut } = req.body;

        const result = await checkAvailability(hostelId, checkIn, checkOut);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get available dates
app.get('/api/hostels/:id/available-dates', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : new Date();
        const end = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

        const result = await getAvailableDates(req.params.id, start, end);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Set availability (owner only)
app.post('/api/hostels/:id/availability', authMiddleware, roleMiddleware(['owner', 'admin']), async (req, res) => {
    try {
        const hostel = await Hostel.findById(req.params.id);

        if (!hostel) {
            return res.status(404).json({ error: 'Hostel not found' });
        }

        if (hostel.ownerId.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        let availability = await Availability.findOne({ hostelId: req.params.id });

        if (!availability) {
            availability = new Availability({ hostelId: req.params.id });
        }

        const { blockedDates, maxCapacity, minStayDuration, maxStayDuration, advanceBookingDays } = req.body;

        if (blockedDates) availability.blockedDates = blockedDates;
        if (maxCapacity) availability.maxCapacity = maxCapacity;
        if (minStayDuration) availability.minStayDuration = minStayDuration;
        if (maxStayDuration) availability.maxStayDuration = maxStayDuration;
        if (advanceBookingDays) availability.advanceBookingDays = advanceBookingDays;

        await availability.save();
        res.json(availability);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get availability settings
app.get('/api/hostels/:id/availability', async (req, res) => {
    try {
        let availability = await Availability.findOne({ hostelId: req.params.id });

        if (!availability) {
            // Return default availability
            availability = {
                hostelId: req.params.id,
                blockedDates: [],
                maxCapacity: 1,
                minStayDuration: 1,
                maxStayDuration: 365,
                advanceBookingDays: 90
            };
        }

        res.json(availability);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// COMMUNICATION HUB ROUTES
// ============================================

const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Appointment = require('./models/Appointment');
const { emitToUser, emitToConversation } = require('./socket');

// Get user's conversations
app.get('/api/conversations', authMiddleware, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.userId
        })
            .populate('participants', 'firstName lastName email profilePicture')
            .populate('hostelId', 'name location images')
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create or get conversation
app.post('/api/conversations', authMiddleware, async (req, res) => {
    try {
        const { participantId, hostelId } = req.body;

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user.userId, participantId] },
            type: 'direct'
        }).populate('participants', 'firstName lastName email profilePicture');

        if (!conversation) {
            conversation = new Conversation({
                participants: [req.user.userId, participantId],
                hostelId,
                type: 'direct'
            });
            await conversation.save();
            await conversation.populate('participants', 'firstName lastName email profilePicture');
        }

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get conversation by ID
app.get('/api/conversations/:id', authMiddleware, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id)
            .populate('participants', 'firstName lastName email profilePicture')
            .populate('hostelId', 'name location images');

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        if (!conversation.hasParticipant(req.user.userId)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete conversation
app.delete('/api/conversations/:id', authMiddleware, async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        if (!conversation.hasParticipant(req.user.userId)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await conversation.deleteOne();
        res.json({ message: 'Conversation deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get messages for a conversation
app.get('/api/conversations/:id/messages', authMiddleware, async (req, res) => {
    try {
        const { limit = 50, before } = req.query;

        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        if (!conversation.hasParticipant(req.user.userId)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const query = { conversationId: req.params.id };
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .populate('senderId', 'firstName lastName profilePicture')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send message
app.post('/api/messages', authMiddleware, async (req, res) => {
    try {
        const { conversationId, content, type, attachments } = req.body;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        if (!conversation.hasParticipant(req.user.userId)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const message = new Message({
            conversationId,
            senderId: req.user.userId,
            content,
            type: type || 'text',
            attachments: attachments || []
        });

        await message.save();
        await message.populate('senderId', 'firstName lastName profilePicture');

        // Update conversation's last message
        conversation.lastMessage = {
            content,
            senderId: req.user.userId,
            timestamp: message.createdAt
        };
        await conversation.save();

        // Emit to conversation room
        emitToConversation(conversationId, 'message:new', message);

        // Emit notification to other participants
        const otherParticipant = conversation.getOtherParticipant(req.user.userId);
        if (otherParticipant) {
            emitToUser(otherParticipant, 'notification:message', {
                conversationId,
                message
            });
        }

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark message as read
app.patch('/api/messages/:id/read', authMiddleware, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        await message.markAsRead(req.user.userId);

        // Emit read receipt
        emitToConversation(message.conversationId, 'message:read', {
            messageId: message._id,
            userId: req.user.userId,
            readAt: new Date()
        });

        res.json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create appointment
app.post('/api/appointments', authMiddleware, async (req, res) => {
    try {
        const { hostelId, ownerId, scheduledTime, duration, type, notes, location } = req.body;

        // Validate scheduled time is in future
        if (new Date(scheduledTime) < new Date()) {
            return res.status(400).json({ error: 'Appointment must be in the future' });
        }

        const appointment = new Appointment({
            hostelId,
            customerId: req.user.userId,
            ownerId,
            scheduledTime: new Date(scheduledTime),
            duration: duration || 30,
            type: type || 'viewing',
            notes,
            location
        });

        await appointment.save();
        await appointment.populate('hostelId customerId ownerId');

        // Notify owner
        emitToUser(ownerId, 'notification:appointment', {
            type: 'new',
            appointment
        });

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get appointments
app.get('/api/appointments', authMiddleware, async (req, res) => {
    try {
        const { status, upcoming } = req.query;

        const query = {
            $or: [
                { customerId: req.user.userId },
                { ownerId: req.user.userId }
            ]
        };

        if (status) {
            query.status = status;
        }

        if (upcoming === 'true') {
            query.scheduledTime = { $gte: new Date() };
        }

        const appointments = await Appointment.find(query)
            .populate('hostelId', 'name location images')
            .populate('customerId', 'firstName lastName email phone')
            .populate('ownerId', 'firstName lastName email phone')
            .sort({ scheduledTime: 1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get appointment by ID
app.get('/api/appointments/:id', authMiddleware, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('hostelId customerId ownerId');

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Check authorization
        if (appointment.customerId._id.toString() !== req.user.userId &&
            appointment.ownerId._id.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update appointment
app.patch('/api/appointments/:id', authMiddleware, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        const { status, scheduledTime, duration, notes } = req.body;

        // Only owner can confirm
        if (status === 'confirmed' && appointment.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Only owner can confirm' });
        }

        if (status) {
            appointment.status = status;
            if (status === 'confirmed') {
                appointment.confirmedAt = new Date();
            } else if (status === 'cancelled') {
                appointment.cancelledAt = new Date();
            }
        }

        if (scheduledTime) appointment.scheduledTime = new Date(scheduledTime);
        if (duration) appointment.duration = duration;
        if (notes) appointment.notes = notes;

        await appointment.save();
        await appointment.populate('hostelId customerId ownerId');

        // Notify other party
        const notifyUserId = appointment.customerId._id.toString() === req.user.userId
            ? appointment.ownerId._id
            : appointment.customerId._id;

        emitToUser(notifyUserId, 'notification:appointment', {
            type: 'updated',
            appointment
        });

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel appointment
app.delete('/api/appointments/:id', authMiddleware, async (req, res) => {
    try {
        const { reason } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Check authorization
        if (appointment.customerId.toString() !== req.user.userId &&
            appointment.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        appointment.status = 'cancelled';
        appointment.cancelledAt = new Date();
        appointment.cancelReason = reason;
        await appointment.save();

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// REVIEWS AND TRUST SYSTEM ROUTES
// ============================================

const Review = require('./models/Review');
const TrustScore = require('./models/TrustScore');

// Submit review
app.post('/api/reviews', authMiddleware, async (req, res) => {
    try {
        const { hostelId, bookingId, rating, cleanliness, accuracy, communication, location, value, title, comment, photos } = req.body;

        // Verify booking exists and is completed
        if (bookingId) {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }
            if (booking.customerId.toString() !== req.user.userId) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            if (booking.status !== 'completed') {
                return res.status(400).json({ error: 'Can only review completed bookings' });
            }

            // Check if already reviewed
            const existingReview = await Review.findOne({ bookingId });
            if (existingReview) {
                return res.status(400).json({ error: 'Booking already reviewed' });
            }
        }

        const review = new Review({
            hostelId,
            bookingId,
            reviewerId: req.user.userId,
            rating,
            cleanliness,
            accuracy,
            communication,
            location,
            value,
            title,
            comment,
            photos: photos || []
        });

        await review.save();
        await review.populate('reviewerId', 'firstName lastName profilePicture');

        // Update hostel average rating
        const ratings = await Review.getHostelRatings(hostelId);
        await Hostel.findByIdAndUpdate(hostelId, {
            averageRating: ratings.avgRating,
            totalReviews: ratings.totalReviews
        });

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get reviews (filtered)
app.get('/api/reviews', async (req, res) => {
    try {
        const { hostelId, reviewerId, minRating, status } = req.query;
        const query = {};

        if (hostelId) query.hostelId = hostelId;
        if (reviewerId) query.reviewerId = reviewerId;
        if (minRating) query.rating = { $gte: parseInt(minRating) };
        if (status) query.status = status;
        else query.status = 'approved'; // Default to approved only

        const reviews = await Review.find(query)
            .populate('reviewerId', 'firstName lastName profilePicture')
            .populate('hostelId', 'name location')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get review by ID
app.get('/api/reviews/:id', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('reviewerId', 'firstName lastName profilePicture')
            .populate('hostelId', 'name location images')
            .populate('response.responderId', 'firstName lastName');

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update review
app.patch('/api/reviews/:id', authMiddleware, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (review.reviewerId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { rating, cleanliness, accuracy, communication, location, value, title, comment } = req.body;

        if (rating) review.rating = rating;
        if (cleanliness) review.cleanliness = cleanliness;
        if (accuracy) review.accuracy = accuracy;
        if (communication) review.communication = communication;
        if (location) review.location = location;
        if (value) review.value = value;
        if (title) review.title = title;
        if (comment) review.comment = comment;

        await review.save();
        res.json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete review
app.delete('/api/reviews/:id', authMiddleware, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (review.reviewerId.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await review.deleteOne();
        res.json({ message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark review as helpful
app.post('/api/reviews/:id/helpful', authMiddleware, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        await review.toggleHelpful(req.user.userId);
        res.json({ helpfulCount: review.helpfulCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add owner response to review
app.post('/api/reviews/:id/response', authMiddleware, roleMiddleware(['owner', 'admin']), async (req, res) => {
    try {
        const { content } = req.body;
        const review = await Review.findById(req.params.id).populate('hostelId');

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Verify user owns the hostel
        if (review.hostelId.ownerId.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        review.response = {
            content,
            responderId: req.user.userId,
            respondedAt: new Date()
        };

        await review.save();
        await review.populate('response.responderId', 'firstName lastName');

        res.json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get hostel reviews
app.get('/api/hostels/:id/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({
            hostelId: req.params.id,
            status: 'approved'
        })
            .populate('reviewerId', 'firstName lastName profilePicture')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get hostel rating statistics
app.get('/api/hostels/:id/rating', async (req, res) => {
    try {
        const ratings = await Review.getHostelRatings(req.params.id);
        res.json(ratings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user reviews
app.get('/api/users/:id/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({
            reviewerId: req.params.id,
            status: 'approved'
        })
            .populate('hostelId', 'name location images')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user trust score
app.get('/api/users/:id/trust-score', async (req, res) => {
    try {
        let trustScore = await TrustScore.findOne({ userId: req.params.id });

        if (!trustScore) {
            // Create and calculate if doesn't exist
            trustScore = await TrustScore.updateForUser(req.params.id);
        }

        // Recalculate if older than 24 hours
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (trustScore && trustScore.lastCalculated < dayAgo) {
            trustScore = await TrustScore.updateForUser(req.params.id);
        }

        res.json(trustScore || { score: 50, badges: [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update trust score (manual trigger)
app.post('/api/users/:id/trust-score/update', authMiddleware, async (req, res) => {
    try {
        if (req.params.id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const trustScore = await TrustScore.updateForUser(req.params.id);
        res.json(trustScore);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user badges
app.get('/api/users/:id/badges', async (req, res) => {
    try {
        const trustScore = await TrustScore.findOne({ userId: req.params.id });
        res.json({ badges: trustScore?.badges || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// NOTIFICATIONS ROUTES
// ============================================

const Notification = require('./models/Notification');
const NotificationPreferences = require('./models/NotificationPreferences');

// Get user notifications
app.get('/api/notifications', authMiddleware, async (req, res) => {
    try {
        const { limit = 50, skip = 0, unreadOnly } = req.query;
        const query = { userId: req.user.userId };

        if (unreadOnly === 'true') {
            query.read = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.getUnreadCount(req.user.userId);

        res.json({
            notifications,
            total,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get unread count
app.get('/api/notifications/unread', authMiddleware, async (req, res) => {
    try {
        const count = await Notification.getUnreadCount(req.user.userId);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.userId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await notification.markAsRead();
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark all notifications as read
app.patch('/api/notifications/read-all', authMiddleware, async (req, res) => {
    try {
        const result = await Notification.markAllAsRead(req.user.userId);
        res.json({
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete notification
app.delete('/api/notifications/:id', authMiddleware, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.userId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await notification.deleteOne();
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get notification preferences
app.get('/api/notifications/preferences', authMiddleware, async (req, res) => {
    try {
        const preferences = await NotificationPreferences.getOrCreate(req.user.userId);
        res.json(preferences);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update notification preferences
app.patch('/api/notifications/preferences', authMiddleware, async (req, res) => {
    try {
        const { email, push, inApp } = req.body;

        let preferences = await NotificationPreferences.findOne({ userId: req.user.userId });

        if (!preferences) {
            preferences = new NotificationPreferences({ userId: req.user.userId });
        }

        if (email) preferences.email = { ...preferences.email, ...email };
        if (push) preferences.push = { ...preferences.push, ...push };
        if (inApp) preferences.inApp = { ...preferences.inApp, ...inApp };

        preferences.updatedAt = new Date();
        await preferences.save();

        res.json(preferences);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create HTTP server and initialize Socket.io
const http = require('http');
const server = http.createServer(app);
const { initializeSocket } = require('./socket');
initializeSocket(server);

// ============================================
// FRAUD DETECTION ROUTES
// ============================================

const FraudReport = require('./models/FraudReport');
const FraudDetectionService = require('./services/fraudDetectionService');

// Submit fraud report
app.post('/api/fraud/report', authMiddleware, async (req, res) => {
    try {
        const { reportedUserId, hostelId, type, description, evidence } = req.body;

        const report = await FraudDetectionService.createReport({
            reporterId: req.user.userId,
            reportedUserId,
            hostelId,
            type,
            description,
            evidence: evidence || {}
        });

        await report.populate('reporterId reportedUserId hostelId');

        // Notify admins about new fraud report
        // await NotificationService.notifyAdmins('fraud_report', report);

        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all fraud reports (admin only)
app.get('/api/fraud/reports', authMiddleware, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { status, riskLevel, limit = 50, skip = 0 } = req.query;
        const query = {};

        if (status) query.status = status;
        if (riskLevel) query['aiAnalysis.riskLevel'] = riskLevel;

        const reports = await FraudReport.find(query)
            .populate('reporterId reportedUserId hostelId resolvedBy')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await FraudReport.countDocuments(query);

        res.json({ reports, total });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get fraud report by ID
app.get('/api/fraud/reports/:id', authMiddleware, async (req, res) => {
    try {
        const report = await FraudReport.findById(req.params.id)
            .populate('reporterId reportedUserId hostelId resolvedBy');

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Check if user is admin or reporter
        if (req.user.role !== 'admin' && report.reporterId.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update fraud report status (admin only)
app.patch('/api/fraud/reports/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { status, adminNotes } = req.body;
        const report = await FraudReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        await report.updateStatus(status, req.user.userId, adminNotes);
        await report.populate('reporterId reportedUserId hostelId resolvedBy');

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete fraud report (admin only)
app.delete('/api/fraud/reports/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const report = await FraudReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        await report.deleteOne();
        res.json({ message: 'Report deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check images for duplicates
app.post('/api/fraud/check-images', authMiddleware, async (req, res) => {
    try {
        const { images, hostelId } = req.body;

        if (!images || !Array.isArray(images)) {
            return res.status(400).json({ error: 'Images array required' });
        }

        const results = await FraudDetectionService.checkImages(images, hostelId);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Analyze text for fraud
app.post('/api/fraud/check-text', authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text required' });
        }

        const results = FraudDetectionService.analyzeText(text);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Calculate risk score for hostel
app.post('/api/fraud/calculate-risk/:hostelId', authMiddleware, async (req, res) => {
    try {
        const results = await FraudDetectionService.calculateRiskScore(req.params.hostelId);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get fraud statistics (admin only)
app.get('/api/fraud/stats', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const stats = await FraudReport.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get flagged hostels (admin only)
app.get('/api/fraud/flagged-hostels', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const reports = await FraudReport.find({
            status: { $in: ['pending', 'investigating'] },
            'aiAnalysis.riskLevel': { $in: ['high', 'critical'] }
        })
            .populate('hostelId reportedUserId')
            .sort({ 'aiAnalysis.totalRiskScore': -1 })
            .limit(50);

        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ROOMMATE MATCHING ROUTES
// ============================================

const RoommatePreferences = require('./models/RoommatePreferences');
const RoommateMatch = require('./models/RoommateMatch');
const RoommateMatchingService = require('./services/roommateMatchingService');

// Get user's roommate preferences
app.get('/api/roommate/preferences', authMiddleware, async (req, res) => {
    try {
        const preferences = await RoommatePreferences.findOne({ userId: req.user.userId })
            .populate('userId', 'firstName lastName profilePicture');

        if (!preferences) {
            return res.status(404).json({ error: 'Preferences not found' });
        }

        res.json(preferences);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create or update roommate preferences
app.post('/api/roommate/preferences', authMiddleware, async (req, res) => {
    try {
        const {
            bio, age, gender, occupation,
            sleepSchedule, cleanliness, socialLevel,
            smoking, drinking, pets,
            preferredGender, preferredAgeRange, dealBreakers,
            interests, languages,
            lookingForRoommate, moveInDate, budgetRange
        } = req.body;

        let preferences = await RoommatePreferences.findOne({ userId: req.user.userId });

        if (preferences) {
            // Update existing
            Object.assign(preferences, {
                bio, age, gender, occupation,
                sleepSchedule, cleanliness, socialLevel,
                smoking, drinking, pets,
                preferredGender, preferredAgeRange, dealBreakers,
                interests, languages,
                lookingForRoommate, moveInDate, budgetRange
            });
        } else {
            // Create new
            preferences = new RoommatePreferences({
                userId: req.user.userId,
                bio, age, gender, occupation,
                sleepSchedule, cleanliness, socialLevel,
                smoking, drinking, pets,
                preferredGender, preferredAgeRange, dealBreakers,
                interests, languages,
                lookingForRoommate, moveInDate, budgetRange
            });
        }

        await preferences.save();
        await preferences.populate('userId', 'firstName lastName profilePicture');

        res.json(preferences);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete roommate preferences
app.delete('/api/roommate/preferences', authMiddleware, async (req, res) => {
    try {
        const preferences = await RoommatePreferences.findOne({ userId: req.user.userId });

        if (!preferences) {
            return res.status(404).json({ error: 'Preferences not found' });
        }

        await preferences.deleteOne();
        res.json({ message: 'Preferences deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get match suggestions
app.get('/api/roommate/matches', authMiddleware, async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const matches = await RoommateMatchingService.findMatches(req.user.userId, parseInt(limit));
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get compatibility with specific user
app.get('/api/roommate/matches/:userId', authMiddleware, async (req, res) => {
    try {
        const compatibility = await RoommateMatchingService.calculateCompatibility(
            req.user.userId,
            req.params.userId
        );
        res.json(compatibility);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send match request
app.post('/api/roommate/matches/:userId', authMiddleware, async (req, res) => {
    try {
        const match = await RoommateMatchingService.createMatch(
            req.user.userId,
            req.params.userId,
            req.user.userId
        );

        await match.populate('user1Id user2Id');

        // Send notification to the other user
        // await NotificationService.notifyMatchRequest(match);

        res.status(201).json(match);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Accept/decline match request
app.patch('/api/roommate/matches/:matchId', authMiddleware, async (req, res) => {
    try {
        const { action } = req.body; // 'accept' or 'decline'
        const match = await RoommateMatch.findById(req.params.matchId);

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Verify user is part of the match
        if (match.user1Id.toString() !== req.user.userId &&
            match.user2Id.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (action === 'accept') {
            await match.accept();
        } else if (action === 'decline') {
            await match.decline();
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

        await match.populate('user1Id user2Id');
        res.json(match);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search for roommates
app.get('/api/roommate/search', authMiddleware, async (req, res) => {
    try {
        const { gender, minAge, maxAge, minBudget, maxBudget } = req.query;
        const query = {
            userId: { $ne: req.user.userId },
            lookingForRoommate: true
        };

        if (gender) query.gender = gender;
        if (minAge || maxAge) {
            query.age = {};
            if (minAge) query.age.$gte = parseInt(minAge);
            if (maxAge) query.age.$lte = parseInt(maxAge);
        }
        if (minBudget || maxBudget) {
            query['budgetRange.min'] = { $lte: parseInt(maxBudget) || 999999 };
            query['budgetRange.max'] = { $gte: parseInt(minBudget) || 0 };
        }

        const results = await RoommatePreferences.find(query)
            .populate('userId', 'firstName lastName profilePicture')
            .limit(50);

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PRICE GUIDANCE ROUTES
// ============================================

const PriceAnalysis = require('./models/PriceAnalysis');
const MarketTrend = require('./models/MarketTrend');
const PriceAnalysisService = require('./services/priceAnalysisService');

// Get price analysis for a hostel
app.get('/api/price/analysis/:hostelId', authMiddleware, async (req, res) => {
    try {
        let analysis = await PriceAnalysis.findOne({ hostelId: req.params.hostelId })
            .populate('hostelId', 'name location price');

        if (!analysis) {
            return res.status(404).json({ error: 'Price analysis not found. Run analysis first.' });
        }

        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Run new price analysis
app.post('/api/price/analysis/:hostelId', authMiddleware, async (req, res) => {
    try {
        // Verify ownership or admin
        const hostel = await Hostel.findById(req.params.hostelId);
        if (!hostel) {
            return res.status(404).json({ error: 'Hostel not found' });
        }

        if (hostel.ownerId.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const analysis = await PriceAnalysisService.analyzeHostelPrice(req.params.hostelId);
        await analysis.populate('hostelId', 'name location price');

        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get price recommendations
app.get('/api/price/recommendations/:hostelId', authMiddleware, async (req, res) => {
    try {
        const recommendations = await PriceAnalysisService.getRecommendedPrice(req.params.hostelId);
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get price history
app.get('/api/price/history/:hostelId', authMiddleware, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const analysis = await PriceAnalysis.findOne({ hostelId: req.params.hostelId });

        if (!analysis) {
            return res.status(404).json({ error: 'Price analysis not found' });
        }

        const history = analysis.getPriceHistory(parseInt(days));
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get market trends for a location
app.get('/api/price/market/:location', authMiddleware, async (req, res) => {
    try {
        const location = decodeURIComponent(req.params.location);
        const trends = await PriceAnalysisService.getMarketTrends(location);

        if (!trends) {
            return res.status(404).json({ error: 'No market data available for this location' });
        }

        res.json(trends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get competitor analysis
app.get('/api/price/competitors/:hostelId', authMiddleware, async (req, res) => {
    try {
        const comparison = await PriceAnalysisService.compareToCompetitors(req.params.hostelId);
        res.json(comparison);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get price forecast
app.get('/api/price/forecast/:location', authMiddleware, async (req, res) => {
    try {
        const location = decodeURIComponent(req.params.location);
        const { days = 30 } = req.query;

        const forecast = await MarketTrend.getPrediction(location, parseInt(days));

        if (!forecast) {
            return res.status(404).json({ error: 'Insufficient data for forecast' });
        }

        res.json(forecast);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Compare hostel to market
app.get('/api/price/market-comparison/:hostelId', authMiddleware, async (req, res) => {
    try {
        const comparison = await MarketTrend.compareToMarket(req.params.hostelId);

        if (!comparison) {
            return res.status(404).json({ error: 'Market comparison not available' });
        }

        res.json(comparison);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// DIGITAL AGREEMENTS ROUTES
// ============================================

const Agreement = require('./models/Agreement');
const AgreementTemplate = require('./models/AgreementTemplate');
const AgreementService = require('./services/agreementService');

// Get user's agreements
app.get('/api/agreements', authMiddleware, async (req, res) => {
    try {
        const { role } = req.query;
        const agreements = await AgreementService.getUserAgreements(req.user.userId, role);
        res.json(agreements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific agreement
app.get('/api/agreements/:id', authMiddleware, async (req, res) => {
    try {
        const agreement = await Agreement.findById(req.params.id)
            .populate('hostelId', 'name location')
            .populate('tenantId', 'firstName lastName email')
            .populate('landlordId', 'firstName lastName email')
            .populate('signatures.signatureId');

        if (!agreement) {
            return res.status(404).json({ error: 'Agreement not found' });
        }

        // Verify access
        if (agreement.landlordId._id.toString() !== req.user.userId &&
            agreement.tenantId._id.toString() !== req.user.userId &&
            req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json(agreement);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create agreement
app.post('/api/agreements', authMiddleware, async (req, res) => {
    try {
        const { bookingId, templateId } = req.body;
        const agreement = await AgreementService.createAgreement(
            bookingId,
            templateId,
            req.user.userId
        );
        res.status(201).json(agreement);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sign agreement
app.post('/api/agreements/:id/sign', authMiddleware, async (req, res) => {
    try {
        const { signatureData } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.headers['user-agent'];

        const agreement = await AgreementService.signAgreement(
            req.params.id,
            req.user.userId,
            signatureData,
            ipAddress,
            userAgent
        );

        res.json(agreement);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Terminate agreement
app.post('/api/agreements/:id/terminate', authMiddleware, async (req, res) => {
    try {
        const { reason } = req.body;
        const agreement = await AgreementService.terminateAgreement(
            req.params.id,
            req.user.userId,
            reason
        );
        res.json(agreement);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get templates
app.get('/api/agreement-templates', authMiddleware, async (req, res) => {
    try {
        const templates = await AgreementTemplate.find({
            $or: [
                { isPublic: true },
                { createdBy: req.user.userId }
            ],
            isActive: true
        });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create template
app.post('/api/agreement-templates', authMiddleware, async (req, res) => {
    try {
        const template = await AgreementService.createTemplate(req.body, req.user.userId);
        res.status(201).json(template);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ADMIN & MODERATION ROUTES
// ============================================

const AdminService = require('./services/adminService');

// Admin Middleware
const adminMiddleware = async (req, res, next) => {
    try {
        // In a real app, verify admin role from DB
        // For demo, we'll check the role from the token
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Dashboard Stats
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const stats = await AdminService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User Management
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { search, role, status, page } = req.query;
        const result = await AdminService.getUsers({ search, role, status }, parseInt(page) || 1);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/users/:id/action', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { action, reason } = req.body;
        const user = await AdminService.performUserAction(
            req.user.userId,
            req.params.id,
            action,
            reason,
            req.ip
        );
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reports
app.get('/api/admin/reports', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, page } = req.query;
        const result = await AdminService.getReports(status, parseInt(page) || 1);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/reports/:id/resolve', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { resolution, note } = req.body;
        const report = await AdminService.resolveReport(
            req.user.userId,
            req.params.id,
            resolution,
            note,
            req.ip
        );
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Settings
app.get('/api/admin/settings', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const settings = await AdminService.getSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/admin/settings/:key', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { value } = req.body;
        const setting = await AdminService.updateSetting(
            req.user.userId,
            req.params.key,
            value,
            req.ip
        );
        res.json(setting);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready`);
});
