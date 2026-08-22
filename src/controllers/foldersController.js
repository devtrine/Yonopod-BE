const { Folder, File } = require('../models');
const { successResponse, paginatedResponse } = require('../utils/response');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
const bcrypt = require('bcryptjs');
const { Op, Association } = require('sequelize');

const listFolders = async (req, res, next) => {
  try {
    const { parent_id, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const whereClause = {
      user_id: req.user.id,
      parent_id: parent_id !== undefined ? (parent_id ? parent_id : null) : null
    };

    const { count, rows } = await Folder.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset
    });
    
    return paginatedResponse(res, rows, count, pageNum, limitNum, 'Folders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getFolder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const folder = await Folder.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!folder) {
      throw new NotFoundError('Folder not found or has been moved to trash');
    }

    const fullFolder = await Folder.findOne({
      where: { id, user_id: req.user.id },
      include: [
        { association: 'Children', required: false },
        { association: 'Files', required: false }
      ]
    });

    return successResponse(res, fullFolder, 'Folder retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createFolder = async (req, res, next) => {
  try {
    const { name, parent_id } = req.body;
    if (!name) throw new BadRequestError('Folder name is required');
    
    let path = `/${name}`;
    if (parent_id) {
      const parent = await Folder.findOne({ where: { id: parent_id, user_id: req.user.id } });
      if (!parent) throw new NotFoundError('Parent folder not found');
      path = `${parent.path || ''}/${name}`;
    }

    const folder = await Folder.create({
      user_id: req.user.id,
      name,
      parent_id: parent_id || null,
      path
    });

    return successResponse(res, folder, 'Folder created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, parent_id } = req.body;

    const folder = await Folder.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!folder) throw new NotFoundError('Folder not found');

    // Mencegah folder menjadi parent dari dirinya sendiri
    if (parent_id !== undefined && parent_id === folder.id) {
      throw new BadRequestError('Folder cannot be set as its own parent');
    }

    const oldPath = folder.path;
    if (name !== undefined) folder.name = name;
    
    if (parent_id !== undefined) {
      folder.parent_id = parent_id || null;
      let newParentPath = '';
      if (parent_id) {
        const parent = await Folder.findOne({ where: { id: parent_id, user_id: req.user.id } });
        if (!parent) throw new NotFoundError('Parent folder not found');
        newParentPath = parent.path || '';
      }
      folder.path = `${newParentPath}/${folder.name}`;
    } else if (name !== undefined && oldPath) {
      // Jika nama berubah tapi parent_id tidak, perbarui segmen akhir path
      const pathSegments = oldPath.split('/');
      pathSegments[pathSegments.length - 1] = name;
      folder.path = pathSegments.join('/');
    }

    await folder.save();

    // Opsional: Jika path berubah, perbarui sub-folder di bawahnya
    if (oldPath && oldPath !== folder.path) {
      const children = await Folder.findAll({
        where: {
          user_id: req.user.id,
          path: { [Op.like]: `${oldPath}/%` }
        }
      });

      for (const child of children) {
        child.path = child.path.replace(oldPath, folder.path);
        await child.save();
      }
    }

    return successResponse(res, folder, 'Folder updated successfully');
  } catch (error) {
    next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!folder) throw new NotFoundError('Folder not found');

    // Bawaan Sequelize paranoid: true, destroy() akan mengisi deleted_at
    await folder.destroy();

    return successResponse(res, null, 'Folder soft deleted successfully');
  } catch (error) {
    next(error);
  }
};

const restore = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Gunakan paranoid: false untuk mencari record yang sudah terhapus
    const folder = await Folder.findOne({
      where: { 
        id, 
        user_id: req.user.id,
        deleted_at: { [Op.ne]: null }
      },
      paranoid: false
    });

    if (!folder) throw new NotFoundError('Folder not found in trash');

    // Bawaan Sequelize paranoid: true, restore() akan mengosongkan deleted_at
    await folder.restore();

    return successResponse(res, null, 'Folder restored successfully');
  } catch (error) {
    next(error);
  }
};

const permanentDelete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findOne({
      where: { id, user_id: req.user.id },
      paranoid: false
    });

    if (!folder) throw new NotFoundError('Folder not found');

    // force: true menghapus record secara permanen dari DB
    await folder.destroy({ force: true });

    return successResponse(res, null, 'Folder permanently deleted successfully');
  } catch (error) {
    next(error);
  }
};

const listTrash = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Folder.findAndCountAll({
      where: {
        user_id: req.user.id,
        deleted_at: { [Op.ne]: null } // Ambil HANYA yang deleted_at TIDAK NULL
      },
      order: [['deleted_at', 'DESC']], // Sampah terbaru di atas
      limit: limitNum,
      offset,
      paranoid: false // 🔓 WAJIB: Biar Sequelize mau baca baris yang deleted_at != null
    });

    return paginatedResponse(
      res, 
      rows, 
      count, 
      pageNum, 
      limitNum, 
      'Trash listed successfully'
    );
  } catch (error) {
    next(error); // Error otomatis ditangkap Global Error Handler (format JSON, bukan HTML!)
  }
};

module.exports = {
  listFolders,
  getFolder,
  createFolder,
  updateFolder,
  softDelete,
  restore,
  permanentDelete,
  listTrash
};