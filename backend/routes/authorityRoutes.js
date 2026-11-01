const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAuthorityComplaints,
  updateComplaintStatus,
  assignComplaint,
  overridePriority,
  getAuthorityAnalytics
} = require('../controllers/authorityController');
const { protect, authorize } = require('../middleware/auth');

// All routes here strictly require 'authority' role
router.use(protect);
router.use(authorize('authority'));

router.get('/dashboard', getDashboardStats);
router.get('/complaints', getAuthorityComplaints);
router.patch('/complaints/:id/status', updateComplaintStatus);
router.patch('/complaints/:id/assign', assignComplaint);
router.patch('/complaints/:id/priority', overridePriority);
router.get('/analytics', getAuthorityAnalytics);

module.exports = router;
