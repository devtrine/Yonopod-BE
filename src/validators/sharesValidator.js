const Joi = require('joi');

const createShareSchema = Joi.object({
  file_id: Joi.number().integer().optional(),
  folder_id: Joi.number().integer().optional(),
  share_type: Joi.string().valid('link', 'form').default('link'),
  
  // 🔑 Password link publik (untuk penerima share)
  password: Joi.string().optional().allow('', null),
  
  // 🔒 Password vault (untuk verifikasi pembukaan folder terkunci milik pemilik)
  vault_password: Joi.string().optional().allow('', null),
  
  permission: Joi.string().valid('read_only', 'read_write').default('read_only'),
  download_limit: Joi.number().integer().min(0).optional().allow(null),
  expires_at: Joi.date().iso().optional().allow(null)
}).xor('file_id', 'folder_id');

const updateShareSchema = Joi.object({
  password: Joi.string().allow('', null),
  permission: Joi.string().valid('read_only', 'read_write'),
  download_limit: Joi.number().integer().min(0).allow(null),
  expires_at: Joi.date().iso().allow(null)
}).min(1);

const verifySharePasswordSchema = Joi.object({
  password: Joi.string().required()
});

module.exports = {
  createShareSchema,
  updateShareSchema,
  verifySharePasswordSchema
};