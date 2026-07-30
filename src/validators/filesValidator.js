const Joi = require('joi');

const presignUploadSchema = Joi.object({
  name: Joi.string().required(),
  extension: Joi.string().required(),
  folder_id: Joi.number().integer().optional().allow(null),
});

const confirmUploadSchema = Joi.object({
  file_key: Joi.string().required(),
  name: Joi.string().optional(),
  extension: Joi.string().optional().allow(''),
  folder_id: Joi.number().integer().optional().allow(null),
  checksum: Joi.string().optional().allow(null, '')
});

const updateFileSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  folder_id: Joi.number().integer().allow(null).optional(),
  is_favorite: Joi.boolean().optional()
});

const listFilesQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  folder_id: Joi.number().integer().optional().allow(null),
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
