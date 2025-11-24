// server/config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Serialize user id into session (optional, not used for JWT)
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Helper to generate JWT tokens
function generateTokens(user) {
    const payload = { id: user._id, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Find existing user by googleId or email
                let user = await User.findOne({ $or: [{ googleId: profile.id }, { email: profile.emails[0].value }] });
                if (!user) {
                    // Create new user
                    user = new User({
                        username: profile.displayName.replace(/\s+/g, '').toLowerCase(),
                        email: profile.emails[0].value,
                        authProvider: 'google',
                        googleId: profile.id,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        profilePicture: profile.photos[0].value,
                        role: 'customer',
                    });
                    await user.save();
                } else {
                    // Update existing user with googleId if missing
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        user.authProvider = 'google';
                        await user.save();
                    }
                }
                const tokens = generateTokens(user);
                // Attach tokens to user object for later use
                user.tokens = tokens;
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

// Facebook OAuth Strategy
passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: process.env.FACEBOOK_CALLBACK_URL,
            profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails && profile.emails[0] && profile.emails[0].value;
                let user = await User.findOne({ $or: [{ facebookId: profile.id }, { email }] });
                if (!user) {
                    user = new User({
                        username: `${profile.name.givenName || ''}${profile.name.familyName || ''}`.replace(/\s+/g, '').toLowerCase(),
                        email: email || `${profile.id}@facebook.com`,
                        authProvider: 'facebook',
                        facebookId: profile.id,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        profilePicture: profile.photos && profile.photos[0] && profile.photos[0].value,
                        role: 'customer',
                    });
                    await user.save();
                } else {
                    if (!user.facebookId) {
                        user.facebookId = profile.id;
                        user.authProvider = 'facebook';
                        await user.save();
                    }
                }
                const tokens = generateTokens(user);
                user.tokens = tokens;
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

module.exports = passport;
