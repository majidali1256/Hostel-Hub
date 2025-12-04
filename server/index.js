require('dotenv').config({ path: __dirname + '/.env' });
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
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads')); // Serve uploaded files

const verificationRoutes = require('./routes/verificationRoutes');
app.use('/api/verification', verificationRoutes);

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

// OAuth routes - only register if credentials are configured
if (process.env.GOOGLE_CLIENT_ID) {
    app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account consent' }));
    app.get('/api/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
        const { accessToken, refreshToken } = req.user.tokens || {};
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${req.user._id}`);
    });
} else {
    // Return error if OAuth is not configured
    app.get('/api/auth/google', (req, res) => {
        res.status(501).json({ error: 'Google OAuth is not configured on this server' });
    });
}

if (process.env.FACEBOOK_APP_ID) {
    app.get('/api/auth/facebook', passport.authenticate('facebook'));
    app.get('/api/auth/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/login' }), (req, res) => {
        const { accessToken, refreshToken } = req.user.tokens || {};
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${req.user._id}`);
    });
} else {
    // Return error if OAuth is not configured
    app.get('/api/auth/facebook', (req, res) => {
        res.status(501).json({ error: 'Facebook OAuth is not configured on this server' });
    });
}

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

// Update user bank details
app.put('/api/users/bank-details', authMiddleware, async (req, res) => {
    try {
        const { bankName, accountTitle, accountNumber, iban, jazzCashNumber, easyPaisaNumber } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.bankDetails = {
            bankName,
            accountTitle,
            accountNumber,
            iban,
            jazzCashNumber,
            easyPaisaNumber,
            verified: user.bankDetails?.verified || false
        };

        await user.save();
        res.json({ message: 'Bank details updated successfully', bankDetails: user.bankDetails });
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

// Advanced search with filters
app.get('/api/hostels/search', async (req, res) => {
    try {
        const {
            minPrice,
            maxPrice,
            amenities,
            roomCategories,
            genderPreference,
            minRating,
            verifiedOnly,
            location
        } = req.query;

        const query = {};

        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseInt(minPrice);
            if (maxPrice) query.price.$lte = parseInt(maxPrice);
        }

        // Amenities filter (must have ALL selected amenities)
        if (amenities) {
            const amenitiesList = Array.isArray(amenities) ? amenities : amenities.split(',');
            query.amenities = { $all: amenitiesList };
        }

        // Room categories filter
        if (roomCategories) {
            const categoriesList = Array.isArray(roomCategories) ? roomCategories : roomCategories.split(',');
            query.category = { $in: categoriesList };
        }

        // Gender preference filter
        if (genderPreference && genderPreference !== 'any') {
            query.genderPreference = { $in: [genderPreference, 'any'] };
        }

        // Verified only filter
        if (verifiedOnly === 'true') {
            query.verified = true;
        }

        // Location search (contains)
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        const hostels = await Hostel.find(query);

        // Filter by minimum rating (client-side calculation since it's based on reviews)
        if (minRating) {
            const minRatingNum = parseFloat(minRating);
            const filtered = hostels.filter(h => (h.rating || 0) >= minRatingNum);
            return res.json(filtered);
        }

        res.json(hostels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get nearby hostels (geospatial query)
app.get('/api/hostels/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query; // radius in meters

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude required' });
        }

        const hostels = await Hostel.find({
            coordinates: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius)
                }
            }
        });

        res.json(hostels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get AI-powered recommendations
app.get('/api/hostels/recommendations', authMiddleware, async (req, res) => {
    try {
        const { generateRecommendations } = require('./utils/geminiService');

        // Get user profile
        const user = await User.findById(req.user.userId);

        // Build user profile for AI
        const userProfile = {
            minBudget: 5000,
            maxBudget: user.budget || 30000,
            preferredAmenities: [],
            bookingCount: user.bookings?.length || 0,
            preferredLocation: user.location || '',
            gender: user.gender || 'any'
        };

        // Get all available hostels
        const hostels = await Hostel.find({ status: 'Available' });

        // Generate recommendations using Gemini AI
        const recommendations = await generateRecommendations(userProfile, hostels);

        res.json(recommendations);
    } catch (error) {
        console.error('Recommendations error:', error);
        // Fallback: return top-rated hostels
        const topHostels = await Hostel.find({ status: 'Available' })
            .sort({ rating: -1 })
            .limit(5);

        res.json(topHostels.map((h, i) => ({
            hostel: h,
            rank: i + 1,
            reason: 'Highly rated hostel'
        })));
    }
});

app.get('/api/hostels', async (req, res) => {
    try {
        // Optimize: Only fetch the first image for the list view to reduce payload size
        const hostels = await Hostel.find({}, {
            name: 1,
            location: 1,
            price: 1,
            rating: 1,
            reviews: 1,
            amenities: 1,
            category: 1,
            status: 1,
            genderPreference: 1,
            verified: 1,
            ownerId: 1,
            images: { $slice: 1 },
            coordinates: 1
        });
        res.json(hostels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Configure upload middleware for hostels
const hostelUpload = upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 2 },
    { name: 'tour360', maxCount: 5 }
]);

// Only owners can create hostels
app.post('/api/hostels', authMiddleware, roleMiddleware('owner', 'admin'), hostelUpload, async (req, res) => {
    try {
        const hostelData = { ...req.body };

        // Handle file uploads
        if (req.files) {
            if (req.files.images) {
                hostelData.images = req.files.images.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
            }
            if (req.files.videos) {
                hostelData.videos = req.files.videos.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
            }
            if (req.files.tour360) {
                hostelData.tour360 = req.files.tour360.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
            }
        }

        // Parse amenities if sent as string
        if (typeof hostelData.amenities === 'string') {
            hostelData.amenities = hostelData.amenities.split(',').map(a => a.trim()).filter(a => a);
        }

        const newHostel = new Hostel({
            ...hostelData,
            ownerId: req.userId // Set owner to current user
        });
        await newHostel.save();
        res.status(201).json(newHostel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single hostel by ID
app.get('/api/hostels/:id', async (req, res) => {
    try {
        const hostel = await Hostel.findById(req.params.id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
        res.json(hostel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Only owners can update their own hostels (or admins can update any)
app.put('/api/hostels/:id', authMiddleware, hostelUpload, async (req, res) => {
    try {
        const hostel = await Hostel.findById(req.params.id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

        const user = await User.findById(req.userId);
        if (hostel.ownerId !== req.userId && user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this hostel' });
        }

        const updateData = { ...req.body };

        // Helper to process media fields (combine existing URLs + new files)
        const processMedia = (fieldName) => {
            let media = [];
            // 1. Add existing media (passed as strings in body)
            if (updateData[fieldName]) {
                if (Array.isArray(updateData[fieldName])) {
                    media = [...updateData[fieldName]];
                } else {
                    media = [updateData[fieldName]];
                }
            }
            // 2. Add new files
            if (req.files && req.files[fieldName]) {
                const newUrls = req.files[fieldName].map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);
                media = [...media, ...newUrls];
            }
            return media;
        };

        // Update media fields if present in request (either body or files)
        // Note: If a field is completely missing from both, we assume no change.
        // If it's present but empty in body and no files, it means clear it?
        // To be safe: Frontend should send existing URLs.
        if (req.files?.images || updateData.images !== undefined) {
            hostel.images = processMedia('images');
        }
        if (req.files?.videos || updateData.videos !== undefined) {
            hostel.videos = processMedia('videos');
        }
        if (req.files?.tour360 || updateData.tour360 !== undefined) {
            hostel.tour360 = processMedia('tour360');
        }

        // Handle other fields
        if (updateData.name) hostel.name = updateData.name;
        if (updateData.location) hostel.location = updateData.location;
        if (updateData.price) hostel.price = Number(updateData.price);
        if (updateData.capacity) hostel.capacity = Number(updateData.capacity);
        if (updateData.description) hostel.description = updateData.description;
        if (updateData.category) hostel.category = updateData.category;
        if (updateData.status) hostel.status = updateData.status;
        if (updateData.genderPreference) hostel.genderPreference = updateData.genderPreference;
        if (updateData.verified !== undefined) hostel.verified = updateData.verified === 'true' || updateData.verified === true;

        if (updateData.amenities) {
            if (typeof updateData.amenities === 'string') {
                hostel.amenities = updateData.amenities.split(',').map(a => a.trim()).filter(a => a);
            } else {
                hostel.amenities = updateData.amenities;
            }
        }

        // Recalculate rating to ensure consistency (self-healing)
        hostel.calculateAverageRating();
        await hostel.save();

        res.json(hostel);
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
        console.log('Delete Debug - Requesting User:', req.userId);
        console.log('Delete Debug - Hostel Owner:', hostel.ownerId);
        console.log('Delete Debug - User Role:', user.role);

        if (hostel.ownerId.toString() !== req.userId && user.role !== 'admin') {
            console.log('Delete Debug - Authorization Failed');
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

// Delete a review
app.delete('/api/hostels/:id/reviews', authMiddleware, async (req, res) => {
    try {
        const hostel = await Hostel.findById(req.params.id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

        // Find the review by the current user
        const reviewIndex = hostel.reviews.findIndex(r => r.userId.toString() === req.userId); // Ensure comparison is correct
        if (reviewIndex === -1) {
            return res.status(404).json({ error: 'Review not found or you are not the author' });
        }

        // Remove the review
        hostel.reviews.splice(reviewIndex, 1);
        hostel.calculateAverageRating();
        await hostel.save();

        res.json({ message: 'Review deleted successfully', hostel });
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
// FAIR RENT PREDICTION ROUTES (MODULE 10)
// ============================================

const pricePredictionService = require('./services/pricePredictionService');

// Predict rent for a hostel (Owner only)
app.post('/api/hostels/predict-rent', authMiddleware, roleMiddleware(['owner', 'admin']), async (req, res) => {
    try {
        const prediction = await pricePredictionService.predictRent(req.body);
        res.json(prediction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get fairness analysis for a specific hostel (Public/Customer)
app.get('/api/hostels/:id/fairness-analysis', async (req, res) => {
    try {
        const hostel = await Hostel.findById(req.params.id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });

        // Get prediction based on hostel's current features
        const prediction = await pricePredictionService.predictRent({
            location: hostel.location,
            roomType: hostel.category,
            amenities: hostel.amenities,
            capacity: hostel.capacity,
            genderPreference: hostel.genderPreference
        });

        // Compare actual price with predicted range
        let fairnessLabel = 'Fair Price';
        if (hostel.price < prediction.minPrice) fairnessLabel = 'Great Deal';
        if (hostel.price > prediction.maxPrice) fairnessLabel = 'Premium';

        res.json({
            hostelPrice: hostel.price,
            predictedRange: { min: prediction.minPrice, max: prediction.maxPrice },
            fairnessLabel,
            reasoning: prediction.reasoning
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get market benchmarks (Admin/Analytics)
app.get('/api/market/benchmarks', async (req, res) => {
    try {
        const { location } = req.query;
        if (!location) return res.status(400).json({ error: 'Location is required' });

        const benchmarks = await pricePredictionService.getAreaBenchmarks(location);
        res.json(benchmarks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SEARCH ROUTES (AI-POWERED)
// ============================================

const searchService = require('./services/searchService');

// Advanced search with filters
app.get('/api/search', async (req, res) => {
    try {
        const filters = {
            query: req.query.q,
            location: req.query.location,
            minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : undefined,
            amenities: req.query.amenities ? req.query.amenities.split(',') : undefined,
            minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
            sortBy: req.query.sortBy,
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 20
        };

        const results = await searchService.searchHostels(filters);
        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// AI-powered smart search
app.get('/api/search/smart', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: 'Query parameter required' });
        }

        // Get user profile if authenticated
        let userProfile = {};
        if (req.headers.authorization) {
            try {
                const token = req.headers.authorization.replace('Bearer ', '');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.userId);
                if (user) {
                    userProfile = {
                        userId: user._id,
                        minPrice: 0,
                        maxPrice: 100000,
                        preferredAmenities: [],
                        location: req.query.location
                    };
                }
            } catch (err) {
                // Continue without user profile
            }
        }

        const results = await searchService.smartSearch(query, userProfile, {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 20
        });

        res.json(results);
    } catch (error) {
        console.error('Smart search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get personalized recommendations
app.get('/api/search/recommendations', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const userProfile = {
            userId: user._id,
            minPrice: 0,
            maxPrice: 100000,
            preferredAmenities: [],
            bookingHistory: []
        };

        const recommendations = await searchService.getRecommendations(req.userId, userProfile);
        res.json(recommendations);
    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get search suggestions (auto-complete)
app.get('/api/search/suggestions', async (req, res) => {
    try {
        const query = req.query.q || '';
        const suggestions = await searchService.getSuggestions(query);
        res.json(suggestions);
    } catch (error) {
        console.error('Suggestions error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get available search filters
app.get('/api/search/filters', async (req, res) => {
    try {
        const filters = await searchService.getSearchFilters();
        res.json(filters);
    } catch (error) {
        console.error('Filters error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// BOOKING ROUTES
// ============================================

const Booking = require('./models/Booking');
const emailService = require('./services/emailService');
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
        const availabilityCheck = await checkAvailability(hostelId, checkIn, checkOut, numberOfGuests);
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
        const booking = await Booking.findById(req.params.id)
            .populate('hostelId')
            .populate('customerId');

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check authorization
        const isCustomer = booking.customerId._id.toString() === req.user.userId;
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

        // Send cancellation email
        const cancelledBy = isOwner ? 'owner' : 'customer';
        try {
            await emailService.sendBookingCancellation(
                booking,
                booking.customerId,
                booking.hostelId,
                cancelledBy,
                reason
            );
        } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError);
            // Don't fail the request if email fails
        }

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
        // If hostelId is provided, look for a conversation specific to that hostel
        // If no hostelId, look for a general direct conversation (or one without a hostelId)
        const query = {
            participants: { $all: [req.user.userId, participantId] },
            type: 'direct'
        };

        if (hostelId) {
            query.hostelId = hostelId;
        } else {
            // If no hostelId specified, try to find one without a hostelId or just any direct one?
            // Better to be strict: if no hostelId, find one with no hostelId
            query.hostelId = { $exists: false };
        }

        let conversation = await Conversation.findOne(query).populate('participants', 'firstName lastName email profilePicture');

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

        // Send email notification to owner
        const { sendAppointmentRequestEmail } = require('./utils/email');
        try {
            await sendAppointmentRequestEmail(
                appointment.ownerId.email,
                appointment.ownerId.firstName || appointment.ownerId.username,
                appointment.customerId.firstName || appointment.customerId.username,
                appointment.hostelId.name,
                {
                    scheduledTime: appointment.scheduledTime,
                    duration: appointment.duration,
                    type: appointment.type,
                    notes: appointment.notes
                }
            );
        } catch (emailError) {
            console.error('Failed to send appointment request email:', emailError);
        }

        // Notify owner via WebSocket
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

        // Send email notifications
        const { sendAppointmentConfirmationEmail, sendAppointmentCancellationEmail } = require('./utils/email');
        try {
            if (status === 'confirmed') {
                // Notify customer of confirmation
                await sendAppointmentConfirmationEmail(
                    appointment.customerId.email,
                    appointment.customerId.firstName || appointment.customerId.username,
                    appointment.ownerId.firstName || appointment.ownerId.username,
                    appointment.hostelId.name,
                    {
                        scheduledTime: appointment.scheduledTime,
                        duration: appointment.duration,
                        notes: appointment.notes
                    }
                );
            } else if (status === 'cancelled') {
                // Determine who cancelled and notify the other party
                const isCancelledByOwner = appointment.ownerId._id.toString() === req.user.userId;
                const recipientEmail = isCancelledByOwner ? appointment.customerId.email : appointment.ownerId.email;
                const recipientName = isCancelledByOwner
                    ? (appointment.customerId.firstName || appointment.customerId.username)
                    : (appointment.ownerId.firstName || appointment.ownerId.username);
                const cancelledBy = isCancelledByOwner
                    ? (appointment.ownerId.firstName || appointment.ownerId.username)
                    : (appointment.customerId.firstName || appointment.customerId.username);

                await sendAppointmentCancellationEmail(
                    recipientEmail,
                    recipientName,
                    appointment.hostelId.name,
                    {
                        scheduledTime: appointment.scheduledTime
                    },
                    cancelledBy,
                    req.body.cancelReason
                );
            }
        } catch (emailError) {
            console.error('Failed to send appointment email:', emailError);
        }

        // Notify other party via WebSocket
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

// Get user trust score
app.get('/api/fraud/trust-score/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        let trustScore = await TrustScore.findOne({ userId });

        if (!trustScore) {
            // Create default trust score if not exists
            trustScore = new TrustScore({
                userId,
                score: 50, // Start with neutral score
                factors: {
                    accountAge: 0,
                    verificationStatus: 0,
                    listingQuality: 0,
                    reviewScore: 0,
                    activityPattern: 0,
                    reportHistory: 0
                },
                badges: []
            });
            await trustScore.save();
        }

        res.json(trustScore);
    } catch (error) {
        console.error('Error fetching trust score:', error);
        res.status(500).json({ message: 'Failed to fetch trust score' });
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

// Fraud Detection Endpoints
const FraudCheck = require('./models/FraudCheck');
const { performFraudCheck } = require('./utils/fraudDetectionService');

// Get fraud queue
app.get('/api/admin/fraud/queue', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, riskLevel } = req.query;
        const query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        const fraudChecks = await FraudCheck.find(query)
            .populate('hostelId')
            .populate('ownerId', 'username email')
            .populate('reviewedBy', 'username')
            .sort({ riskScore: -1, createdAt: -1 })
            .limit(100);

        // Filter by risk level if specified
        let filtered = fraudChecks;
        if (riskLevel && riskLevel !== 'all') {
            filtered = fraudChecks.filter(check => {
                if (riskLevel === 'high') return check.riskScore >= 70;
                if (riskLevel === 'medium') return check.riskScore >= 40 && check.riskScore < 70;
                if (riskLevel === 'low') return check.riskScore < 40;
                return true;
            });
        }

        res.json(filtered);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Review flagged listing
app.put('/api/admin/fraud/review/:checkId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { decision, notes } = req.body;
        const fraudCheck = await FraudCheck.findById(req.params.checkId);

        if (!fraudCheck) {
            return res.status(404).json({ error: 'Fraud check not found' });
        }

        fraudCheck.status = decision === 'approve' ? 'approved' : 'rejected';
        fraudCheck.reviewedBy = req.user.userId;
        fraudCheck.reviewedAt = new Date();
        fraudCheck.reviewNotes = notes;

        await fraudCheck.save();

        // Update hostel status
        const Hostel = require('./models/Hostel');
        const hostel = await Hostel.findById(fraudCheck.hostelId);

        if (hostel) {
            if (decision === 'approve') {
                hostel.status = 'Available';
            } else {
                hostel.status = 'Inactive';
            }
            await hostel.save();
        }

        res.json({ message: 'Review completed', fraudCheck });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get fraud statistics
app.get('/api/admin/fraud/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const total = await FraudCheck.countDocuments();
        const pending = await FraudCheck.countDocuments({ status: 'pending' });
        const highRisk = await FraudCheck.countDocuments({ riskScore: { $gte: 70 } });
        const mediumRisk = await FraudCheck.countDocuments({
            riskScore: { $gte: 40, $lt: 70 }
        });
        const lowRisk = await FraudCheck.countDocuments({ riskScore: { $lt: 40 } });

        const recentChecks = await FraudCheck.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('hostelId', 'name')
            .select('riskScore status createdAt');

        res.json({
            total,
            pending,
            riskLevels: { high: highRisk, medium: mediumRisk, low: lowRisk },
            recent: recentChecks
        });
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

// ==================== BOOKING ROUTES ====================
// Note: Booking model is already required at the top of the file

// Create a new booking (Pakistani payment system)
app.post('/api/bookings', authMiddleware, async (req, res) => {
    try {
        const { hostelId, checkIn, checkOut, guests, totalPrice } = req.body;

        // Validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (checkInDate >= checkOutDate) {
            return res.status(400).json({ error: 'Check-out date must be after check-in date' });
        }

        if (checkInDate < new Date()) {
            return res.status(400).json({ error: 'Check-in date cannot be in the past' });
        }

        // Check if hostel exists
        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
            return res.status(404).json({ error: 'Hostel not found' });
        }

        // Get owner's bank details
        const owner = await User.findById(hostel.ownerId);
        if (!owner || !owner.bankDetails || !owner.bankDetails.accountNumber) {
            return res.status(400).json({
                error: 'Owner has not set up bank details yet. Please contact the owner.'
            });
        }

        // Check availability
        // Check availability with capacity
        const conflictingBookings = await Booking.find({
            hostelId,
            status: { $in: ['pending', 'confirmed'] },
            $or: [
                { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }
            ]
        });

        // Calculate total guests in conflicting bookings
        const currentGuests = conflictingBookings.reduce((sum, booking) => sum + (booking.numberOfGuests || 1), 0);
        const requestedGuests = guests || 1;

        if (currentGuests + requestedGuests > hostel.capacity) {
            return res.status(409).json({
                error: `Not enough space available for these dates. Capacity: ${hostel.capacity}, Booked: ${currentGuests}`,
                availableSpots: hostel.capacity - currentGuests
            });
        }

        // Create booking
        const booking = new Booking({
            hostelId,
            customerId: req.userId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            numberOfGuests: guests || 1,
            totalPrice,
            status: 'pending',
            paymentStatus: 'pending'
        });

        await booking.save();

        // Get customer details for email
        const customer = await User.findById(req.userId);

        // Send emails (don't wait for them to complete)
        emailService.sendBookingConfirmation(
            booking,
            customer,
            hostel,
            owner.bankDetails,
            { name: `${owner.firstName} ${owner.lastName}`, contactNumber: owner.contactNumber }
        ).catch(err => console.error('Email error:', err));

        emailService.sendNewBookingToOwner(
            booking,
            customer,
            hostel,
            owner
        ).catch(err => console.error('Email error:', err));

        // Return booking with owner's bank details
        res.status(201).json({
            booking,
            ownerBankDetails: {
                bankName: owner.bankDetails.bankName,
                accountTitle: owner.bankDetails.accountTitle,
                accountNumber: owner.bankDetails.accountNumber,
                iban: owner.bankDetails.iban,
                jazzCashNumber: owner.bankDetails.jazzCashNumber,
                easyPaisaNumber: owner.bankDetails.easyPaisaNumber
            },
            ownerContact: {
                name: `${owner.firstName} ${owner.lastName}`,
                phone: owner.contactNumber
            }
        });
    } catch (error) {
        console.error('Booking creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user's bookings
app.get('/api/bookings/my-bookings', authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find({ customerId: req.userId })
            .populate('hostelId', 'name location price images')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get bookings for owner's hostels
app.get('/api/bookings/my-hostel-bookings', authMiddleware, async (req, res) => {
    try {
        // Find all hostels owned by the user
        const hostels = await Hostel.find({ ownerId: req.userId });
        const hostelIds = hostels.map(h => h._id);

        // Find all bookings for those hostels
        const bookings = await Booking.find({ hostelId: { $in: hostelIds } })
            .populate('hostelId', 'name location price images')
            .populate('customerId', 'firstName lastName email contactNumber')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update booking status
app.put('/api/bookings/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status, cancelReason } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check authorization
        const hostel = await Hostel.findById(booking.hostelId);
        const isOwner = hostel.ownerId === req.userId;
        const isCustomer = booking.customerId.toString() === req.userId;

        if (!isOwner && !isCustomer) {
            return res.status(403).json({ error: 'Not authorized to update this booking' });
        }

        // Update status
        booking.status = status;
        booking.updatedAt = new Date();

        if (status === 'confirmed') {
            booking.confirmedAt = new Date();
        } else if (status === 'cancelled') {
            booking.cancelledAt = new Date();
            booking.cancelReason = cancelReason;

            // Process refund if payment was made
            if (booking.paymentStatus === 'paid' && booking.paymentIntentId) {
                const refund = await stripeService.refundPayment(
                    booking.paymentIntentId,
                    null,
                    'requested_by_customer'
                );
                booking.paymentStatus = 'refunded';
                booking.refundId = refund.refundId;
                booking.refundedAt = new Date();
            }
        }

        await booking.save();

        // Send email notifications
        try {
            const customer = await User.findById(booking.customerId);
            const owner = await User.findById(hostel.ownerId);

            if (status === 'confirmed') {
                await emailService.sendBookingConfirmation(
                    booking,
                    customer,
                    hostel,
                    owner.bankDetails || {},
                    { name: `${owner.firstName} ${owner.lastName}`, contactNumber: owner.contactNumber }
                );
            } else if (status === 'cancelled') {
                // Determine who cancelled
                const cancelledBy = req.userId === hostel.ownerId ? 'owner' : 'customer';
                await emailService.sendBookingCancellation(
                    booking,
                    customer,
                    hostel,
                    cancelledBy,
                    cancelReason
                );
            }
        } catch (emailError) {
            console.error('Error sending status update email:', emailError);
            // Don't fail the request if email fails
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload payment receipt
app.post('/api/bookings/:id/payment-receipt', authMiddleware, async (req, res) => {
    try {
        const { paymentMethod, transactionId, receiptImage } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check authorization
        if (booking.customerId.toString() !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to upload receipt for this booking' });
        }

        booking.paymentMethod = paymentMethod;
        booking.transactionId = transactionId;
        booking.paymentReceipt = {
            image: receiptImage,
            uploadedAt: new Date(),
            verified: false
        };
        booking.paymentStatus = 'submitted';
        booking.updatedAt = new Date();

        await booking.save();

        // Get customer and hostel details for email
        const customer = await User.findById(booking.customerId);
        const hostel = await Hostel.findById(booking.hostelId).populate('ownerId');
        const owner = hostel.ownerId;

        // Send email to owner
        emailService.sendPaymentReceiptUploaded(
            booking,
            customer,
            hostel,
            owner
        ).catch(err => console.error('Email error:', err));

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify payment (Owner)
app.put('/api/bookings/:id/verify-payment', authMiddleware, async (req, res) => {
    try {
        const { approved, rejectionReason } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check authorization (Owner only)
        const hostel = await Hostel.findById(booking.hostelId);
        if (hostel.ownerId !== req.userId) {
            return res.status(403).json({ error: 'Not authorized to verify this payment' });
        }

        if (approved) {
            booking.paymentStatus = 'verified';
            booking.status = 'confirmed';
            booking.confirmedAt = new Date();
            booking.paymentReceipt.verified = true;
            booking.paymentReceipt.verifiedBy = req.userId;
            booking.paymentReceipt.verifiedAt = new Date();
        } else {
            booking.paymentStatus = 'rejected';
            booking.paymentReceipt.verified = false;
            booking.paymentReceipt.verifiedBy = req.userId;
            booking.paymentReceipt.verifiedAt = new Date();
            booking.paymentReceipt.rejectionReason = rejectionReason;
        }

        booking.updatedAt = new Date();
        await booking.save();

        // Get customer and hostel details for email
        const customer = await User.findById(booking.customerId);
        const hostelData = await Hostel.findById(booking.hostelId);

        // Send email to customer
        if (approved) {
            emailService.sendPaymentVerified(
                booking,
                customer,
                hostelData
            ).catch(err => console.error('Email error:', err));
        } else {
            emailService.sendPaymentRejected(
                booking,
                customer,
                hostelData,
                rejectionReason
            ).catch(err => console.error('Email error:', err));
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check hostel availability
app.get('/api/hostels/:id/availability', async (req, res) => {
    try {
        const { checkIn, checkOut } = req.query;

        if (!checkIn || !checkOut) {
            return res.status(400).json({ error: 'Check-in and check-out dates are required' });
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        const conflictingBookings = await Booking.find({
            hostelId: req.params.id,
            status: { $in: ['pending', 'confirmed'] },
            $or: [
                { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }
            ]
        });

        res.json({
            available: conflictingBookings.length === 0,
            conflictingBookings: conflictingBookings.map(b => ({
                checkIn: b.checkIn,
                checkOut: b.checkOut
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== PAYMENT ROUTES ====================
// Payment verification is now handled via /api/bookings/:id/verify-payment
// Initialize Cron Jobs
const { initCronJobs } = require('./services/cronService');
initCronJobs();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket server ready`);
});
