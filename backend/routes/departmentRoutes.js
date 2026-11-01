const express = require('express');
const router = express.Router();
const { getDepartments, createDepartment } = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getDepartments);
router.post('/', protect, authorize('authority'), createDepartment);

module.exports = router;
