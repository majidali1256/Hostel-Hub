const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// Configure Multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/identity_docs';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'id-' + req.user.userId + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
        return cb(new Error('Only image and PDF files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload ID Document
router.post('/upload', authMiddleware, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a file' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.idDocument = req.file.path;
        user.verificationStatus = 'pending';
        user.trustScore = 75; // Trust score increases to 75 on document submission
        user.rejectionReason = undefined; // Clear previous rejection reason
        await user.save();

        res.json({
            message: 'Document uploaded successfully',
            status: user.verificationStatus,
            documentPath: req.file.path
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Verification Status
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            status: user.verificationStatus,
            document: user.idDocument,
            rejectionReason: user.rejectionReason,
            verificationDate: user.verificationDate
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin Review (Approve/Reject)
// Note: In a real app, add adminMiddleware here
router.put('/review/:userId', authMiddleware, async (req, res) => {
    try {
        // Check if requesting user is admin
        const adminUser = await User.findById(req.user.userId);
        if (adminUser.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }

        const { status, reason } = req.body;
        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.verificationStatus = status;
        if (status === 'verified') {
            user.verificationDate = new Date();
            user.rejectionReason = undefined;
            user.trustScore = 100; // Trust score is 100 when verified
        } else if (status === 'rejected') {
            user.rejectionReason = reason || 'Document rejected';
            user.trustScore = 50; // Trust score drops to 50 when rejected
        }

        await user.save();

        res.json({
            message: `User verification ${status}`,
            user: {
                id: user._id,
                username: user.username,
                verificationStatus: user.verificationStatus
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Verification Requests (Admin Only)
router.get('/admin/all', authMiddleware, async (req, res) => {
    try {
        // Check if requesting user is admin
        const adminUser = await User.findById(req.user.userId);
        if (adminUser.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }

        const { status } = req.query;

        // Build query
        let query = {};
        if (status && status !== 'all') {
            query.verificationStatus = status;
        }

        const users = await User.find(query)
            .select('username email firstName lastName verificationStatus idDocument verificationDocuments verificationDate rejectionReason createdAt profilePicture')
            .sort({ createdAt: -1 });

        res.json({
            total: users.length,
            requests: users.map(user => ({
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                status: user.verificationStatus,
                document: user.idDocument,
                documents: user.verificationDocuments || [],
                profilePicture: user.profilePicture,
                submittedAt: user.createdAt,
                verificationDate: user.verificationDate,
                rejectionReason: user.rejectionReason
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
