const Joi = require('joi');

const createFolderSchema = Joi.object({
  name: Joi.string().max(150).required(),
  parent_id: Joi.number().integer().optional().allow(null)
});

const updateFolderSchema = Joi.object({
  name: Joi.string().max(150).optional(),
  parent_id: Joi.number().integer().allow(null).optional()
});

const listFoldersQuery = Joi.object({
  parent_id: Joi.number().integer().optional().allow(null),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

module.exports = {
  createFolderSchema,
  updateFolderSchema,
  listFoldersQuery
};
