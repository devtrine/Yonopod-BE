const Joi = require('joi');

const presignUploadSchema = Joi.object({
  name: Joi.string().required(),
  extension: Joi.string().required(),
  size: Joi.number().integer().required().min(0),
  folder_id: Joi.string().uuid().optional().allow(null),
});

const s3PresignSchema = Joi.object({
  method: Joi.string().valid('PUT', 'POST', 'DELETE', 'GET').required(),
  key: Joi.string().required(),
  uploadId: Joi.string().optional().allow(null, ''),
  partNumber: Joi.number().integer().min(1).optional().allow(null),
  contentType: Joi.string().optional().allow(null, ''),
  size: Joi.number().integer().min(0).optional().allow(null)
});

const confirmUploadSchema = Joi.object({
  key: Joi.string().optional(),
  file_key: Joi.string().optional(),
  name: Joi.string().required(),
  extension: Joi.string().optional().allow('', null),
  folder_id: Joi.string().uuid().optional().allow(null),
  checksum: Joi.string().optional().allow(null, ''),
  size: Joi.number().integer().optional().default(0)
}).or('key', 'file_key');

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
  s3PresignSchema,
  confirmUploadSchema,
  updateFileSchema,
  listFilesQuery
};
