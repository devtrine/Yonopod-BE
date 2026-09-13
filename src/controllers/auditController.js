const { AuditLog, User, Folder, File } = require('../models');
const { paginatedResponse } = require('../utils/response');
const { Op } = require('sequelize');

const listFolderLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await AuditLog.findAndCountAll({
      where: {
        folder_id: { [Op.not]: null } // 👈 Kunci utamanya: Hanya ambil yang folder_id nya ada isinya
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        // Paranoid: false agar nama folder tetap muncul di log meskipun foldernya sudah dihapus
        { model: Folder, as: 'folder', attributes: ['id', 'name'], paranoid: false }
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset
    });

    return paginatedResponse(res, rows, count, pageNum, limitNum, 'Folder logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};


const listFileLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await AuditLog.findAndCountAll({
      where: {
        file_id: { [Op.not]: null } // 👈 Kunci utamanya: Hanya ambil yang file_id nya ada isinya
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        { model: File, as: 'file', attributes: ['id', 'name'], paranoid: false }
      ],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset
    });

    return paginatedResponse(res, rows, count, pageNum, limitNum, 'File logs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listFolderLogs,
  listFileLogs
};