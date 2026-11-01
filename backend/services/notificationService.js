/**
 * Notification Service
 * Handles in-app notifications for citizens and authorities
 */

const Notification = require('../models/Notification');

const createNotification = async ({
  recipientId,
  complaintId = null,
  title,
  message,
  type = 'STATUS_CHANGE'
}) => {
  try {
    const notif = await Notification.create({
      recipientId,
      complaintId,
      title,
      message,
      type
    });
    return notif;
  } catch (error) {
    console.error('Failed to create in-app notification:', error.message);
    return null;
  }
};

const notifyComplaintStatusChange = async ({ complaint, previousStatus, newStatus, remarks }) => {
  if (!complaint || !complaint.citizenId) return;

  const title = `Complaint ${complaint.complaintId} Updated`;
  let message = `Your complaint "${complaint.professionalTitle}" has moved from "${previousStatus}" to "${newStatus}".`;
  if (remarks) {
    message += ` Authority remarks: "${remarks}"`;
  }

  let type = 'STATUS_CHANGE';
  if (newStatus === 'Resolved') type = 'RESOLUTION';
  if (newStatus === 'Rejected') type = 'REJECTION';
  if (newStatus === 'Assigned') type = 'ASSIGNMENT';

  return await createNotification({
    recipientId: complaint.citizenId,
    complaintId: complaint._id,
    title,
    message,
    type
  });
};

module.exports = {
  createNotification,
  notifyComplaintStatusChange
};
