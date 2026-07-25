const Joi = require('joi');

const addFavoriteSchema = Joi.object({
  file_id: Joi.number().integer().optional(),
  folder_id: Joi.number().integer().optional()
}).xor('file_id', 'folder_id');

const listFavoritesQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string().valid('file', 'folder').optional()
});

module.exports = {
  addFavoriteSchema,
  listFavoritesQuery
};
