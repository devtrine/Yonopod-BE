const { Favorite, File, Folder } = require('../models');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { Op } = require('sequelize');

const listFavorites = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { user_id: req.user.id };

    if (type === 'file') {
      whereClause.file_id = { [Op.not]: null };
    } else if (type === 'folder') {
      whereClause.folder_id = { [Op.not]: null };
    }

    const { count, rows } = await Favorite.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: File, as: 'file' },
        { model: Folder, as: 'folder' }
      ],
      order: [['created_at', 'DESC']]
    });

    return paginatedResponse(res, rows, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count
    }, 'Favorites retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const { file_id, folder_id } = req.body;

    if (file_id) {
      const file = await File.findOne({ where: { id: file_id, user_id: req.user.id } });
      if (!file) throw new NotFoundError('File not found');

      const existing = await Favorite.findOne({ where: { user_id: req.user.id, file_id } });
      if (existing) throw new ValidationError('File is already in favorites');
    }

    if (folder_id) {
      const folder = await Folder.findOne({ where: { id: folder_id, user_id: req.user.id } });
      if (!folder) throw new NotFoundError('Folder not found');

      const existing = await Favorite.findOne({ where: { user_id: req.user.id, folder_id } });
      if (existing) throw new ValidationError('Folder is already in favorites');
    }

    const favorite = await Favorite.create({
      user_id: req.user.id,
      file_id,
      folder_id,
      created_at: new Date()
    });

    // If it's a file, we should probably also update the is_favorite flag on the file itself to keep it in sync
    // if that field is meant for caching
    if (file_id) {
      await File.update({ is_favorite: true }, { where: { id: file_id } });
    }

    return successResponse(res, favorite, 'Added to favorites successfully', 201);
  } catch (error) {
    next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;

    const favorite = await Favorite.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!favorite) {
      throw new NotFoundError('Favorite not found');
    }

    if (favorite.file_id) {
      await File.update({ is_favorite: false }, { where: { id: favorite.file_id } });
    }

    await favorite.destroy();

    return successResponse(res, null, 'Removed from favorites successfully', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listFavorites,
  addFavorite,
  removeFavorite
};
