const { RecentFile, File, Folder } = require('../models');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, BadRequestError } = require('../utils/errors');

const listRecent = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await RecentFile.findAndCountAll({
      where: { user_id: req.user.id },
      limit: limitNum,
      offset,
      include: [{
        model: File,
        as: 'file',
        // Hanya ambil atribut yang cuma ada di model File
        attributes: ['id', 'folder_id', 'name', 'extension', 'thumbnail_path', 'is_favorite', 'created_at', 'updated_at'],
        required: true, // Otomatis mengabaikan RecentFile kalau File-nya udah di-soft delete
        include: [{
          model: Folder,
          as: 'folder',
          attributes: ['id', 'name']
        }]
      }],
      order: [['accessed_at', 'DESC']]
    });

    return paginatedResponse(res, rows, count, pageNum, limitNum, 'Recent files retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const recordAccess = async (req, res, next) => {
  try {
    const { file_id } = req.body;

    if (!file_id) {
      throw new BadRequestError('file_id is required');
    }

    // 💡 Sequelize paranoid otomatis menyaring file yang di-soft-delete
    const file = await File.findOne({
      where: { 
        id: file_id, 
        user_id: req.user.id
      },
    });

    if (!file) {
      throw new NotFoundError('File not found');
    }

    const [recentFile, created] = await RecentFile.findOrCreate({
      where: { user_id: req.user.id, file_id },
      defaults: {
        accessed_at: new Date()
      }
    });

    if (!created) {
      recentFile.accessed_at = new Date();
      await recentFile.save();
    }

    return successResponse(res, recentFile, 'File access recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};

const clearHistory = async (req, res, next) => {
  try {
    await RecentFile.destroy({
      where: { user_id: req.user.id }
    });

    return successResponse(res, null, 'Recent history cleared successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listRecent,
  recordAccess,
  clearHistory
};