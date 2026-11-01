const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const ComplaintHistory = require('../models/ComplaintHistory');
const { notifyComplaintStatusChange, createNotification } = require('../services/notificationService');

// @desc    Get Authority dashboard overview statistics
// @route   GET /api/authority/dashboard
// @access  Private (Authority)
const getDashboardStats = async (req, res, next) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const newSubmitted = await Complaint.countDocuments({ status: 'Submitted' });
    const underReview = await Complaint.countDocuments({ status: 'Under Review' });
    const assigned = await Complaint.countDocuments({ status: 'Assigned' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });
    const rejected = await Complaint.countDocuments({ status: 'Rejected' });
    const highPriority = await Complaint.countDocuments({
      priorityLevel: { $in: ['High', 'Critical'] },
      status: { $nin: ['Resolved', 'Rejected'] }
    });

    // Recent activity
    const recentActivity = await ComplaintHistory.find()
      .populate('changedBy', 'name designation role')
      .populate('complaintId', 'complaintId professionalTitle')
      .sort({ createdAt: -1 })
      .limit(8);

    // Urgent complaints requiring immediate intervention
    const urgentComplaints = await Complaint.find({
      status: { $in: ['Submitted', 'Under Review', 'Assigned', 'In Progress'] }
    })
      .populate('departmentId', 'name')
      .sort({ priorityScore: -1, voteCount: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalComplaints,
        newSubmitted,
        pendingReview: underReview,
        assigned,
        inProgress,
        resolved,
        rejected,
        highPriority
      },
      recentActivity,
      urgentComplaints
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints with full administrative search and filtering
// @route   GET /api/authority/complaints
// @access  Private (Authority)
const getAuthorityComplaints = async (req, res, next) => {
  try {
    const {
      status,
      category,
      priority,
      department,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 15
    } = req.query;

    const query = {};

    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;
    if (priority && priority !== 'All') query.priorityLevel = priority;
    if (department && department !== 'All') query.departmentId = department;

    if (search) {
      query.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { professionalTitle: { $regex: search, $options: 'i' } },
        { originalDescription: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } }
      ];
    }

    let sortObj = {};
    if (sortBy === 'priority') {
      sortObj = { priorityScore: order === 'asc' ? 1 : -1, createdAt: -1 };
    } else if (sortBy === 'votes') {
      sortObj = { voteCount: order === 'asc' ? 1 : -1, createdAt: -1 };
    } else {
      sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('citizenId', 'name email phone')
      .populate('departmentId', 'name code')
      .populate('assignedAuthorityId', 'name designation')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: complaints
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status (Under Review, Assigned, In Progress, Resolved, Rejected)
// @route   PATCH /api/authority/complaints/:id/status
// @access  Private (Authority)
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks, rejectionReason, resolutionNotes, resolutionEvidence } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const validStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status specified' });
    }

    // Validation for rejection
    if (status === 'Rejected' && (!rejectionReason || rejectionReason.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'A clear rejection reason is mandatory when marking a complaint as Rejected.'
      });
    }

    // Validation for resolution
    if (status === 'Resolved' && (!resolutionNotes || resolutionNotes.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Mandatory resolution notes are required when marking a complaint as Resolved.'
      });
    }

    const prevStatus = complaint.status;
    complaint.status = status;
    if (remarks) complaint.authorityRemarks = remarks.trim();
    if (rejectionReason) complaint.rejectionReason = rejectionReason.trim();
    if (resolutionNotes) complaint.resolutionNotes = resolutionNotes.trim();
    if (resolutionEvidence) complaint.resolutionEvidence = resolutionEvidence;
    if (status === 'Resolved') {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    // Log in ComplaintHistory audit trail
    await ComplaintHistory.create({
      complaintId: complaint._id,
      changedBy: req.user._id,
      actionType: status === 'Resolved' ? 'RESOLVED' : status === 'Rejected' ? 'REJECTED' : 'STATUS_CHANGE',
      previousStatus: prevStatus,
      newStatus: status,
      remarks: remarks || rejectionReason || resolutionNotes || `Status updated to ${status}`
    });

    // Send in-app notification to citizen
    await notifyComplaintStatusChange({
      complaint,
      previousStatus: prevStatus,
      newStatus: status,
      remarks: remarks || rejectionReason || resolutionNotes
    });

    res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status}`,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign complaint to department and designated authority
// @route   PATCH /api/authority/complaints/:id/assign
// @access  Private (Authority)
const assignComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { departmentId, assignedAuthorityId, remarks } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({ success: false, message: 'Department not found' });
    }

    const prevStatus = complaint.status;
    complaint.departmentId = departmentId;
    if (assignedAuthorityId) complaint.assignedAuthorityId = assignedAuthorityId;
    if (complaint.status === 'Submitted' || complaint.status === 'Under Review') {
      complaint.status = 'Assigned';
    }
    if (remarks) complaint.authorityRemarks = remarks;

    await complaint.save();

    await ComplaintHistory.create({
      complaintId: complaint._id,
      changedBy: req.user._id,
      actionType: 'ASSIGNED',
      previousStatus: prevStatus,
      newStatus: complaint.status,
      remarks: remarks || `Assigned to department: ${department.name}`,
      metadata: { departmentId, departmentName: department.name }
    });

    await createNotification({
      recipientId: complaint.citizenId,
      complaintId: complaint._id,
      title: 'Department Assigned',
      message: `Your complaint "${complaint.professionalTitle}" has been assigned to the ${department.name} department for field action.`,
      type: 'ASSIGNMENT'
    });

    res.status(200).json({
      success: true,
      message: `Complaint assigned to ${department.name}`,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review and override priority with recorded justification
// @route   PATCH /api/authority/complaints/:id/priority
// @access  Private (Authority)
const overridePriority = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priorityLevel, priorityReason } = req.body;

    if (!['Low', 'Medium', 'High', 'Critical'].includes(priorityLevel)) {
      return res.status(400).json({ success: false, message: 'Invalid priority level' });
    }

    if (!priorityReason || priorityReason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A formal reason is required for administrative priority override.'
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const prevLevel = complaint.priorityLevel;
    complaint.priorityLevel = priorityLevel;
    complaint.priorityReason = `Authority Override: ${priorityReason.trim()}`;

    // Adjust numeric score accordingly
    const scores = { Low: 25, Medium: 50, High: 75, Critical: 95 };
    complaint.priorityScore = scores[priorityLevel];

    await complaint.save();

    await ComplaintHistory.create({
      complaintId: complaint._id,
      changedBy: req.user._id,
      actionType: 'PRIORITY_OVERRIDE',
      previousStatus: complaint.status,
      newStatus: complaint.status,
      remarks: `Priority changed from ${prevLevel} to ${priorityLevel}. Justification: ${priorityReason}`
    });

    res.status(200).json({
      success: true,
      message: `Priority overridden to ${priorityLevel}`,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregate analytics charts data
// @route   GET /api/authority/analytics
// @access  Private (Authority)
const getAuthorityAnalytics = async (req, res, next) => {
  try {
    // 1. By Category
    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalVotes: { $sum: '$voteCount' } } },
      { $sort: { count: -1 } }
    ]);

    // 2. By Status
    const statusStats = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // 3. By Priority
    const priorityStats = await Complaint.aggregate([
      { $group: { _id: '$priorityLevel', count: { $sum: 1 } } }
    ]);

    // 4. Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyTrends = await Complaint.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          submitted: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byCategory: categoryStats,
        byStatus: statusStats,
        byPriority: priorityStats,
        monthlyTrends
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAuthorityComplaints,
  updateComplaintStatus,
  assignComplaint,
  overridePriority,
  getAuthorityAnalytics
};
