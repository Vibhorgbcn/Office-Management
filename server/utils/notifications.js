const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 * @param {Object} options - Notification options
 * @param {String} options.userId - User ID to notify
 * @param {String} options.type - Notification type
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {String} options.link - Optional link
 * @param {Object} options.metadata - Optional metadata
 */
async function createNotification({ userId, type, title, message, link, metadata }) {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      link,
      metadata,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Notify user when a case is assigned
 */
async function notifyCaseAssigned(userId, caseData) {
  return createNotification({
    userId,
    type: 'case_assigned',
    title: 'New Case Assigned',
    message: `You have been assigned to case: ${caseData.caseNumber} - ${caseData.title}`,
    link: `/cases`, // Navigate to cases list page
    metadata: { caseId: caseData._id },
  });
}

/**
 * Notify user when a task is assigned
 */
async function notifyTaskAssigned(userId, taskData) {
  return createNotification({
    userId,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: `New task assigned: ${taskData.title}. Due: ${new Date(taskData.dueDate).toLocaleDateString()}`,
    link: `/work-assignments`, // Navigate to work assignments list page
    metadata: { taskId: taskData._id },
  });
}

/**
 * Notify user when a task is overdue
 */
async function notifyTaskOverdue(userId, taskData) {
  return createNotification({
    userId,
    type: 'task_overdue',
    title: 'Task Overdue',
    message: `Task "${taskData.title}" is overdue. Please complete it soon.`,
    link: `/work-assignments/${taskData._id}`,
    metadata: { taskId: taskData._id },
  });
}

/**
 * Notify user about upcoming hearing
 */
async function notifyUpcomingHearing(userId, caseData) {
  const hearingDate = new Date(caseData.nextHearingDate);
  const daysUntil = Math.ceil((hearingDate - new Date()) / (1000 * 60 * 60 * 24));
  
  return createNotification({
    userId,
    type: 'hearing_upcoming',
    title: 'Upcoming Hearing',
    message: `Hearing for case "${caseData.caseNumber}" is in ${daysUntil} day(s) on ${hearingDate.toLocaleDateString()}`,
    link: `/cases/${caseData._id}`,
    metadata: { caseId: caseData._id, hearingDate: caseData.nextHearingDate },
  });
}

/**
 * Notify user when bill is generated
 */
async function notifyBillGenerated(userId, billData) {
  return createNotification({
    userId,
    type: 'bill_generated',
    title: 'Bill Generated',
    message: `A new bill (${billData.billNumber}) has been generated. Amount: ₹${billData.totalAmount?.toLocaleString()}`,
    link: `/bills/${billData._id}`,
    metadata: { billId: billData._id },
  });
}

/**
 * Notify admin when employee is late
 */
async function notifyLateAttendance(adminId, attendanceData) {
  return createNotification({
    userId: adminId,
    type: 'attendance_late',
    title: 'Late Attendance',
    message: `${attendanceData.employeeId?.name} checked in late today at ${new Date(attendanceData.checkIn).toLocaleTimeString()}`,
    link: `/attendance/${attendanceData._id}`,
    metadata: { attendanceId: attendanceData._id, employeeId: attendanceData.employeeId },
  });
}

/**
 * Create system announcement
 */
async function createSystemAnnouncement(userIds, title, message) {
  const notifications = userIds.map(userId =>
    createNotification({
      userId,
      type: 'system_announcement',
      title,
      message,
      link: null,
    })
  );
  return Promise.all(notifications);
}

module.exports = {
  createNotification,
  notifyCaseAssigned,
  notifyTaskAssigned,
  notifyTaskOverdue,
  notifyUpcomingHearing,
  notifyBillGenerated,
  notifyLateAttendance,
  createSystemAnnouncement,
};

