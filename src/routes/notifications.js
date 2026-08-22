const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const notificationController = require('../controllers/notificationController');
const {
  createNotificationSchema,
  listNotificationsQuery,
  testNotificationSchema
} = require('../validators/notificationValidator');

// All notification endpoints require authentication
router.use(requireAuth);

// Test notification endpoint (saves to DB and broadcasts via WebSocket)
router.post('/test', validate(testNotificationSchema, 'body'), notificationController.testNotification);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

// CRUD routes
router.get('/', validate(listNotificationsQuery, 'query'), notificationController.listNotifications);
router.post('/', validate(createNotificationSchema, 'body'), notificationController.createNotification);
router.get('/:id', notificationController.getNotification);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
