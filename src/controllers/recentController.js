const { RecentFile, File } = require('../models');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError } = require('../utils/errors');

const listRecent = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await RecentFile.findAndCountAll({
      where: { user_id: req.user.id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: File,
        as: 'file',
        attributes: ['id', 'name', 'extension']
      }],
      order: [['accessed_at', 'DESC']]
    });

    return res.json(paginatedResponse(rows, parseInt(page), parseInt(limit), count));
  } catch (error) {
    next(error);
  }
};

const recordAccess = async (req, res, next) => {
  try {
    const { file_id } = req.body;

    const file = await File.findOne({
      where: { id: file_id, user_id: req.user.id }
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

    return res.status(201).json(successResponse(recentFile, 'File access recorded'));
  } catch (error) {
    next(error);
  }
};

const clearHistory = async (req, res, next) => {
  try {
    await RecentFile.destroy({
      where: { user_id: req.user.id }
    });

    return res.json(successResponse(null, 'Recent history cleared successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listRecent,
  recordAccess,
  clearHistory
};
