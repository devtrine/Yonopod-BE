const Joi = require('joi');

const createNotificationSchema = Joi.object({
  title: Joi.string().max(255).required(),
  message: Joi.string().required(),
  type: Joi.string().valid('info', 'success', 'warning', 'error', 'system').default('info'),
  data: Joi.object().optional().allow(null)
});

const listNotificationsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  is_read: Joi.boolean().optional(),
  type: Joi.string().optional()
});

const testNotificationSchema = Joi.object({
  title: Joi.string().max(255).optional().default('Test Notification'),
  message: Joi.string().optional().default('This is a test notification broadcasted via WebSocket'),
  type: Joi.string().valid('info', 'success', 'warning', 'error', 'system').default('info'),
  data: Joi.object().optional().allow(null)
});

module.exports = {
  createNotificationSchema,
  listNotificationsQuery,
  testNotificationSchema
};
