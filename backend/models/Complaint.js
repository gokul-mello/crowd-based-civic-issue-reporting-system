const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    originalDescription: {
      type: String,
      required: [true, 'Please provide the raw everyday description of the issue'],
      trim: true
    },
    professionalTitle: {
      type: String,
      required: [true, 'Please provide a professional complaint title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    professionalDescription: {
      type: String,
      required: [true, 'Please provide the formal complaint description'],
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Roads & Potholes',
        'Garbage & Sanitation',
        'Water Supply & Leakage',
        'Streetlights & Electrical',
        'Drainage & Sewage',
        'Public Property & Parks',
        'Traffic & Safety',
        'Other'
      ],
      default: 'Other',
      index: true
    },
    area: {
      type: String,
      required: [true, 'Please provide area or locality'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Please provide full address or landmark location'],
      trim: true
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    imageUrls: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Submitted',
      index: true
    },
    priorityScore: {
      type: Number,
      default: 20
    },
    priorityLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low',
      index: true
    },
    priorityReason: {
      type: String,
      default: 'Initial citizen submission base score'
    },
    voteCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    assignedAuthorityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    authorityRemarks: {
      type: String,
      default: ''
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    resolutionNotes: {
      type: String,
      default: ''
    },
    resolutionEvidence: {
      type: [String],
      default: []
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

complaintSchema.index({ category: 1, area: 1 });
complaintSchema.index({ status: 1, priorityLevel: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
