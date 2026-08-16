const Joi = require('joi');

const searchSchema = Joi.object({
  q: Joi.string().optional().allow(''),
  type: Joi.string().optional().allow(''),
  folderId: Joi.string().uuid().optional().allow(null),
  favorite: Joi.boolean().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  tag: Joi.string().optional(),
  label: Joi.string().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('name', 'size', 'created_at', 'updated_at').default('created_at'),
  sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC')
});

module.exports = {
  searchSchema
};
