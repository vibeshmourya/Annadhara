const Notification = require('../models/Notification');

/**
 * Creates and saves an in-app notification for a user
 */
const createNotification = async ({
  recipient,
  title,
  message,
  type,
  relatedId = null,
  relatedModel = null,
  actionUrl = '',
}) => {
  try {
    if (!recipient) return null;
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      relatedId,
      relatedModel,
      actionUrl,
    });
    return notification;
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error.message);
    return null;
  }
};

module.exports = { createNotification };

