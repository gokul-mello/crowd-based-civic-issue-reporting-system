const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      default: null
    },
    title: {
      type: String,
      required: true,
      default: 'Complaint Update'
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['SUBMISSION', 'STATUS_CHANGE', 'ASSIGNMENT', 'PRIORITY_UPDATE', 'VOTE_MILESTONE', 'RESOLUTION', 'REJECTION', 'SYSTEM'],
      default: 'STATUS_CHANGE'
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
