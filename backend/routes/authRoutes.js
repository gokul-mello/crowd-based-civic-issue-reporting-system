const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  registerCitizen,
  loginCitizen,
  loginAuthority,
  getMe,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 500,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  }
});

router.post('/register', authLimiter, registerCitizen);
router.post('/login', authLimiter, loginCitizen);
router.post('/authority/login', authLimiter, loginAuthority);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
