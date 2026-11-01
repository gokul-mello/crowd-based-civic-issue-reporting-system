const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to guarantee one vote per citizen per complaint
voteSchema.index({ citizenId: 1, complaintId: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
