const Complaint = require('../models/Complaint');
const Vote = require('../models/Vote');
const ComplaintHistory = require('../models/ComplaintHistory');
const { generateProfessionalComplaint } = require('../services/aiComplaintService');
const { calculatePriority } = require('../services/priorityService');
const { findPotentialDuplicates } = require('../services/duplicateDetectionService');
const { createNotification } = require('../services/notificationService');

// Generate human-friendly sequential or random complaint tracking ID
const generateUniqueComplaintId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `CC-${year}-${rand}`;
};

// @desc    Transform raw citizen input into professional grievance using AI / Heuristics
// @route   POST /api/complaints/generate-ai
// @access  Private (Citizen)
const generateAiComplaint = async (req, res, next) => {
  try {
    const { originalDescription, category, area } = req.body;

    if (!originalDescription || originalDescription.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 10 characters describing the problem.'
      });
    }

    const aiResult = await generateProfessionalComplaint({
      originalDescription,
      category,
      area
    });

    res.status(200).json({
      success: true,
      data: aiResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check for potential duplicate complaints in nearby locality
// @route   POST /api/complaints/check-duplicates
// @access  Private (Citizen)
const checkDuplicates = async (req, res, next) => {
  try {
    const { category, area, originalDescription, latitude, longitude } = req.body;

    const duplicates = await findPotentialDuplicates({
      category,
      area,
      originalDescription: originalDescription || '',
      latitude,
      longitude
    });

    res.status(200).json({
      success: true,
      count: duplicates.length,
      data: duplicates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a new complaint
// @route   POST /api/complaints
// @access  Private (Citizen)
const createComplaint = async (req, res, next) => {
  try {
    const {
      originalDescription,
      professionalTitle,
      professionalDescription,
      category,
      area,
      location,
      latitude,
      longitude,
      suggestedUrgency,
      imageUrls
    } = req.body;

    if (!originalDescription || !professionalTitle || !professionalDescription || !area || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required complaint fields'
      });
    }

    // Process uploaded files if any were handled via multipart form
    let finalImages = Array.isArray(imageUrls) ? [...imageUrls] : [];
    if (req.files && req.files.length > 0) {
      const uploadedPaths = req.files.map((file) => `/uploads/${file.filename}`);
      finalImages = [...finalImages, ...uploadedPaths];
    }

    // Calculate initial multi-factor priority score
    const priority = calculatePriority({
      voteCount: 0,
      category: category || 'Other',
      createdAt: new Date(),
      suggestedUrgency: suggestedUrgency || 'Medium'
    });

    // Generate unique complaint ID
    let complaintId = generateUniqueComplaintId();
    let isUnique = false;
    while (!isUnique) {
      const existing = await Complaint.findOne({ complaintId });
      if (!existing) isUnique = true;
      else complaintId = generateUniqueComplaintId();
    }

    const complaint = await Complaint.create({
      complaintId,
      citizenId: req.user._id,
      originalDescription: originalDescription.trim(),
      professionalTitle: professionalTitle.trim(),
      professionalDescription: professionalDescription.trim(),
      category: category || 'Other',
      area: area.trim(),
      location: location.trim(),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      imageUrls: finalImages,
      status: 'Submitted',
      priorityScore: priority.priorityScore,
      priorityLevel: priority.priorityLevel,
      priorityReason: priority.priorityReason,
      voteCount: 0
    });

    // Create audit history entry
    await ComplaintHistory.create({
      complaintId: complaint._id,
      changedBy: req.user._id,
      actionType: 'CREATED',
      newStatus: 'Submitted',
      remarks: 'Complaint registered by citizen'
    });

    // Create in-app confirmation notification for citizen
    await createNotification({
      recipientId: req.user._id,
      complaintId: complaint._id,
      title: 'Complaint Registered',
      message: `Your issue "${complaint.professionalTitle}" was successfully logged with ID ${complaint.complaintId}.`,
      type: 'SUBMISSION'
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all public complaints with filtering, search, and pagination
// @route   GET /api/complaints
// @access  Public / Private
const getComplaints = async (req, res, next) => {
  try {
    const {
      category,
      status,
      area,
      priority,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (priority && priority !== 'All') {
      query.priorityLevel = priority;
    }

    if (area) {
      query.area = { $regex: area, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { professionalTitle: { $regex: search, $options: 'i' } },
        { professionalDescription: { $regex: search, $options: 'i' } },
        { originalDescription: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } }
      ];
    }

    // Determine sort
    let sortOptions = {};
    if (sortBy === 'votes') {
      sortOptions = { voteCount: order === 'asc' ? 1 : -1, createdAt: -1 };
    } else if (sortBy === 'priority') {
      sortOptions = { priorityScore: order === 'asc' ? 1 : -1, createdAt: -1 };
    } else {
      sortOptions = { [sortBy]: order === 'asc' ? 1 : -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('citizenId', 'name')
      .populate('departmentId', 'name code')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // If user is authenticated, check which complaints they have voted on
    let votedComplaintIds = new Set();
    if (req.user) {
      const userVotes = await Vote.find({
        citizenId: req.user._id,
        complaintId: { $in: complaints.map((c) => c._id) }
      });
      votedComplaintIds = new Set(userVotes.map((v) => v.complaintId.toString()));
    }

    const enhancedComplaints = complaints.map((c) => {
      const doc = c.toObject();
      doc.hasVoted = votedComplaintIds.has(c._id.toString());
      return doc;
    });

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: enhancedComplaints
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single complaint by ID or complaintId
// @route   GET /api/complaints/:id
// @access  Public / Private
const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let complaint;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      complaint = await Complaint.findById(id);
    } else {
      complaint = await Complaint.findOne({ complaintId: id.toUpperCase() });
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    await complaint.populate('citizenId', 'name email phone');
    await complaint.populate('departmentId', 'name code description contactEmail contactPhone');
    await complaint.populate('assignedAuthorityId', 'name designation');

    // Fetch complaint history / audit trail
    const history = await ComplaintHistory.find({ complaintId: complaint._id })
      .populate('changedBy', 'name role designation')
      .sort({ createdAt: 1 });

    // Check if current user voted
    let hasVoted = false;
    if (req.user) {
      const existingVote = await Vote.findOne({
        citizenId: req.user._id,
        complaintId: complaint._id
      });
      hasVoted = !!existingVote;
    }

    const doc = complaint.toObject();
    doc.hasVoted = hasVoted;
    doc.history = history;

    res.status(200).json({
      success: true,
      data: doc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaints submitted by the logged in citizen
// @route   GET /api/complaints/my
// @access  Private (Citizen)
const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ citizenId: req.user._id })
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });

    const totalSubmitted = complaints.length;
    const pending = complaints.filter((c) => ['Submitted', 'Under Review'].includes(c.status)).length;
    const inProgress = complaints.filter((c) => ['Assigned', 'In Progress'].includes(c.status)).length;
    const resolved = complaints.filter((c) => c.status === 'Resolved').length;

    res.status(200).json({
      success: true,
      stats: {
        totalSubmitted,
        pending,
        inProgress,
        resolved
      },
      data: complaints
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Community vote to support an existing complaint
// @route   POST /api/complaints/:id/vote
// @access  Private (Citizen)
const voteComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const citizenId = req.user._id;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Rule: Cannot vote for own complaint
    if (complaint.citizenId.toString() === citizenId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote for your own submitted complaint. Other community members can support it.'
      });
    }

    // Rule: Cannot vote on resolved or rejected complaints
    if (['Resolved', 'Rejected'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: `Voting is closed for complaints that are ${complaint.status.toLowerCase()}.`
      });
    }

    // Check duplicate vote
    const existingVote = await Vote.findOne({ citizenId, complaintId: complaint._id });
    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted to support this complaint.'
      });
    }

    // Create vote and increment atomically
    await Vote.create({ citizenId, complaintId: complaint._id });
    
    complaint.voteCount = (complaint.voteCount || 0) + 1;
    
    // Recalculate priority based on new vote count
    const updatedPriority = calculatePriority({
      voteCount: complaint.voteCount,
      category: complaint.category,
      createdAt: complaint.createdAt,
      suggestedUrgency: complaint.priorityLevel === 'Critical' ? 'Critical' : 'Medium'
    });

    complaint.priorityScore = updatedPriority.priorityScore;
    complaint.priorityLevel = updatedPriority.priorityLevel;
    complaint.priorityReason = updatedPriority.priorityReason;

    await complaint.save();

    // Check for milestone notification to author (e.g. 10, 25, 50 votes)
    if ([5, 10, 25, 50, 100].includes(complaint.voteCount)) {
      await createNotification({
        recipientId: complaint.citizenId,
        complaintId: complaint._id,
        title: 'Community Support Milestone!',
        message: `Your complaint "${complaint.professionalTitle}" has reached ${complaint.voteCount} community votes! Priority score elevated.`,
        type: 'VOTE_MILESTONE'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vote registered successfully',
      voteCount: complaint.voteCount,
      priorityLevel: complaint.priorityLevel,
      priorityScore: complaint.priorityScore
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove previously cast community vote
// @route   DELETE /api/complaints/:id/vote
// @access  Private (Citizen)
const removeVote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const citizenId = req.user._id;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const existingVote = await Vote.findOneAndDelete({ citizenId, complaintId: complaint._id });
    if (!existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have not voted for this complaint yet'
      });
    }

    complaint.voteCount = Math.max(0, (complaint.voteCount || 1) - 1);

    // Recalculate priority
    const updatedPriority = calculatePriority({
      voteCount: complaint.voteCount,
      category: complaint.category,
      createdAt: complaint.createdAt
    });

    complaint.priorityScore = updatedPriority.priorityScore;
    complaint.priorityLevel = updatedPriority.priorityLevel;
    complaint.priorityReason = updatedPriority.priorityReason;

    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Vote removed successfully',
      voteCount: complaint.voteCount,
      priorityLevel: complaint.priorityLevel,
      priorityScore: complaint.priorityScore
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateAiComplaint,
  checkDuplicates,
  createComplaint,
  getComplaints,
  getComplaintById,
  getMyComplaints,
  voteComplaint,
  removeVote
};
