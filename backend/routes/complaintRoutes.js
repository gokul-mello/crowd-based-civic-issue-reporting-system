const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  generateAiComplaint,
  checkDuplicates,
  createComplaint,
  getComplaints,
  getComplaintById,
  getMyComplaints,
  voteComplaint,
  removeVote
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Rate limiting for AI endpoint
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'AI generation request rate limit exceeded. Please wait a few minutes.'
  }
});

// Public / Semi-public listing
router.get('/', (req, res, next) => {
  // Optional auth parsing for vote status
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
}, getComplaints);

// My complaints (Citizen only)
router.get('/my', protect, authorize('citizen'), getMyComplaints);

// AI Complaint Generation
router.post('/generate-ai', protect, aiLimiter, generateAiComplaint);

// Duplicate check
router.post('/check-duplicates', protect, checkDuplicates);

// Single Complaint by ID or complaintId
router.get('/:id', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
}, getComplaintById);

// Submit new complaint (with optional image uploads)
router.post('/', protect, authorize('citizen'), upload.array('images', 5), createComplaint);

// Voting
router.post('/:id/vote', protect, authorize('citizen'), voteComplaint);
router.delete('/:id/vote', protect, authorize('citizen'), removeVote);

module.exports = router;
