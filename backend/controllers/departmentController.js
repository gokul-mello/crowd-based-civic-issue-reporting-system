const Department = require('../models/Department');

// @desc    Get all active civic departments
// @route   GET /api/departments
// @access  Public
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create department (Admin/Authority only)
// @route   POST /api/departments
// @access  Private (Authority)
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, contactEmail, contactPhone, headOfficial } = req.body;

    if (!name || !code || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide department name, code, and description'
      });
    }

    const existing = await Department.findOne({
      $or: [{ code: code.toUpperCase() }, { name }]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Department with this code or name already exists'
      });
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description,
      contactEmail,
      contactPhone,
      headOfficial
    });

    res.status(201).json({
      success: true,
      message: 'Department registered successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  createDepartment
};
