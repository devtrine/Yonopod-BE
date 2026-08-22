const { Notification } = require('../models');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');
const { sendSocket, isUserConnected } = require('../utils/websocket');

/**
 * Get paginated list of notifications for the authenticated user
 */
const listNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, is_read, type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = { user_id: req.user.id };

    if (is_read !== undefined) {
      whereClause.is_read = is_read === 'true' || is_read === true;
    }

    if (type) {
      whereClause.type = type;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / parseInt(limit)) || 1;

    return paginatedResponse(res, rows, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages
    }, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get single notification by ID
 */
const getNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return successResponse(res, notification, 'Notification retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new notification
 */
const createNotification = async (req, res, next) => {
  try {
    const { title, message, type = 'info', data = null } = req.body;

    const notification = await Notification.create({
      user_id: req.user.id,
      title,
      message,
      type,
      data,
      is_read: false
    });

    return successResponse(res, notification, 'Notification created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a specific notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await notification.update({
      is_read: true,
      read_at: new Date()
    });

    return successResponse(res, notification, 'Notification marked as read successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read for current user
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const [updatedCount] = await Notification.update(
      {
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          user_id: req.user.id,
          is_read: false
        }
      }
    );

    return successResponse(
      res,
      { updated_count: updatedCount },
      'All notifications marked as read successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await notification.destroy();

    return successResponse(res, null, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Test notification endpoint:
 * Saves notification to DB and sends real-time socket message to req.user.id via sendSocket
 */
const testNotification = async (req, res, next) => {
  try {
    const {
      title = 'Test Notification',
      message = 'This is a test notification broadcasted via WebSocket',
      type = 'info',
      data = null
    } = req.body;

    const notification = await Notification.create({
      user_id: req.user.id,
      title,
      message,
      type,
      data: data || { test: true, timestamp: new Date().toISOString() },
      is_read: false
    });

    // Broadcast through WebSocket to user's active sockets
    const isConnected = isUserConnected(req.user.id);
    const delivered = sendSocket(req.user.id, {
      event: 'notification',
      data: notification
    });

    console.log("ICONN:", isConnected)

    return successResponse(
      res,
      {
        notification,
        socket_status: {
          user_connected: isConnected,
          delivered: delivered
        }
      },
      'Test notification sent and broadcasted successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listNotifications,
  getNotification,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  testNotification
};
