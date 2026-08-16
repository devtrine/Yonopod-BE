const Joi = require('joi');

const presignUploadSchema = Joi.object({
  name: Joi.string().required(),
  extension: Joi.string().required(),
  size: Joi.number().integer().required().min(0),
  folder_id: Joi.string().uuid().optional().allow(null),
});

const confirmUploadSchema = Joi.object({
  file_key: Joi.string().required(),
  name: Joi.string().optional(),
  extension: Joi.string().optional().allow(''),
  folder_id: Joi.string().uuid().optional().allow(null),
  checksum: Joi.string().optional().allow(null, ''),
  size: Joi.number().integer().optional().default(0)
});

const updateFileSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  folder_id: Joi.string().uuid().allow(null).optional(),
  is_favorite: Joi.boolean().optional()
});

const listFilesQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  folder_id: Joi.string().uuid().optional().allow(null),
  extension: Joi.string().optional(),
  search: Joi.string().optional(),
  sort_by: Joi.string().valid('name', 'created_at').default('created_at'),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC')
});

module.exports = {
  presignUploadSchema,
  confirmUploadSchema,
  updateFileSchema,
  listFilesQuery
};
