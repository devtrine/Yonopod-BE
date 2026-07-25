const Joi = require('joi');

const createTagSchema = Joi.object({
  name: Joi.string().max(100).required(),
  color: Joi.string().max(20).optional().allow('', null)
});

const updateTagSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  color: Joi.string().max(20).optional().allow(null, '')
});

const listTagsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50)
});

module.exports = {
  createTagSchema,
  updateTagSchema,
  listTagsQuery
};
